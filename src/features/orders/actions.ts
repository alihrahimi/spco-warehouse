"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import type { OrderStatus } from "@/lib/enums";
import {
  orderSearchSchema,
  saveDraftSchema,
  updateOrderSchema,
  type OrderSearchInput,
  type SaveDraftInput,
  type UpdateOrderInput,
} from "@/features/orders/schemas/order.schema";
import {
  changeOrderStatus,
  convertDraftToPreInvoice,
  deleteDraft,
  duplicateOrder,
  getOrderVersions,
  listOrders,
  saveDraft,
  updateOrderWithVersion,
  type OrderListResult,
} from "@/features/orders/services";
import { recordInvoicePrinted } from "@/features/invoices/services";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function saveDraftAction(input: SaveDraftInput): Promise<ActionResult<{ orderId: string }>> {
  const session = await requirePermission("orders:create");

  const parsed = saveDraftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات سفارش معتبر نیست" };

  const result = await saveDraft(parsed.data, session.user.id);
  if (!result.success) return result;

  revalidatePath("/orders");
  return { success: true, data: result.data };
}

export async function deleteDraftAction(orderId: string): Promise<ActionResult> {
  await requirePermission("orders:delete");

  const result = await deleteDraft(orderId);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/orders");
  return { success: true, data: undefined };
}

export async function convertDraftToPreInvoiceAction(orderId: string): Promise<ActionResult<{ orderNumber: string }>> {
  const session = await requirePermission("orders:create");

  const result = await convertDraftToPreInvoice(orderId, session.user.id);
  if (!result.success) return result;

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { success: true, data: result.data };
}

export async function updateOrderAction(input: UpdateOrderInput): Promise<ActionResult> {
  const session = await requirePermission("orders:edit");

  const parsed = updateOrderSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات سفارش معتبر نیست" };

  const result = await updateOrderWithVersion(parsed.data, session.user.id);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/orders");
  revalidatePath(`/orders/${input.orderId}`);
  return { success: true, data: undefined };
}

export async function changeOrderStatusAction(orderId: string, status: OrderStatus): Promise<ActionResult> {
  const session = await requirePermission("orders:status");

  const result = await changeOrderStatus(orderId, status, session.user.id);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { success: true, data: undefined };
}

export async function duplicateOrderAction(orderId: string): Promise<ActionResult<{ orderId: string; skippedItems: string[] }>> {
  const session = await requirePermission("orders:create");

  const result = await duplicateOrder(orderId, session.user.id);
  if (!result.success) return result;

  revalidatePath("/orders");
  return { success: true, data: result.data };
}

/** A read invoked as a Server Action for the same reason as the customer/product lists — called from the interactive Client Component list. */
export async function listOrdersAction(input: OrderSearchInput): Promise<ActionResult<OrderListResult>> {
  await requirePermission("orders:view");

  const parsed = orderSearchSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "پارامترهای جستجو معتبر نیست" };

  const data = await listOrders(parsed.data);
  return { success: true, data };
}

/** Fired by the print page's print button — the Phase 13 "Invoice Printed" audit event. */
export async function recordInvoicePrintedAction(orderId: string): Promise<ActionResult> {
  const session = await requirePermission("orders:view");
  await recordInvoicePrinted(orderId, session.user.id);
  return { success: true, data: undefined };
}

export interface OrderVersionRow {
  id: string;
  versionNumber: number;
  reason: string | null;
  createdByName: string;
  createdAt: Date;
  snapshot: unknown;
}

/** Phase 13: "Allow administrators to view previous versions" — gated on the admin-only users:manage permission, the catalog's existing administrator marker. */
export async function getOrderVersionsAction(orderId: string): Promise<ActionResult<OrderVersionRow[]>> {
  await requirePermission("users:manage");
  const versions = await getOrderVersions(orderId);
  return {
    success: true,
    data: versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      reason: version.reason,
      createdByName: version.createdBy.fullName,
      createdAt: version.createdAt,
      snapshot: version.snapshot,
    })),
  };
}
