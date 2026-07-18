import type { Payment } from "@prisma/client";

import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit/log";
import type { PaymentInput } from "@/features/payments/schemas/payment.schema";

export type ServiceResult<T = void> = { success: true; data: T } | { success: false; error: string };

const AUDIT_ENTITY_TYPE = "order";

/** Statuses under which money can be recorded — never against a draft (no committed prices yet) or a cancelled order. */
const PAYABLE_STATUSES = ["pre_invoice_generated", "pending_payment", "preparing", "ready", "completed"] as const;

function chequeFieldsFor(input: PaymentInput) {
  const isCheque = input.paymentMethod === "cheque";
  return {
    cashPaymentType: isCheque ? null : (input.cashPaymentType ?? null),
    chequeNumber: isCheque ? input.chequeNumber || null : null,
    chequeBankName: isCheque ? input.chequeBankName || null : null,
    chequeIssueDate: isCheque && input.chequeIssueDate ? new Date(input.chequeIssueDate) : null,
    chequeDueDate: isCheque && input.chequeDueDate ? new Date(input.chequeDueDate) : null,
  };
}

/**
 * Registers one payment against an order. Multiple payments per order are
 * the norm (deposit now, cheque later); an amount exceeding the remaining
 * balance is allowed — overpayment/credit is a legitimate business
 * scenario (fixed in UX-FLOW.md) and the UI confirms it, the service
 * doesn't forbid it. What IS forbidden: paying a draft or cancelled order.
 */
export async function registerPayment(orderId: string, input: PaymentInput, userId: string): Promise<ServiceResult<Payment>> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.deletedAt) return { success: false, error: "سفارش یافت نشد" };
  if (!PAYABLE_STATUSES.includes(order.status as (typeof PAYABLE_STATUSES)[number])) {
    return {
      success: false,
      error: order.status === "draft" ? "ابتدا پیش‌نویس را به پیش‌فاکتور تبدیل کنید" : "برای سفارش لغوشده نمی‌توان پرداخت ثبت کرد",
    };
  }

  const payment = await db.payment.create({
    data: {
      orderId,
      paymentMethod: input.paymentMethod,
      amount: BigInt(input.amount),
      paidAt: new Date(),
      notes: input.notes && input.notes.trim() !== "" ? input.notes.trim() : null,
      createdById: userId,
      ...chequeFieldsFor(input),
    },
  });

  await logAuditEvent({
    entityType: AUDIT_ENTITY_TYPE,
    entityId: orderId,
    action: "payment_registered",
    performedById: userId,
    changes: { paymentId: payment.id, amount: input.amount, method: input.paymentMethod },
  });

  return { success: true, data: payment };
}

export async function updatePayment(paymentId: string, input: PaymentInput, userId: string): Promise<ServiceResult<Payment>> {
  const existing = await db.payment.findUnique({ where: { id: paymentId } });
  if (!existing || existing.deletedAt) return { success: false, error: "پرداخت یافت نشد" };

  const payment = await db.payment.update({
    where: { id: paymentId },
    data: {
      paymentMethod: input.paymentMethod,
      amount: BigInt(input.amount),
      notes: input.notes && input.notes.trim() !== "" ? input.notes.trim() : null,
      ...chequeFieldsFor(input),
    },
  });

  await logAuditEvent({
    entityType: AUDIT_ENTITY_TYPE,
    entityId: existing.orderId,
    action: "payment_updated",
    performedById: userId,
    changes: { paymentId, oldAmount: existing.amount.toString(), newAmount: input.amount },
  });

  return { success: true, data: payment };
}

export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface OrderPaymentSummary {
  totalAmount: bigint;
  paidAmount: bigint;
  remainingAmount: bigint;
  paymentStatus: PaymentStatus;
  lastPaymentAt: Date | null;
}

/** Always derived from the payments table at read time — never cached (Database Phase rule). */
export async function getOrderPaymentSummary(orderId: string): Promise<OrderPaymentSummary | null> {
  const order = await db.order.findUnique({
    where: { id: orderId, deletedAt: null },
    include: { payments: { where: { deletedAt: null }, orderBy: { paidAt: "desc" } } },
  });
  if (!order) return null;

  const paidAmount = order.payments.reduce((sum, payment) => sum + payment.amount, 0n);
  const remainingAmount = order.totalAmount - paidAmount;
  const paymentStatus: PaymentStatus = paidAmount === 0n ? "unpaid" : remainingAmount <= 0n ? "paid" : "partial";

  return {
    totalAmount: order.totalAmount,
    paidAmount,
    remainingAmount,
    paymentStatus,
    lastPaymentAt: order.payments[0]?.paidAt ?? null,
  };
}
