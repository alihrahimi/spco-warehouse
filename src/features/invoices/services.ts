import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit/log";
import { getOrderPaymentSummary, type OrderPaymentSummary } from "@/features/payments/services";

export type ServiceResult<T = void> = { success: true; data: T } | { success: false; error: string };

const AUDIT_ENTITY_TYPE = "order";

export interface InvoiceRenderData {
  orderId: string;
  orderNumber: string;
  generatedAt: Date;
  /** Frozen at generation time — NEVER live CompanySettings (Phase 03 addendum). */
  company: {
    name: string;
    logoFilePath: string | null;
    phoneNumbers: { phoneNumber: string; label: string | null }[];
    whatsapp: string | null;
    telegram: string | null;
    instagram: string | null;
    address: string | null;
    footerText: string | null;
  };
  customer: {
    name: string;
    customerCode: string;
    mobile: string;
    address: string | null;
  };
  items: {
    productName: string;
    productCode: string;
    pieceName: string;
    sizeLabel: string;
    packQuantity: number;
    unitQuantity: number;
    packSize: number;
    totalUnits: number;
    unitPrice: bigint;
    totalPrice: bigint;
  }[];
  totalAmount: bigint;
  payment: OrderPaymentSummary;
  customerNotes: string | null;
}

/**
 * Assembles everything the pre-invoice renders (print page and PDF share
 * this one source). Items come from their frozen order snapshots and
 * company identity from the frozen `InvoiceDocument` row — the only live
 * reads are the payment summary (deliberately current, per the Database
 * Phase: money received is always shown as of now) and customer contact
 * info.
 */
export async function getInvoiceRenderData(orderId: string): Promise<ServiceResult<InvoiceRenderData>> {
  const order = await db.order.findUnique({
    where: { id: orderId, deletedAt: null },
    include: { customer: true, items: true, invoiceDocument: true },
  });
  if (!order) return { success: false, error: "سفارش یافت نشد" };
  if (!order.invoiceDocument || !order.orderNumber) {
    return { success: false, error: "برای این سفارش هنوز پیش‌فاکتوری صادر نشده است" };
  }

  const payment = await getOrderPaymentSummary(orderId);
  if (!payment) return { success: false, error: "سفارش یافت نشد" };

  const snapshot = order.invoiceDocument;
  const phoneNumbers = Array.isArray(snapshot.phoneNumbersSnapshot)
    ? (snapshot.phoneNumbersSnapshot as { phoneNumber: string; label: string | null }[])
    : [];

  return {
    success: true,
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      generatedAt: snapshot.generatedAt,
      company: {
        name: snapshot.companyNameSnapshot,
        logoFilePath: snapshot.companyLogoSnapshot,
        phoneNumbers,
        whatsapp: snapshot.whatsappSnapshot,
        telegram: snapshot.telegramSnapshot,
        instagram: snapshot.instagramSnapshot,
        address: snapshot.addressSnapshot,
        footerText: snapshot.footerTextSnapshot,
      },
      customer: {
        name: order.customer.name,
        customerCode: order.customer.customerCode,
        mobile: order.customer.mobile,
        address: order.customer.address,
      },
      items: order.items.map((item) => ({
        productName: item.productNameSnapshot,
        productCode: item.productCodeSnapshot,
        pieceName: item.pieceNameSnapshot,
        sizeLabel: item.sizeLabelSnapshot,
        packQuantity: item.packQuantity,
        unitQuantity: item.unitQuantity,
        packSize: item.packSizeSnapshot,
        totalUnits: item.totalUnits,
        unitPrice: item.unitPriceSnapshot,
        totalPrice: item.totalPrice,
      })),
      totalAmount: order.totalAmount,
      payment,
      customerNotes: order.customerNotes,
    },
  };
}

export async function recordInvoicePrinted(orderId: string, userId: string): Promise<void> {
  await logAuditEvent({ entityType: AUDIT_ENTITY_TYPE, entityId: orderId, action: "invoice_printed", performedById: userId });
}

export async function recordPdfExported(orderId: string, userId: string, pdfFilePath: string): Promise<void> {
  await db.invoiceDocument.updateMany({ where: { orderId }, data: { pdfFilePath } });
  await logAuditEvent({
    entityType: AUDIT_ENTITY_TYPE,
    entityId: orderId,
    action: "pdf_exported",
    performedById: userId,
    changes: { pdfFilePath },
  });
}
