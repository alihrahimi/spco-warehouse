import { db } from "@/lib/db";
import { tehranStartOfToday } from "@/lib/format/date";

/**
 * All dashboard stats in one `Promise.all` sweep — every figure is a real
 * aggregate over live tables, never cached counters (the Database Phase's
 * derive-don't-cache rule applied to reporting). "Today" follows Tehran's
 * clock via `tehranStartOfToday`.
 */

export interface DashboardStats {
  todayOrders: number;
  preparingOrders: number;
  readyOrders: number;
  completedToday: number;
  pendingPayments: { count: number; totalOutstanding: bigint };
  recentPayments: { id: string; amount: bigint; paidAt: Date; orderId: string; orderNumber: string | null; customerName: string }[];
  topProducts: { productName: string; productCode: string; totalUnits: number; totalAmount: bigint }[];
  topCustomers: { customerId: string; customerName: string; customerCode: string; orderCount: number; totalAmount: bigint }[];
  recentActivity: { id: string; action: string; entityType: string; performedByName: string; createdAt: Date }[];
}

function toBigint(value: string | number | bigint): bigint {
  return typeof value === "bigint" ? value : BigInt(value);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const todayStart = tehranStartOfToday();

  const [
    todayOrders,
    preparingOrders,
    readyOrders,
    completedToday,
    pendingRaw,
    recentPaymentsRaw,
    topProductsRaw,
    topCustomersRaw,
    recentActivityRaw,
  ] = await Promise.all([
    db.order.count({ where: { deletedAt: null, status: { not: "draft" }, createdAt: { gte: todayStart } } }),
    db.order.count({ where: { deletedAt: null, status: "preparing" } }),
    db.order.count({ where: { deletedAt: null, status: "ready" } }),
    db.order.count({ where: { deletedAt: null, status: "completed", updatedAt: { gte: todayStart } } }),
    // Correlated scalar subquery instead of `LEFT JOIN LATERAL` — a derived
    // table wrapping the per-order paid amount so it can be filtered on in
    // the outer WHERE, using plain ANSI SQL rather than a Postgres-specific
    // join form.
    db.$queryRaw<[{ count: string | number | bigint; total: string | number | bigint }]>`
      SELECT COUNT(*) AS count, COALESCE(SUM(sub.total_amount - sub.paid), 0) AS total
      FROM (
        SELECT
          o.total_amount,
          COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.order_id = o.id AND p.deleted_at IS NULL), 0) AS paid
        FROM orders o
        WHERE o.deleted_at IS NULL AND o.status NOT IN ('draft', 'cancelled')
      ) sub
      WHERE sub.total_amount > sub.paid
    `,
    db.payment.findMany({
      where: { deletedAt: null },
      orderBy: { paidAt: "desc" },
      take: 5,
      include: { order: { select: { id: true, orderNumber: true, customer: { select: { name: true } } } } },
    }),
    db.$queryRaw<{ productName: string; productCode: string; totalUnits: string | number | bigint; totalAmount: string | number | bigint }[]>`
      SELECT
        oi.product_name_snapshot AS "productName",
        oi.product_code_snapshot AS "productCode",
        SUM(oi.total_units) AS "totalUnits",
        SUM(oi.total_price) AS "totalAmount"
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.deleted_at IS NULL AND o.status NOT IN ('draft', 'cancelled')
      GROUP BY oi.product_code_snapshot, oi.product_name_snapshot
      ORDER BY SUM(oi.total_units) DESC
      LIMIT 5
    `,
    db.$queryRaw<{ customerId: string; customerName: string; customerCode: string; orderCount: string | number | bigint; totalAmount: string | number | bigint }[]>`
      SELECT
        c.id AS "customerId",
        c.name AS "customerName",
        c.customer_code AS "customerCode",
        COUNT(o.id) AS "orderCount",
        COALESCE(SUM(o.total_amount), 0) AS "totalAmount"
      FROM customers c
      JOIN orders o ON o.customer_id = c.id AND o.deleted_at IS NULL AND o.status NOT IN ('draft', 'cancelled')
      WHERE c.deleted_at IS NULL
      GROUP BY c.id, c.name, c.customer_code
      ORDER BY SUM(o.total_amount) DESC
      LIMIT 5
    `,
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { performedBy: { select: { fullName: true } } },
    }),
  ]);

  return {
    todayOrders,
    preparingOrders,
    readyOrders,
    completedToday,
    pendingPayments: {
      count: Number(pendingRaw[0]?.count ?? 0),
      totalOutstanding: toBigint(pendingRaw[0]?.total ?? 0n),
    },
    recentPayments: recentPaymentsRaw.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      paidAt: payment.paidAt,
      orderId: payment.order.id,
      orderNumber: payment.order.orderNumber,
      customerName: payment.order.customer.name,
    })),
    topProducts: topProductsRaw.map((row) => ({
      productName: row.productName,
      productCode: row.productCode,
      totalUnits: Number(row.totalUnits),
      totalAmount: toBigint(row.totalAmount),
    })),
    topCustomers: topCustomersRaw.map((row) => ({
      customerId: row.customerId,
      customerName: row.customerName,
      customerCode: row.customerCode,
      orderCount: Number(row.orderCount),
      totalAmount: toBigint(row.totalAmount),
    })),
    recentActivity: recentActivityRaw.map((entry) => ({
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      performedByName: entry.performedBy.fullName,
      createdAt: entry.createdAt,
    })),
  };
}

export interface WarehouseDashboardData {
  todayOrderCount: number;
  draftOrders: { id: string; customerName: string; updatedAt: Date; itemCount: number }[];
}

/**
 * Deliberately separate from `getDashboardStats()` — the Warehouse
 * Dashboard (final-revision requirement #1) is a different application,
 * not a filtered view of the management one, so it never runs the
 * management dashboard's report-shaped aggregates (top products/
 * customers, payment totals) at all, even ones a warehouse session
 * couldn't render. Drafts are shared across the whole floor (not scoped
 * to `createdById`) so any staff member can continue a colleague's
 * unfinished order — matching `orders:view`'s existing shared-visibility
 * model.
 */
export async function getWarehouseDashboardData(): Promise<WarehouseDashboardData> {
  const todayStart = tehranStartOfToday();

  const [todayOrderCount, draftOrders] = await Promise.all([
    db.order.count({ where: { deletedAt: null, status: { not: "draft" }, createdAt: { gte: todayStart } } }),
    db.order.findMany({
      where: { deletedAt: null, status: "draft" },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        updatedAt: true,
        customer: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return {
    todayOrderCount,
    draftOrders: draftOrders.map((order) => ({
      id: order.id,
      customerName: order.customer.name,
      updatedAt: order.updatedAt,
      itemCount: order._count.items,
    })),
  };
}
