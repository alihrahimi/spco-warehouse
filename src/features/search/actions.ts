"use server";

import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export interface GlobalSearchResults {
  customers: { id: string; name: string; customerCode: string; mobile: string }[];
  products: { id: string; name: string; productCode: string }[];
  /** Orders and pre-invoices are one entity sharing one number (Phase 13) — a number match satisfies both "orders" and "invoices" search. */
  orders: { id: string; orderNumber: string | null; customerName: string; status: string }[];
  payments: { id: string; orderId: string; orderNumber: string | null; chequeNumber: string | null; amount: string }[];
}

const EMPTY_RESULTS: GlobalSearchResults = { customers: [], products: [], orders: [], payments: [] };

/**
 * Global search (Phase 14) across the four entity families, five results
 * per group — a navigation aid, not a report (each module's own list page
 * remains the exhaustive search surface). Payments match by cheque number,
 * the identifier staff actually hold in hand when a cheque resurfaces.
 *
 * Each family is gated on its own view permission — a session having
 * `orders:view` (warehouse staff, for their own order-entry work) must
 * never leak `payments:view`-only data (cheque numbers/amounts) through
 * this shared search, so every branch checks its own permission rather
 * than one blanket `requireSession()` covering all four.
 */
export async function globalSearchAction(query: string): Promise<GlobalSearchResults> {
  const session = await requireSession();
  const trimmed = query.trim();
  if (trimmed.length < 2) return EMPTY_RESULTS;

  const role = session.user.role;
  const canViewCustomers = hasPermission(role, "customers:view");
  const canViewProducts = hasPermission(role, "products:view");
  const canViewOrders = hasPermission(role, "orders:view");
  const canViewPayments = hasPermission(role, "payments:view");

  // No `mode: "insensitive"` anywhere below — Postgres/MongoDB-only, errors
  // on SQLite. SQLite's default LIKE is already case-insensitive for ASCII,
  // and Persian script has no case distinction, so behavior is unaffected.
  const [customers, products, orders, payments] = await Promise.all([
    canViewCustomers
      ? db.customer.findMany({
          where: {
            deletedAt: null,
            OR: [{ name: { contains: trimmed } }, { mobile: { contains: trimmed } }, { customerCode: { contains: trimmed } }],
          },
          take: 5,
          select: { id: true, name: true, customerCode: true, mobile: true },
        })
      : [],
    canViewProducts
      ? db.product.findMany({
          where: {
            deletedAt: null,
            OR: [{ name: { contains: trimmed } }, { productCode: { contains: trimmed } }],
          },
          take: 5,
          select: { id: true, name: true, productCode: true },
        })
      : [],
    canViewOrders
      ? db.order.findMany({
          where: {
            deletedAt: null,
            OR: [{ orderNumber: { contains: trimmed } }, { customer: { name: { contains: trimmed } } }],
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, orderNumber: true, status: true, customer: { select: { name: true } } },
        })
      : [],
    canViewPayments
      ? db.payment.findMany({
          where: { deletedAt: null, chequeNumber: { contains: trimmed } },
          orderBy: { paidAt: "desc" },
          take: 5,
          select: { id: true, orderId: true, chequeNumber: true, amount: true, order: { select: { orderNumber: true } } },
        })
      : [],
  ]);

  return {
    customers,
    products,
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      status: order.status,
    })),
    payments: payments.map((payment) => ({
      id: payment.id,
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
      chequeNumber: payment.chequeNumber,
      amount: payment.amount.toString(),
    })),
  };
}
