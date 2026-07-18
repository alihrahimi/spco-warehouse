"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import { paymentSchema, type PaymentInput } from "@/features/payments/schemas/payment.schema";
import { registerPayment, updatePayment } from "@/features/payments/services";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

function zodFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function registerPaymentAction(orderId: string, input: PaymentInput): Promise<ActionResult> {
  const session = await requirePermission("payments:create");

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "اطلاعات پرداخت معتبر نیست", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  const result = await registerPayment(orderId, parsed.data, session.user.id);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { success: true, data: undefined };
}

export async function updatePaymentAction(paymentId: string, orderId: string, input: PaymentInput): Promise<ActionResult> {
  const session = await requirePermission("payments:create");

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "اطلاعات پرداخت معتبر نیست", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  const result = await updatePayment(paymentId, parsed.data, session.user.id);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { success: true, data: undefined };
}
