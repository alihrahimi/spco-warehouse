"use server";

import { requirePermission } from "@/lib/auth/session";
import {
  getOutstandingBalancesReport,
  getPaymentsReport,
  getSalesReport,
  getTopCustomersReport,
  getTopProductsReport,
  type DateRangeParams,
  type OutstandingBalanceRow,
  type PaymentsReportRow,
  type SalesReport,
  type TopCustomerRow,
  type TopProductRow,
} from "@/features/reports/services";

export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

/** Every report is gated on the dedicated `reports:view` permission — deliberately not `orders:view`/`payments:view`, since warehouse staff hold those for their own order-entry work without gaining report access. */
export async function getSalesReportAction(params: DateRangeParams): Promise<ActionResult<SalesReport>> {
  await requirePermission("reports:view");
  return { success: true, data: await getSalesReport(params) };
}

export async function getOutstandingBalancesAction(): Promise<ActionResult<OutstandingBalanceRow[]>> {
  await requirePermission("reports:view");
  return { success: true, data: await getOutstandingBalancesReport() };
}

export async function getTopProductsReportAction(params: DateRangeParams): Promise<ActionResult<TopProductRow[]>> {
  await requirePermission("reports:view");
  return { success: true, data: await getTopProductsReport(params) };
}

export async function getTopCustomersReportAction(params: DateRangeParams): Promise<ActionResult<TopCustomerRow[]>> {
  await requirePermission("reports:view");
  return { success: true, data: await getTopCustomersReport(params) };
}

export async function getPaymentsReportAction(
  params: DateRangeParams,
): Promise<ActionResult<{ rows: PaymentsReportRow[]; totalAmount: bigint }>> {
  await requirePermission("reports:view");
  return { success: true, data: await getPaymentsReport(params) };
}
