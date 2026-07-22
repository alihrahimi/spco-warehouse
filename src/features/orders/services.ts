import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit/log";
import type { OrderStatus } from "@/lib/enums";
import { generateOrderNumber } from "@/lib/order/order-number";
import type { OrderItemInput, OrderSearchInput, SaveDraftInput, UpdateOrderInput } from "@/features/orders/schemas/order.schema";

export type ServiceResult<T = void> = { success: true; data: T } | { success: false; error: string };

const AUDIT_ENTITY_TYPE = "order";

type TransactionClient = Prisma.TransactionClient;

// ---------------------------------------------------------------------------
// Item resolution — turns raw {pieceSizeId, packQty, unitQty} lines into
// fully-snapshotted order item rows against the live catalog.
// ---------------------------------------------------------------------------

interface ResolvedItem {
  productPieceSizeId: string;
  productNameSnapshot: string;
  productCodeSnapshot: string;
  pieceNameSnapshot: string;
  sizeLabelSnapshot: string;
  packQuantity: number;
  unitQuantity: number;
  packSizeSnapshot: number;
  totalUnits: number;
  unitPriceSnapshot: bigint;
  totalPrice: bigint;
}

/**
 * Validates each line against the live catalog and computes the frozen
 * snapshot fields. Rejects: unknown/inactive piece-sizes, inactive
 * products, non-positive prices (Phase 13 "Invalid Prices"), and duplicate
 * lines for the same piece+size (also enforced by the DB unique
 * constraint — this just produces a readable Persian error first).
 */
async function resolveItems(tx: TransactionClient, items: OrderItemInput[]): Promise<ServiceResult<ResolvedItem[]>> {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.productPieceSizeId)) {
      return { success: false, error: "یک سایز نمی‌تواند دو بار در سفارش تکرار شود" };
    }
    seen.add(item.productPieceSizeId);
  }

  const pieceSizes = await tx.productPieceSize.findMany({
    where: { id: { in: items.map((item) => item.productPieceSizeId) } },
    include: {
      size: true,
      productPiece: { include: { product: true } },
    },
  });
  const byId = new Map(pieceSizes.map((entry) => [entry.id, entry]));

  const resolved: ResolvedItem[] = [];
  for (const item of items) {
    const pieceSize = byId.get(item.productPieceSizeId);
    if (!pieceSize || pieceSize.deletedAt || !pieceSize.isActive) {
      return { success: false, error: "یکی از اقلام انتخاب‌شده دیگر در دسترس نیست" };
    }
    const piece = pieceSize.productPiece;
    const product = piece.product;
    if (!piece.isActive || piece.deletedAt || !product.isActive || product.deletedAt) {
      return { success: false, error: `«${product.name} — ${piece.name}» دیگر فعال نیست و قابل سفارش نیست` };
    }
    if (pieceSize.unitPrice <= 0n) {
      return { success: false, error: `قیمت «${product.name} — ${piece.name} — سایز ${pieceSize.size.label}» معتبر نیست` };
    }

    const totalUnits = item.packQuantity * pieceSize.defaultPackSize + item.unitQuantity;
    resolved.push({
      productPieceSizeId: pieceSize.id,
      productNameSnapshot: product.name,
      productCodeSnapshot: product.productCode,
      pieceNameSnapshot: piece.name,
      sizeLabelSnapshot: pieceSize.size.label,
      packQuantity: item.packQuantity,
      unitQuantity: item.unitQuantity,
      packSizeSnapshot: pieceSize.defaultPackSize,
      totalUnits,
      unitPriceSnapshot: pieceSize.unitPrice,
      totalPrice: BigInt(totalUnits) * pieceSize.unitPrice,
    });
  }

  return { success: true, data: resolved };
}

function sumTotal(items: ResolvedItem[]): bigint {
  return items.reduce((sum, item) => sum + item.totalPrice, 0n);
}

function emptyToNull(value: string | undefined): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

// ---------------------------------------------------------------------------
// Drafts & auto-save
// ---------------------------------------------------------------------------

/**
 * Creates or updates a draft — the single function behind both the
 * explicit "save draft" action and the builder's periodic auto-save.
 * Items are fully replaced each save (the builder owns the whole list),
 * with snapshots re-taken from the live catalog: a draft tracks current
 * prices until the moment of pre-invoice generation freezes them.
 */
export async function saveDraft(input: SaveDraftInput, userId: string): Promise<ServiceResult<{ orderId: string }>> {
  const customer = await db.customer.findUnique({ where: { id: input.customerId } });
  if (!customer || customer.deletedAt) {
    return { success: false, error: "مشتری یافت نشد" };
  }
  if (customer.status === "blocked") {
    return { success: false, error: "این مشتری مسدود است و امکان ثبت سفارش جدید ندارد" };
  }

  try {
    const orderId = await db.$transaction(async (tx) => {
      const itemsResult = await resolveItems(tx, input.items);
      if (!itemsResult.success) throw new Error(itemsResult.error);
      const resolved = itemsResult.data;
      const total = sumTotal(resolved);

      let order;
      if (input.orderId) {
        const existing = await tx.order.findUnique({ where: { id: input.orderId } });
        if (!existing || existing.deletedAt) throw new Error("سفارش یافت نشد");
        if (existing.status !== "draft") throw new Error("فقط پیش‌نویس‌ها با این مسیر ذخیره می‌شوند");

        order = await tx.order.update({
          where: { id: input.orderId },
          data: {
            customerId: input.customerId,
            subtotal: total,
            totalAmount: total,
            notes: emptyToNull(input.notes),
            customerNotes: emptyToNull(input.customerNotes),
          },
        });
        await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      } else {
        order = await tx.order.create({
          data: {
            jalaliYear: 0, // real year assigned with the order number at conversion
            customerId: input.customerId,
            status: "draft",
            subtotal: total,
            totalAmount: total,
            notes: emptyToNull(input.notes),
            customerNotes: emptyToNull(input.customerNotes),
            createdById: userId,
          },
        });
      }

      if (resolved.length > 0) {
        await tx.orderItem.createMany({
          data: resolved.map((item) => ({ ...item, orderId: order.id })),
        });
      }

      return order.id;
    });

    if (!input.orderId) {
      await logAuditEvent({ entityType: AUDIT_ENTITY_TYPE, entityId: orderId, action: "created", performedById: userId });
    }

    return { success: true, data: { orderId } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "ذخیره پیش‌نویس با خطا مواجه شد" };
  }
}

/** Drafts are unfinished work, not business documents — hard delete is correct and Phase 13 asks for it. Refuses anything past draft status. */
export async function deleteDraft(orderId: string): Promise<ServiceResult> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.deletedAt) return { success: false, error: "سفارش یافت نشد" };
  if (order.status !== "draft") return { success: false, error: "فقط پیش‌نویس‌ها قابل حذف هستند" };

  await db.$transaction([
    db.orderItem.deleteMany({ where: { orderId } }),
    db.order.delete({ where: { id: orderId } }),
  ]);

  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Pre-invoice generation
// ---------------------------------------------------------------------------

/**
 * The moment a draft becomes a business document: assigns the yearly
 * sequential order number, freezes the company-identity snapshot into
 * `InvoiceDocument` (per the Phase 03 addendum — later Company Settings
 * edits never change this document), and moves status forward. Blocks if
 * Company Settings has no company name (UX-FLOW.md's rule: never print a
 * blank header) — with the Settings module arriving in a later phase, the
 * `CompanySettings` row must exist in the database before the first
 * conversion.
 */
export async function convertDraftToPreInvoice(orderId: string, userId: string): Promise<ServiceResult<{ orderNumber: string }>> {
  try {
    const orderNumber = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order || order.deletedAt) throw new Error("سفارش یافت نشد");
      if (order.status !== "draft") throw new Error("این سفارش قبلاً به پیش‌فاکتور تبدیل شده است");
      if (order.items.length === 0) throw new Error("سفارش خالی است — حداقل یک قلم اضافه کنید");
      if (order.items.every((item) => item.totalUnits === 0)) {
        throw new Error("همه اقلام سفارش بدون تعداد هستند");
      }

      const companySettings = await tx.companySettings.findFirst({ include: { phoneNumbers: { orderBy: { sortOrder: "asc" } } } });
      if (!companySettings || companySettings.companyName.trim() === "") {
        throw new Error("اطلاعات شرکت کامل نیست. ابتدا نام شرکت را در تنظیمات ثبت کنید");
      }

      const { orderNumber, jalaliYear } = await generateOrderNumber(tx);

      await tx.order.update({
        where: { id: orderId },
        data: {
          orderNumber,
          jalaliYear,
          status: "pre_invoice_generated",
          preInvoiceGeneratedAt: new Date(),
        },
      });

      await tx.invoiceDocument.create({
        data: {
          orderId,
          companyNameSnapshot: companySettings.companyName,
          companyLogoSnapshot: companySettings.logoFilePath,
          phoneNumbersSnapshot: companySettings.phoneNumbers.map((phone) => ({
            phoneNumber: phone.phoneNumber,
            label: phone.label,
          })),
          whatsappSnapshot: companySettings.whatsappNumber,
          telegramSnapshot: companySettings.telegramHandle,
          instagramSnapshot: companySettings.instagramHandle,
          addressSnapshot: companySettings.address,
          footerTextSnapshot: companySettings.footerText,
          generatedAt: new Date(),
          generatedById: userId,
        },
      });

      return orderNumber;
    });

    await logAuditEvent({
      entityType: AUDIT_ENTITY_TYPE,
      entityId: orderId,
      action: "invoice_generated",
      performedById: userId,
      changes: { orderNumber },
    });

    return { success: true, data: { orderNumber } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "تبدیل به پیش‌فاکتور با خطا مواجه شد" };
  }
}

// ---------------------------------------------------------------------------
// Post-pre-invoice editing (versioned)
// ---------------------------------------------------------------------------

const EDITABLE_STATUSES: OrderStatus[] = ["pre_invoice_generated", "pending_payment", "preparing"];

/**
 * Every edit after pre-invoice generation snapshots the order's CURRENT
 * state into `order_versions` before applying the change (Phase 13's
 * version-history rule) — the superseded state is what administrators
 * review, keyed by the version number it had while live.
 */
export async function updateOrderWithVersion(input: UpdateOrderInput, userId: string): Promise<ServiceResult> {
  try {
    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: input.orderId }, include: { items: true } });
      if (!order || order.deletedAt) throw new Error("سفارش یافت نشد");
      if (order.status === "draft") throw new Error("پیش‌نویس‌ها از مسیر ذخیره پیش‌نویس ویرایش می‌شوند");
      if (!EDITABLE_STATUSES.includes(order.status as OrderStatus)) {
        throw new Error("سفارش در این وضعیت قابل ویرایش نیست");
      }

      const itemsResult = await resolveItems(tx, input.items);
      if (!itemsResult.success) throw new Error(itemsResult.error);
      const resolved = itemsResult.data;
      if (resolved.every((item) => item.totalUnits === 0)) throw new Error("همه اقلام سفارش بدون تعداد هستند");
      const total = sumTotal(resolved);

      await tx.orderVersion.create({
        data: {
          orderId: order.id,
          versionNumber: order.version,
          reason: emptyToNull(input.changeReason),
          createdById: userId,
          snapshot: {
            status: order.status,
            subtotal: order.subtotal.toString(),
            totalAmount: order.totalAmount.toString(),
            notes: order.notes,
            customerNotes: order.customerNotes,
            items: order.items.map((item) => ({
              productName: item.productNameSnapshot,
              productCode: item.productCodeSnapshot,
              pieceName: item.pieceNameSnapshot,
              sizeLabel: item.sizeLabelSnapshot,
              packQuantity: item.packQuantity,
              unitQuantity: item.unitQuantity,
              packSize: item.packSizeSnapshot,
              totalUnits: item.totalUnits,
              unitPrice: item.unitPriceSnapshot.toString(),
              totalPrice: item.totalPrice.toString(),
            })),
          },
        },
      });

      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.orderItem.createMany({ data: resolved.map((item) => ({ ...item, orderId: order.id })) });
      await tx.order.update({
        where: { id: order.id },
        data: {
          subtotal: total,
          totalAmount: total,
          notes: emptyToNull(input.notes),
          customerNotes: emptyToNull(input.customerNotes),
          version: { increment: 1 },
        },
      });
    });

    await logAuditEvent({ entityType: AUDIT_ENTITY_TYPE, entityId: input.orderId, action: "updated", performedById: userId });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "ویرایش سفارش با خطا مواجه شد" };
  }
}

export async function getOrderVersions(orderId: string) {
  return db.orderVersion.findMany({
    where: { orderId },
    orderBy: { versionNumber: "desc" },
    include: { createdBy: { select: { fullName: true } } },
  });
}

// ---------------------------------------------------------------------------
// Status & duplication
// ---------------------------------------------------------------------------

/** Manual transitions only (fixed since Phase 03). Completed orders can't be cancelled; drafts convert via `convertDraftToPreInvoice`, never here. */
export async function changeOrderStatus(orderId: string, newStatus: OrderStatus, userId: string): Promise<ServiceResult> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.deletedAt) return { success: false, error: "سفارش یافت نشد" };
  if (order.status === newStatus) return { success: true, data: undefined };
  if (newStatus === "draft" || newStatus === "pre_invoice_generated") {
    return { success: false, error: "بازگشت به این وضعیت ممکن نیست" };
  }
  if (order.status === "draft") return { success: false, error: "ابتدا پیش‌نویس را به پیش‌فاکتور تبدیل کنید" };
  if (order.status === "completed" && newStatus === "cancelled") {
    return { success: false, error: "سفارش‌های تکمیل‌شده قابل لغو نیستند" };
  }
  if (order.status === "cancelled") return { success: false, error: "سفارش لغوشده قابل تغییر وضعیت نیست" };

  await db.order.update({ where: { id: orderId }, data: { status: newStatus } });
  await logAuditEvent({
    entityType: AUDIT_ENTITY_TYPE,
    entityId: orderId,
    action: "status_changed",
    performedById: userId,
    changes: { from: order.status, to: newStatus },
  });
  return { success: true, data: undefined };
}

/**
 * Duplicates an order as a fresh DRAFT with prices re-snapshotted from the
 * current catalog (a new order sells at today's prices, not last month's)
 * — lines whose piece-size has since been deactivated are skipped and
 * reported so staff know what dropped out. New number assigned at its own
 * conversion, per Phase 13.
 */
export async function duplicateOrder(sourceOrderId: string, userId: string): Promise<ServiceResult<{ orderId: string; skippedItems: string[] }>> {
  const source = await db.order.findUnique({ where: { id: sourceOrderId }, include: { items: true } });
  if (!source || source.deletedAt) return { success: false, error: "سفارش یافت نشد" };

  const liveLines: OrderItemInput[] = [];
  const skippedItems: string[] = [];

  const pieceSizes = await db.productPieceSize.findMany({
    where: { id: { in: source.items.map((item) => item.productPieceSizeId) } },
    include: { productPiece: { include: { product: true } } },
  });
  const byId = new Map(pieceSizes.map((entry) => [entry.id, entry]));

  for (const item of source.items) {
    const pieceSize = byId.get(item.productPieceSizeId);
    const usable =
      pieceSize &&
      !pieceSize.deletedAt &&
      pieceSize.isActive &&
      pieceSize.productPiece.isActive &&
      !pieceSize.productPiece.deletedAt &&
      pieceSize.productPiece.product.isActive &&
      !pieceSize.productPiece.product.deletedAt;

    if (usable) {
      liveLines.push({
        productPieceSizeId: item.productPieceSizeId,
        packQuantity: item.packQuantity,
        unitQuantity: item.unitQuantity,
      });
    } else {
      skippedItems.push(`${item.productNameSnapshot} — ${item.pieceNameSnapshot} — سایز ${item.sizeLabelSnapshot}`);
    }
  }

  if (liveLines.length === 0) {
    return { success: false, error: "هیچ‌یک از اقلام این سفارش دیگر فعال نیست" };
  }

  const result = await saveDraft(
    {
      orderId: null,
      customerId: source.customerId,
      items: liveLines,
      notes: source.notes ?? "",
      customerNotes: source.customerNotes ?? "",
    },
    userId,
  );
  if (!result.success) return result;

  return { success: true, data: { orderId: result.data.orderId, skippedItems } };
}

// ---------------------------------------------------------------------------
// List / search / details
// ---------------------------------------------------------------------------

export interface OrderListRow {
  id: string;
  orderNumber: string | null;
  status: OrderStatus;
  customerName: string;
  customerCode: string;
  totalAmount: bigint;
  paidAmount: bigint;
  createdAt: Date;
}

export interface OrderListResult {
  rows: OrderListRow[];
  totalCount: number;
}

type RawOrderListRow = Omit<OrderListRow, "totalAmount" | "paidAmount"> & {
  totalAmount: string | number | bigint;
  paidAmount: string | number | bigint;
};

function normalizeBigint(value: string | number | bigint): bigint {
  return typeof value === "bigint" ? value : BigInt(value);
}

/**
 * Server-side search across order number, customer name/code, and product
 * name/code (via an EXISTS over the order's item snapshots — no join
 * against the live catalog needed, since snapshots carry both). Payment
 * status is derived per-row from the payments aggregate, same correlated-
 * subquery technique as Customer Management's list, for the same reason:
 * Prisma's query builder can't express these correlated aggregates in one
 * query.
 */
export async function listOrders(params: OrderSearchInput): Promise<OrderListResult> {
  const search = params.query?.trim();
  const searchPattern = search ? `%${search}%` : null;
  const offset = params.page * params.pageSize;

  // Correlated scalar subquery instead of `LEFT JOIN LATERAL` — reused in
  // both WHERE and SELECT, which a plain subquery allows without a join
  // alias. Both `status` and `customer_id` are plain string columns (no
  // native enum, no native uuid type — see `src/lib/enums.ts`), so no
  // `::type` cast is needed on the parameters.
  const paidAmountSql = Prisma.sql`(SELECT SUM(p.amount) FROM payments p WHERE p.order_id = o.id AND p.deleted_at IS NULL)`;

  const whereClause = Prisma.sql`
    o.deleted_at IS NULL
    ${
      searchPattern
        ? Prisma.sql`AND (
            o.order_number ILIKE ${searchPattern}
            OR c.name ILIKE ${searchPattern}
            OR c.customer_code ILIKE ${searchPattern}
            OR EXISTS (
              SELECT 1 FROM order_items oi
              WHERE oi.order_id = o.id
                AND (oi.product_name_snapshot ILIKE ${searchPattern} OR oi.product_code_snapshot ILIKE ${searchPattern})
            )
          )`
        : Prisma.empty
    }
    ${params.status ? Prisma.sql`AND o.status = ${params.status}` : Prisma.empty}
    ${params.customerId ? Prisma.sql`AND o.customer_id = ${params.customerId}` : Prisma.empty}
    ${params.dateFrom ? Prisma.sql`AND o.created_at >= ${new Date(params.dateFrom)}` : Prisma.empty}
    ${params.dateTo ? Prisma.sql`AND o.created_at <= ${new Date(params.dateTo)}` : Prisma.empty}
    ${
      params.paymentStatus === "unpaid"
        ? Prisma.sql`AND COALESCE(${paidAmountSql}, 0) = 0`
        : params.paymentStatus === "partial"
          ? Prisma.sql`AND COALESCE(${paidAmountSql}, 0) > 0 AND COALESCE(${paidAmountSql}, 0) < o.total_amount`
          : params.paymentStatus === "paid"
            ? Prisma.sql`AND COALESCE(${paidAmountSql}, 0) >= o.total_amount AND o.total_amount > 0`
            : Prisma.empty
    }
  `;

  const fromClause = Prisma.sql`
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
  `;

  const rawRows = await db.$queryRaw<RawOrderListRow[]>`
    SELECT
      o.id,
      o.order_number AS "orderNumber",
      o.status,
      c.name AS "customerName",
      c.customer_code AS "customerCode",
      o.total_amount AS "totalAmount",
      COALESCE(${paidAmountSql}, 0) AS "paidAmount",
      o.created_at AS "createdAt"
    ${fromClause}
    WHERE ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ${params.pageSize} OFFSET ${offset}
  `;

  const countResult = await db.$queryRaw<[{ count: string | number | bigint }]>`
    SELECT COUNT(*) AS count ${fromClause} WHERE ${whereClause}
  `;

  return {
    rows: rawRows.map((row) => ({
      ...row,
      totalAmount: normalizeBigint(row.totalAmount),
      paidAmount: normalizeBigint(row.paidAmount),
    })),
    totalCount: Number(countResult[0].count),
  };
}

export async function getOrderDetails(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId, deletedAt: null },
    include: {
      customer: true,
      createdBy: { select: { fullName: true } },
      // Pieces sort by their catalog sortOrder (the admin-managed order on
      // the Products page — the single source of truth for piece order),
      // NOT alphabetically: the display order here must match every other
      // screen. Sizes likewise by their global sortOrder. Snapshot data is
      // untouched — this only orders rows for display, via the live
      // relation the item row already points at.
      items: {
        orderBy: [
          { productNameSnapshot: "asc" },
          { productPieceSize: { productPiece: { sortOrder: "asc" } } },
          { productPieceSize: { size: { sortOrder: "asc" } } },
        ],
      },
      payments: { where: { deletedAt: null }, orderBy: { paidAt: "desc" }, include: { createdBy: { select: { fullName: true } } } },
      invoiceDocument: true,
    },
  });
}

/** Shape the order builder's store needs to resume a draft (or load an order for versioned editing). */
export async function getOrderForBuilder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId, deletedAt: null },
    include: {
      customer: { select: { id: true, customerCode: true, name: true, mobile: true } },
      items: { include: { productPieceSize: { select: { productPiece: { select: { productId: true } } } } } },
    },
  });
  if (!order) return null;

  return {
    orderId: order.id,
    status: order.status,
    customer: order.customer,
    notes: order.notes ?? "",
    customerNotes: order.customerNotes ?? "",
    items: order.items.map((item) => ({
      productPieceSizeId: item.productPieceSizeId,
      // The live catalog product id (not part of the frozen snapshot) — the
      // builder needs it to re-open the product's quantity dialog for edits.
      productId: item.productPieceSize.productPiece.productId,
      productName: item.productNameSnapshot,
      productCode: item.productCodeSnapshot,
      pieceName: item.pieceNameSnapshot,
      sizeLabel: item.sizeLabelSnapshot,
      packQuantity: item.packQuantity,
      unitQuantity: item.unitQuantity,
      packSize: item.packSizeSnapshot,
      unitPrice: Number(item.unitPriceSnapshot),
    })),
  };
}
