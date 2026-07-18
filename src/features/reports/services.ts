import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Phase 14 reporting queries. Every report excludes drafts and cancelled
 * orders (they are not sales), takes an optional Gregorian date range
 * (the UI's Jalali pickers convert), and derives money figures from the
 * payments table live — no cached report tables to drift.
 */

function toBigint(value: string | number | bigint): bigint {
  return typeof value === "bigint" ? value : BigInt(value);
}

function rangeClause(alias: string, dateFrom?: string, dateTo?: string): Prisma.Sql {
  const column = Prisma.raw(`${alias}.created_at`);
  return Prisma.sql`
    ${dateFrom ? Prisma.sql`AND ${column} >= ${new Date(dateFrom)}` : Prisma.empty}
    ${dateTo ? Prisma.sql`AND ${column} <= ${new Date(dateTo)}` : Prisma.empty}
  `;
}

export interface DateRangeParams {
  dateFrom?: string;
  dateTo?: string;
}

// ---------------------------------------------------------------------------

export interface SalesReport {
  orderCount: number;
  totalUnits: number;
  totalAmount: bigint;
  paidAmount: bigint;
  rows: {
    orderId: string;
    orderNumber: string | null;
    customerName: string;
    createdAt: Date;
    status: string;
    totalUnits: number;
    totalAmount: bigint;
    paidAmount: bigint;
  }[];
}

/** The Orders/Sales report — per-order lines plus range totals. Capped at 500 rows per run; narrower ranges are the intended workflow for bigger histories. */
export async function getSalesReport(params: DateRangeParams): Promise<SalesReport> {
  const rows = await db.$queryRaw<
    {
      orderId: string;
      orderNumber: string | null;
      customerName: string;
      createdAt: Date;
      status: string;
      totalUnits: string | number | bigint;
      totalAmount: string | number | bigint;
      paidAmount: string | number | bigint;
    }[]
  >`
    SELECT
      o.id AS "orderId",
      o.order_number AS "orderNumber",
      c.name AS "customerName",
      o.created_at AS "createdAt",
      o.status AS status,
      COALESCE((SELECT SUM(oi.total_units) FROM order_items oi WHERE oi.order_id = o.id), 0) AS "totalUnits",
      o.total_amount AS "totalAmount",
      COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.order_id = o.id AND p.deleted_at IS NULL), 0) AS "paidAmount"
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.deleted_at IS NULL AND o.status NOT IN ('draft', 'cancelled')
    ${rangeClause("o", params.dateFrom, params.dateTo)}
    ORDER BY o.created_at DESC
    LIMIT 500
  `;

  const mapped = rows.map((row) => ({
    ...row,
    totalUnits: Number(row.totalUnits),
    totalAmount: toBigint(row.totalAmount),
    paidAmount: toBigint(row.paidAmount),
  }));

  return {
    orderCount: mapped.length,
    totalUnits: mapped.reduce((sum, row) => sum + row.totalUnits, 0),
    totalAmount: mapped.reduce((sum, row) => sum + row.totalAmount, 0n),
    paidAmount: mapped.reduce((sum, row) => sum + row.paidAmount, 0n),
    rows: mapped,
  };
}

// ---------------------------------------------------------------------------

export interface OutstandingBalanceRow {
  customerId: string;
  customerName: string;
  customerCode: string;
  mobile: string;
  orderCount: number;
  totalAmount: bigint;
  paidAmount: bigint;
  outstanding: bigint;
}

/** Outstanding Balances — one row per customer that still owes money, largest debt first. */
export async function getOutstandingBalancesReport(): Promise<OutstandingBalanceRow[]> {
  const rows = await db.$queryRaw<
    {
      customerId: string;
      customerName: string;
      customerCode: string;
      mobile: string;
      orderCount: string | number | bigint;
      totalAmount: string | number | bigint;
      paidAmount: string | number | bigint;
    }[]
  >`
    SELECT
      c.id AS "customerId",
      c.name AS "customerName",
      c.customer_code AS "customerCode",
      c.mobile,
      COUNT(o.id) AS "orderCount",
      COALESCE(SUM(o.total_amount), 0) AS "totalAmount",
      COALESCE(SUM(paid_per_order.paid), 0) AS "paidAmount"
    FROM customers c
    JOIN orders o ON o.customer_id = c.id AND o.deleted_at IS NULL AND o.status NOT IN ('draft', 'cancelled')
    LEFT JOIN (
      SELECT order_id, SUM(amount) AS paid FROM payments WHERE deleted_at IS NULL GROUP BY order_id
    ) paid_per_order ON paid_per_order.order_id = o.id
    WHERE c.deleted_at IS NULL
    GROUP BY c.id, c.name, c.customer_code, c.mobile
    HAVING COALESCE(SUM(o.total_amount), 0) > COALESCE(SUM(paid_per_order.paid), 0)
    ORDER BY COALESCE(SUM(o.total_amount), 0) - COALESCE(SUM(paid_per_order.paid), 0) DESC
    LIMIT 500
  `;

  return rows.map((row) => {
    const totalAmount = toBigint(row.totalAmount);
    const paidAmount = toBigint(row.paidAmount);
    return {
      customerId: row.customerId,
      customerName: row.customerName,
      customerCode: row.customerCode,
      mobile: row.mobile,
      orderCount: Number(row.orderCount),
      totalAmount,
      paidAmount,
      outstanding: totalAmount - paidAmount,
    };
  });
}

// ---------------------------------------------------------------------------

export interface TopProductRow {
  productName: string;
  productCode: string;
  pieceName: string;
  totalPacks: number;
  totalUnits: number;
  totalAmount: bigint;
}

/** Top Selling Products in a range, at product+piece grain (the grain the warehouse actually restocks at). */
export async function getTopProductsReport(params: DateRangeParams): Promise<TopProductRow[]> {
  const rows = await db.$queryRaw<
    { productName: string; productCode: string; pieceName: string; totalPacks: string | number | bigint; totalUnits: string | number | bigint; totalAmount: string | number | bigint }[]
  >`
    SELECT
      oi.product_name_snapshot AS "productName",
      oi.product_code_snapshot AS "productCode",
      oi.piece_name_snapshot AS "pieceName",
      SUM(oi.pack_quantity) AS "totalPacks",
      SUM(oi.total_units) AS "totalUnits",
      SUM(oi.total_price) AS "totalAmount"
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.deleted_at IS NULL AND o.status NOT IN ('draft', 'cancelled')
    ${rangeClause("o", params.dateFrom, params.dateTo)}
    GROUP BY oi.product_code_snapshot, oi.product_name_snapshot, oi.piece_name_snapshot
    ORDER BY SUM(oi.total_units) DESC
    LIMIT 100
  `;

  return rows.map((row) => ({
    productName: row.productName,
    productCode: row.productCode,
    pieceName: row.pieceName,
    totalPacks: Number(row.totalPacks),
    totalUnits: Number(row.totalUnits),
    totalAmount: toBigint(row.totalAmount),
  }));
}

// ---------------------------------------------------------------------------

export interface TopCustomerRow {
  customerId: string;
  customerName: string;
  customerCode: string;
  orderCount: number;
  totalUnits: number;
  totalAmount: bigint;
}

export async function getTopCustomersReport(params: DateRangeParams): Promise<TopCustomerRow[]> {
  const rows = await db.$queryRaw<
    { customerId: string; customerName: string; customerCode: string; orderCount: string | number | bigint; totalUnits: string | number | bigint; totalAmount: string | number | bigint }[]
  >`
    SELECT
      c.id AS "customerId",
      c.name AS "customerName",
      c.customer_code AS "customerCode",
      COUNT(DISTINCT o.id) AS "orderCount",
      COALESCE(SUM(oi.total_units), 0) AS "totalUnits",
      COALESCE(SUM(oi.total_price), 0) AS "totalAmount"
    FROM customers c
    JOIN orders o ON o.customer_id = c.id AND o.deleted_at IS NULL AND o.status NOT IN ('draft', 'cancelled')
    JOIN order_items oi ON oi.order_id = o.id
    WHERE c.deleted_at IS NULL
    ${rangeClause("o", params.dateFrom, params.dateTo)}
    GROUP BY c.id, c.name, c.customer_code
    ORDER BY SUM(oi.total_price) DESC
    LIMIT 100
  `;

  return rows.map((row) => ({
    customerId: row.customerId,
    customerName: row.customerName,
    customerCode: row.customerCode,
    orderCount: Number(row.orderCount),
    totalUnits: Number(row.totalUnits),
    totalAmount: toBigint(row.totalAmount),
  }));
}

// ---------------------------------------------------------------------------

export interface PaymentsReportRow {
  paymentId: string;
  paidAt: Date;
  amount: bigint;
  paymentMethod: string;
  chequeNumber: string | null;
  chequeBankName: string | null;
  chequeDueDate: Date | null;
  orderId: string;
  orderNumber: string | null;
  customerName: string;
  registeredByName: string;
}

export async function getPaymentsReport(params: DateRangeParams): Promise<{ rows: PaymentsReportRow[]; totalAmount: bigint }> {
  const payments = await db.payment.findMany({
    where: {
      deletedAt: null,
      ...(params.dateFrom || params.dateTo
        ? {
            paidAt: {
              ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
              ...(params.dateTo ? { lte: new Date(params.dateTo) } : {}),
            },
          }
        : {}),
    },
    orderBy: { paidAt: "desc" },
    take: 500,
    include: {
      order: { select: { id: true, orderNumber: true, customer: { select: { name: true } } } },
      createdBy: { select: { fullName: true } },
    },
  });

  const rows = payments.map((payment) => ({
    paymentId: payment.id,
    paidAt: payment.paidAt,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    chequeNumber: payment.chequeNumber,
    chequeBankName: payment.chequeBankName,
    chequeDueDate: payment.chequeDueDate,
    orderId: payment.order.id,
    orderNumber: payment.order.orderNumber,
    customerName: payment.order.customer.name,
    registeredByName: payment.createdBy.fullName,
  }));

  return { rows, totalAmount: rows.reduce((sum, row) => sum + row.amount, 0n) };
}
