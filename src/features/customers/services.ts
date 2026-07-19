import { Prisma, type Customer } from "@prisma/client";

import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit/log";
import { generateCustomerCode } from "@/lib/customer/customer-code";
import type { CustomerStatus, PaymentMethod } from "@/lib/enums";
import type { CustomerInput, CustomerSearchInput } from "@/features/customers/schemas/customer.schema";

export type ServiceResult<T = void> = { success: true; data: T } | { success: false; error: string };

const AUDIT_ENTITY_TYPE = "customer";

/** Normalizes the optional string fields Zod allows as `""` into `null` for storage — an empty form field means "not set", not a stored empty string. */
function emptyToNull(value: string | undefined): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

async function isMobileTaken(mobile: string, excludeCustomerId?: string): Promise<boolean> {
  const existing = await db.customer.findFirst({
    where: {
      mobile,
      deletedAt: null,
      ...(excludeCustomerId ? { id: { not: excludeCustomerId } } : {}),
    },
    select: { id: true },
  });
  return existing !== null;
}

export async function createCustomer(input: CustomerInput, performedById: string): Promise<ServiceResult<Customer>> {
  if (await isMobileTaken(input.mobile)) {
    return { success: false, error: "این شماره موبایل قبلاً برای مشتری دیگری ثبت شده است" };
  }

  const customerCode = await generateCustomerCode();

  const customer = await db.customer.create({
    data: {
      customerCode,
      name: input.name,
      mobile: input.mobile,
      defaultPaymentType: input.defaultPaymentType,
      phone: emptyToNull(input.phone),
      province: emptyToNull(input.province),
      city: emptyToNull(input.city),
      address: emptyToNull(input.address),
      notes: emptyToNull(input.notes),
    },
  });

  await logAuditEvent({
    entityType: AUDIT_ENTITY_TYPE,
    entityId: customer.id,
    action: "created",
    performedById,
  });

  return { success: true, data: customer };
}

export async function updateCustomer(
  customerId: string,
  input: CustomerInput,
  performedById: string,
): Promise<ServiceResult<Customer>> {
  const existing = await db.customer.findUnique({ where: { id: customerId } });
  if (!existing || existing.deletedAt) {
    return { success: false, error: "مشتری یافت نشد" };
  }

  if (await isMobileTaken(input.mobile, customerId)) {
    return { success: false, error: "این شماره موبایل قبلاً برای مشتری دیگری ثبت شده است" };
  }

  const paymentTypeChanged = existing.defaultPaymentType !== input.defaultPaymentType;

  const customer = await db.customer.update({
    where: { id: customerId },
    data: {
      name: input.name,
      mobile: input.mobile,
      defaultPaymentType: input.defaultPaymentType,
      phone: emptyToNull(input.phone),
      province: emptyToNull(input.province),
      city: emptyToNull(input.city),
      address: emptyToNull(input.address),
      notes: emptyToNull(input.notes),
    },
  });

  await logAuditEvent({
    entityType: AUDIT_ENTITY_TYPE,
    entityId: customer.id,
    action: "updated",
    performedById,
  });

  // A payment-type change gets its own audit action too, per Phase 11's
  // explicit tracked-action list — in addition to the generic "updated"
  // entry above, not instead of it, since both are true simultaneously.
  if (paymentTypeChanged) {
    await logAuditEvent({
      entityType: AUDIT_ENTITY_TYPE,
      entityId: customer.id,
      action: "payment_type_changed",
      performedById,
      changes: { from: existing.defaultPaymentType, to: input.defaultPaymentType },
    });
  }

  return { success: true, data: customer };
}

/**
 * The only "delete" operation Customer Management has, per Phase 11:
 * setting `status = inactive` (or `blocked`) — the row and every historical
 * order referencing it are untouched. `deletedAt` is never set here.
 */
export async function changeCustomerStatus(
  customerId: string,
  newStatus: CustomerStatus,
  performedById: string,
): Promise<ServiceResult<Customer>> {
  const existing = await db.customer.findUnique({ where: { id: customerId } });
  if (!existing || existing.deletedAt) {
    return { success: false, error: "مشتری یافت نشد" };
  }

  if (existing.status === newStatus) {
    return { success: true, data: existing };
  }

  const customer = await db.customer.update({ where: { id: customerId }, data: { status: newStatus } });

  await logAuditEvent({
    entityType: AUDIT_ENTITY_TYPE,
    entityId: customer.id,
    action: "status_changed",
    performedById,
    changes: { from: existing.status, to: newStatus },
  });

  return { success: true, data: customer };
}

export async function toggleFavoriteCustomer(customerId: string, isFavorite: boolean): Promise<ServiceResult<Customer>> {
  const existing = await db.customer.findUnique({ where: { id: customerId } });
  if (!existing || existing.deletedAt) {
    return { success: false, error: "مشتری یافت نشد" };
  }

  const customer = await db.customer.update({ where: { id: customerId }, data: { isFavorite } });
  // Not audited: a favorite/pin toggle is a personal UX preference, not
  // one of Phase 11's four tracked business actions.
  return { success: true, data: customer };
}

export interface CustomerListRow {
  id: string;
  customerCode: string;
  name: string;
  mobile: string;
  defaultPaymentType: PaymentMethod;
  status: CustomerStatus;
  isFavorite: boolean;
  city: string | null;
  lastOrderDate: Date | null;
  outstandingBalance: bigint;
}

export interface CustomerListResult {
  rows: CustomerListRow[];
  totalCount: number;
}

const SORT_COLUMN_SQL: Record<CustomerSearchInput["sortBy"], Prisma.Sql> = {
  name: Prisma.sql`c.name`,
  createdAt: Prisma.sql`c.created_at`,
  lastOrderDate: Prisma.sql`"lastOrderDate"`,
};

/**
 * Server-side paginated, searched, sorted customer list — required at
 * "tens of thousands of customers" scale (Phase 11), which rules out
 * fetching every row and filtering client-side. `lastOrderDate` and
 * `outstandingBalance` are correlated per-customer aggregates that
 * Prisma's query builder cannot express in one round trip, so this is raw
 * SQL with correlated scalar subqueries — one query for the page of rows,
 * one lightweight `COUNT(*)` for total pages.
 *
 * Search matches name/mobile/customerCode/city via `ILIKE`, which is a
 * sequential scan for the leading-wildcard name case at very large table
 * sizes. `mobile`/`customer_code` are effectively exact/prefix lookups
 * covered well by their existing B-tree indexes; genuinely fast fuzzy
 * Persian name search at huge scale needs a `pg_trgm` GIN index — a real,
 * flagged follow-up (adding a Postgres extension is an infra decision, not
 * something to do silently in an application-layer migration), not
 * implemented here.
 */
/**
 * Raw-row shape as it actually comes back over `$queryRaw` — `node-postgres`
 * (the driver behind `@prisma/adapter-pg`) parses `NUMERIC`/`BIGINT`
 * aggregate results as JS `string` by default (to avoid silent precision
 * loss), not `bigint`. `normalizeBigint` below converts whichever of
 * string/number/bigint actually arrives into a real `bigint` before this
 * data reaches callers, so `CustomerListRow`'s public type (`bigint`) is
 * never a lie callers have to defend against themselves.
 */
type RawCustomerListRow = Omit<CustomerListRow, "outstandingBalance"> & { outstandingBalance: string | number | bigint };

function normalizeBigint(value: string | number | bigint): bigint {
  return typeof value === "bigint" ? value : BigInt(value);
}

export async function listCustomers(params: CustomerSearchInput): Promise<CustomerListResult> {
  const search = params.query?.trim();
  const searchPattern = search ? `%${search}%` : null;
  const orderColumn = SORT_COLUMN_SQL[params.sortBy];
  const orderDirection = params.sortDirection === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
  const offset = params.page * params.pageSize;

  // Correlated scalar subqueries instead of `LEFT JOIN LATERAL` — both are
  // valid Postgres query forms; a subquery-per-column reads slightly more
  // plainly here and needs no join alias bookkeeping. `status` is a plain
  // string column (no native enum — see `src/lib/enums.ts`), so no `::type`
  // cast is needed on the parameter.
  const lastOrderDateSql = Prisma.sql`(SELECT MAX(o.created_at) FROM orders o WHERE o.customer_id = c.id AND o.deleted_at IS NULL)`;
  const totalAmountSql = Prisma.sql`(SELECT SUM(o.total_amount) FROM orders o WHERE o.customer_id = c.id AND o.deleted_at IS NULL AND o.status != 'cancelled')`;
  const paidAmountSql = Prisma.sql`(SELECT SUM(p.amount) FROM payments p JOIN orders o2 ON o2.id = p.order_id WHERE o2.customer_id = c.id AND p.deleted_at IS NULL AND o2.deleted_at IS NULL AND o2.status != 'cancelled')`;

  const whereClause = Prisma.sql`
    c.deleted_at IS NULL
    ${
      searchPattern
        ? Prisma.sql`AND (c.name ILIKE ${searchPattern} OR c.mobile ILIKE ${searchPattern} OR c.customer_code ILIKE ${searchPattern} OR c.city ILIKE ${searchPattern})`
        : Prisma.empty
    }
    ${params.status ? Prisma.sql`AND c.status = ${params.status}` : Prisma.empty}
  `;

  const rawRows = await db.$queryRaw<RawCustomerListRow[]>`
    SELECT
      c.id,
      c.customer_code AS "customerCode",
      c.name,
      c.mobile,
      c.default_payment_type AS "defaultPaymentType",
      c.status,
      c.is_favorite AS "isFavorite",
      c.city,
      ${lastOrderDateSql} AS "lastOrderDate",
      COALESCE(${totalAmountSql}, 0) - COALESCE(${paidAmountSql}, 0) AS "outstandingBalance"
    FROM customers c
    WHERE ${whereClause}
    ORDER BY ${orderColumn} ${orderDirection} NULLS LAST
    LIMIT ${params.pageSize} OFFSET ${offset}
  `;

  const countResult = await db.$queryRaw<[{ count: string | number | bigint }]>`
    SELECT COUNT(*) AS count
    FROM customers c
    WHERE ${whereClause}
  `;

  const rows: CustomerListRow[] = rawRows.map((row) => ({
    ...row,
    outstandingBalance: normalizeBigint(row.outstandingBalance),
  }));

  return { rows, totalCount: Number(countResult[0].count) };
}

export async function getCustomerById(customerId: string) {
  return db.customer.findUnique({ where: { id: customerId, deletedAt: null } });
}

export interface CustomerOrderHistoryRow {
  id: string;
  /** Null while the order is still a draft (Phase 13 made numbers conversion-time). */
  orderNumber: string | null;
  createdAt: Date;
  status: string;
  totalAmount: bigint;
  paidAmount: bigint;
}

/**
 * Real query against the already-approved `Order`/`Payment` tables
 * (Database Phase) — genuinely correct, not mocked. It will simply return
 * an empty list for every customer until Order Management (Phase 13)
 * exists to create rows for it to find; that is the expected, honest
 * state of a real query over an empty table, not a placeholder.
 */
export async function getCustomerOrderHistory(customerId: string): Promise<CustomerOrderHistoryRow[]> {
  const orders = await db.order.findMany({
    where: { customerId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      status: true,
      totalAmount: true,
      payments: { where: { deletedAt: null }, select: { amount: true } },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    status: order.status,
    totalAmount: order.totalAmount,
    paidAmount: order.payments.reduce((sum, payment) => sum + payment.amount, 0n),
  }));
}

export interface CustomerPaymentSummary {
  totalOrders: number;
  openOrders: number;
  totalAmount: bigint;
  paidAmount: bigint;
  outstandingBalance: bigint;
}

export async function getCustomerPaymentSummary(customerId: string): Promise<CustomerPaymentSummary> {
  const orders = await db.order.findMany({
    where: { customerId, deletedAt: null },
    select: {
      status: true,
      totalAmount: true,
      payments: { where: { deletedAt: null }, select: { amount: true } },
    },
  });

  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0n);
  const paidAmount = orders.reduce(
    (sum, order) => sum + order.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0n),
    0n,
  );
  const openOrders = orders.filter((order) => order.status !== "completed" && order.status !== "cancelled").length;

  return {
    totalOrders: orders.length,
    openOrders,
    totalAmount,
    paidAmount,
    outstandingBalance: totalAmount - paidAmount,
  };
}

export interface CustomerPickerOption {
  id: string;
  customerCode: string;
  name: string;
  mobile: string;
}

/**
 * Powers the Quick Create / search-picker component used wherever a
 * screen needs to pick a customer (Order Creation, in Phase 13). Blocked
 * customers are excluded — Phase 11: "Blocked customers cannot create new
 * orders" — so a blocked customer never even appears as a selectable
 * option in this picker, rather than being selectable and then rejected
 * later.
 */
export async function searchCustomersForPicker(query: string): Promise<CustomerPickerOption[]> {
  const trimmed = query.trim();
  const customers = await db.customer.findMany({
    where: {
      deletedAt: null,
      status: "active",
      ...(trimmed
        ? {
            OR: [
              { name: { contains: trimmed, mode: "insensitive" } },
              { mobile: { contains: trimmed } },
              { customerCode: { contains: trimmed, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    take: 20,
    select: { id: true, customerCode: true, name: true, mobile: true },
  });

  return customers;
}

/**
 * "Recently used" per Phase 11 is derived from real order recency (most
 * recent order date), with a fallback to customer `createdAt` — honest
 * given no orders exist until Phase 13, rather than inventing a separate
 * "last viewed" tracking field this phase doesn't otherwise need.
 */
export async function getRecentCustomers(limit = 10): Promise<CustomerPickerOption[]> {
  const rows = await db.$queryRaw<CustomerPickerOption[]>`
    SELECT c.id, c.customer_code AS "customerCode", c.name, c.mobile
    FROM customers c
    WHERE c.deleted_at IS NULL AND c.status = 'active'
    ORDER BY
      c.is_favorite DESC,
      COALESCE((SELECT MAX(o.created_at) FROM orders o WHERE o.customer_id = c.id AND o.deleted_at IS NULL), c.created_at) DESC
    LIMIT ${limit}
  `;
  return rows;
}
