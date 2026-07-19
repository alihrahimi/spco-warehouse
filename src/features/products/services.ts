import { Prisma, type Product, type ProductCategory, type ProductPiece } from "@prisma/client";

import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit/log";
import { generateProductCode } from "@/lib/product/product-code";
import { applyPriceAdjustment, type PriceAdjustment } from "@/lib/product/price-rounding";
import { deleteUploadedImage, saveUploadedImage } from "@/lib/storage/local-storage-provider";
import type { CategoryInput, PieceInput, ProductInput, ProductSearchInput } from "@/features/products/schemas/product.schema";

export type ServiceResult<T = void> = { success: true; data: T } | { success: false; error: string };

const AUDIT_ENTITY_TYPE = "product";

function emptyToNull(value: string | undefined): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

// ---------------------------------------------------------------------------
// Categories (minimal — Product Management's own bootstrap need, per
// SCREEN-SPECS.md's "category management folded into a modal on Products
// List" plan; not a full Category CRUD module, which Phase 12 never asked for)
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<ProductCategory[]> {
  return db.productCategory.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
}

export async function createCategory(input: CategoryInput): Promise<ServiceResult<ProductCategory>> {
  const category = await db.productCategory.create({
    data: { name: input.name, description: emptyToNull(input.description) },
  });
  return { success: true, data: category };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function createProduct(input: ProductInput, performedById: string): Promise<ServiceResult<Product>> {
  const productCode = await generateProductCode();

  const product = await db.product.create({
    data: {
      productCode,
      categoryId: input.categoryId,
      name: input.name,
      description: emptyToNull(input.description),
    },
  });

  await logAuditEvent({ entityType: AUDIT_ENTITY_TYPE, entityId: product.id, action: "created", performedById });

  return { success: true, data: product };
}

export async function updateProduct(productId: string, input: ProductInput, performedById: string): Promise<ServiceResult<Product>> {
  const existing = await db.product.findUnique({ where: { id: productId } });
  if (!existing || existing.deletedAt) {
    return { success: false, error: "محصول یافت نشد" };
  }

  const product = await db.product.update({
    where: { id: productId },
    data: {
      categoryId: input.categoryId,
      name: input.name,
      description: emptyToNull(input.description),
    },
  });

  await logAuditEvent({ entityType: AUDIT_ENTITY_TYPE, entityId: product.id, action: "updated", performedById });

  return { success: true, data: product };
}

/**
 * Product Management's only "delete" (Phase 12: "Instead: Mark as
 * Inactive"). An inactive product simply stops appearing in the New Order
 * picker (Phase 13) — the row and every historical `OrderItem` snapshot
 * referencing it stay exactly as they were.
 */
export async function changeProductStatus(productId: string, isActive: boolean, performedById: string): Promise<ServiceResult<Product>> {
  const existing = await db.product.findUnique({ where: { id: productId } });
  if (!existing || existing.deletedAt) {
    return { success: false, error: "محصول یافت نشد" };
  }
  if (existing.isActive === isActive) {
    return { success: true, data: existing };
  }

  const product = await db.product.update({ where: { id: productId }, data: { isActive } });

  await logAuditEvent({
    entityType: AUDIT_ENTITY_TYPE,
    entityId: product.id,
    action: "status_changed",
    performedById,
    changes: { from: existing.isActive ? "active" : "inactive", to: isActive ? "active" : "inactive" },
  });

  return { success: true, data: product };
}

/**
 * Real delete, added on top of the existing deactivate toggle above — same
 * two-branch rule `deletePiece` already uses: hard-delete (cascading its
 * pieces, their sizes, and any price history) when nothing has ever been
 * ordered against this product, otherwise a soft delete (`deletedAt` +
 * `isActive: false`) so historical `OrderItem` snapshots stay valid and
 * the product simply stops appearing anywhere live.
 */
export async function deleteProduct(productId: string, performedById: string): Promise<ServiceResult<void>> {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { pieces: { include: { sizes: { include: { orderItems: { take: 1, select: { id: true } } } } } } },
  });
  if (!product || product.deletedAt) {
    return { success: false, error: "محصول یافت نشد" };
  }

  const hasOrderHistory = product.pieces.some((piece) => piece.sizes.some((size) => size.orderItems.length > 0));

  if (hasOrderHistory) {
    await db.product.update({ where: { id: productId }, data: { isActive: false, deletedAt: new Date() } });
  } else {
    const pieceIds = product.pieces.map((piece) => piece.id);
    await db.$transaction([
      db.productPieceSize.deleteMany({ where: { productPieceId: { in: pieceIds } } }),
      db.productPiece.deleteMany({ where: { productId } }),
      db.product.delete({ where: { id: productId } }),
    ]);
  }

  await logAuditEvent({
    entityType: AUDIT_ENTITY_TYPE,
    entityId: productId,
    action: "status_changed",
    performedById,
    changes: { deleted: true, hardDeleted: !hasOrderHistory },
  });

  return { success: true, data: undefined };
}

export async function toggleFavoriteProduct(productId: string, isFavorite: boolean): Promise<ServiceResult<Product>> {
  const existing = await db.product.findUnique({ where: { id: productId } });
  if (!existing || existing.deletedAt) {
    return { success: false, error: "محصول یافت نشد" };
  }
  const product = await db.product.update({ where: { id: productId }, data: { isFavorite } });
  // Not audited — a pin/favorite toggle is a personal UX preference, same call as Customer's equivalent (Phase 11).
  return { success: true, data: product };
}

export async function uploadProductImage(productId: string, file: File, performedById: string): Promise<ServiceResult<Product>> {
  const existing = await db.product.findUnique({ where: { id: productId } });
  if (!existing || existing.deletedAt) {
    return { success: false, error: "محصول یافت نشد" };
  }

  const saveResult = await saveUploadedImage(file, "products");
  if (!saveResult.success) {
    return { success: false, error: saveResult.error };
  }

  const product = await db.product.update({ where: { id: productId }, data: { imageFilePath: saveResult.publicPath } });

  // Old file is only removed after the new one is safely written and the
  // DB row updated — never the other way around, so a mid-operation
  // failure can never leave the product with no image file at all.
  if (existing.imageFilePath) {
    await deleteUploadedImage(existing.imageFilePath);
  }

  await logAuditEvent({ entityType: AUDIT_ENTITY_TYPE, entityId: product.id, action: "updated", performedById });

  return { success: true, data: product };
}

export async function deleteProductImage(productId: string, performedById: string): Promise<ServiceResult<Product>> {
  const existing = await db.product.findUnique({ where: { id: productId } });
  if (!existing || existing.deletedAt) {
    return { success: false, error: "محصول یافت نشد" };
  }
  if (!existing.imageFilePath) {
    return { success: true, data: existing };
  }

  await deleteUploadedImage(existing.imageFilePath);
  const product = await db.product.update({ where: { id: productId }, data: { imageFilePath: null } });

  await logAuditEvent({ entityType: AUDIT_ENTITY_TYPE, entityId: product.id, action: "updated", performedById });

  return { success: true, data: product };
}

export interface ProductListRow {
  id: string;
  productCode: string;
  name: string;
  imageFilePath: string | null;
  isActive: boolean;
  isFavorite: boolean;
  pieceCount: number;
  updatedAt: Date;
}

export interface ProductListResult {
  rows: ProductListRow[];
  totalCount: number;
}

/**
 * Unlike Customer Management's list (Phase 11), this stays on Prisma's
 * standard query API rather than raw SQL: "number of pieces" is a plain
 * relation count (`_count`), which Prisma expresses natively — no
 * correlated multi-table aggregate like Customer's last-order-date/
 * outstanding-balance forced raw SQL there.
 */
export async function listProducts(params: ProductSearchInput): Promise<ProductListResult> {
  const search = params.query?.trim();

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(search
      ? {
          OR: [{ name: { contains: search, mode: "insensitive" } }, { productCode: { contains: search, mode: "insensitive" } }],
        }
      : {}),
    ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sortBy === "name" ? { name: params.sortDirection } : { [params.sortBy]: params.sortDirection };

  const [products, totalCount] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: params.page * params.pageSize,
      take: params.pageSize,
      include: { _count: { select: { pieces: true } } },
    }),
    db.product.count({ where }),
  ]);

  const rows: ProductListRow[] = products.map((product) => ({
    id: product.id,
    productCode: product.productCode,
    name: product.name,
    imageFilePath: product.imageFilePath,
    isActive: product.isActive,
    isFavorite: product.isFavorite,
    pieceCount: product._count.pieces,
    updatedAt: product.updatedAt,
  }));

  return { rows, totalCount };
}

export async function getProductDetails(productId: string) {
  return db.product.findUnique({
    where: { id: productId, deletedAt: null },
    include: {
      category: true,
      pieces: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        include: {
          sizes: {
            where: { deletedAt: null },
            include: { size: true },
            orderBy: { size: { sortOrder: "asc" } },
          },
        },
      },
    },
  });
}

export async function getProductBasicById(productId: string): Promise<Product | null> {
  return db.product.findUnique({ where: { id: productId, deletedAt: null } });
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

export async function createPiece(productId: string, input: PieceInput, performedById: string): Promise<ServiceResult<ProductPiece>> {
  const duplicate = await db.productPiece.findFirst({
    where: { productId, name: input.name, deletedAt: null },
  });
  if (duplicate) {
    return { success: false, error: "قطعه‌ای با این نام قبلاً برای این محصول ثبت شده است" };
  }

  const lastPiece = await db.productPiece.findFirst({
    where: { productId, deletedAt: null },
    orderBy: { sortOrder: "desc" },
  });
  const nextSortOrder = (lastPiece?.sortOrder ?? -1) + 1;

  const piece = await db.productPiece.create({
    data: { productId, name: input.name, sortOrder: nextSortOrder },
  });

  await logAuditEvent({
    entityType: AUDIT_ENTITY_TYPE,
    entityId: productId,
    action: "piece_added",
    performedById,
    changes: { pieceName: piece.name },
  });

  return { success: true, data: piece };
}

export async function updatePiece(pieceId: string, input: PieceInput, performedById: string): Promise<ServiceResult<ProductPiece>> {
  const existing = await db.productPiece.findUnique({ where: { id: pieceId } });
  if (!existing || existing.deletedAt) {
    return { success: false, error: "قطعه یافت نشد" };
  }

  const duplicate = await db.productPiece.findFirst({
    where: { productId: existing.productId, name: input.name, deletedAt: null, id: { not: pieceId } },
  });
  if (duplicate) {
    return { success: false, error: "قطعه‌ای با این نام قبلاً برای این محصول ثبت شده است" };
  }

  const piece = await db.productPiece.update({ where: { id: pieceId }, data: { name: input.name } });

  await logAuditEvent({ entityType: AUDIT_ENTITY_TYPE, entityId: piece.productId, action: "updated", performedById });

  return { success: true, data: piece };
}

/**
 * Hard-deletes only if nothing has ever ordered this piece; otherwise
 * deactivates it (`isActive = false`) instead — SCREEN-SPECS.md §9's
 * already-documented rule, applied for the first time now that a real
 * delete path exists.
 */
export async function deletePiece(pieceId: string, performedById: string): Promise<ServiceResult<void>> {
  const piece = await db.productPiece.findUnique({
    where: { id: pieceId },
    include: { sizes: { include: { orderItems: { take: 1, select: { id: true } } } } },
  });
  if (!piece || piece.deletedAt) {
    return { success: false, error: "قطعه یافت نشد" };
  }

  const hasOrderHistory = piece.sizes.some((size) => size.orderItems.length > 0);

  if (hasOrderHistory) {
    // `deletedAt` (not just `isActive: false`) is what actually removes
    // this piece from the editor — `getProductDetails` filters pieces on
    // `deletedAt: null`, so leaving it unset here was the bug: the piece
    // stayed visible after "deleting" it.
    await db.productPiece.update({ where: { id: pieceId }, data: { isActive: false, deletedAt: new Date() } });
  } else {
    await db.$transaction([
      db.productPieceSize.deleteMany({ where: { productPieceId: pieceId } }),
      db.productPiece.delete({ where: { id: pieceId } }),
    ]);
  }

  await logAuditEvent({
    entityType: AUDIT_ENTITY_TYPE,
    entityId: piece.productId,
    action: "piece_removed",
    performedById,
    changes: { pieceName: piece.name, hardDeleted: !hasOrderHistory },
  });

  return { success: true, data: undefined };
}

export async function reorderPieces(productId: string, orderedPieceIds: string[]): Promise<ServiceResult<void>> {
  await db.$transaction(
    orderedPieceIds.map((pieceId, index) =>
      db.productPiece.update({ where: { id: pieceId, productId }, data: { sortOrder: index } }),
    ),
  );
  // Not audited — pure reordering carries no business-meaningful "what
  // changed" beyond position, same reasoning as skipping favorite toggles.
  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Sizes / Prices
// ---------------------------------------------------------------------------

export async function upsertPieceSize(
  pieceId: string,
  sizeId: string,
  unitPrice: number,
  defaultPackSize: number,
  performedById: string,
  reason?: string,
): Promise<ServiceResult<void>> {
  const existing = await db.productPieceSize.findUnique({
    where: { productPieceId_sizeId: { productPieceId: pieceId, sizeId } },
  });

  if (existing) {
    if (existing.unitPrice === BigInt(unitPrice) && existing.defaultPackSize === defaultPackSize) {
      return { success: true, data: undefined };
    }

    await db.$transaction(async (tx) => {
      await tx.productPieceSize.update({
        where: { id: existing.id },
        data: { unitPrice: BigInt(unitPrice), defaultPackSize },
      });

      if (existing.unitPrice !== BigInt(unitPrice)) {
        await tx.priceHistory.create({
          data: {
            productPieceSizeId: existing.id,
            oldPrice: existing.unitPrice,
            newPrice: BigInt(unitPrice),
            reason: reason && reason.trim() !== "" ? reason.trim() : null,
            changedById: performedById,
          },
        });
      }
    });

    const piece = await db.productPiece.findUnique({ where: { id: pieceId } });
    if (existing.unitPrice !== BigInt(unitPrice) && piece) {
      await logAuditEvent({
        entityType: AUDIT_ENTITY_TYPE,
        entityId: piece.productId,
        action: "price_updated",
        performedById,
        changes: { oldPrice: existing.unitPrice.toString(), newPrice: unitPrice.toString() },
      });
    }
  } else {
    await db.productPieceSize.create({
      data: { productPieceId: pieceId, sizeId, unitPrice: BigInt(unitPrice), defaultPackSize },
    });
  }

  return { success: true, data: undefined };
}

export async function getAllSizes() {
  return db.size.findMany({ orderBy: { sortOrder: "asc" } });
}

/**
 * Global sizes (final-revision requirement #5/#6): defined once for the
 * whole system — "0, 1, 2, 3, Free" — and every product's pieces reuse
 * this same list rather than each product defining its own. New sizes
 * are appended after the current highest `sortOrder`, so the admin-facing
 * Sizes screen never needs the caller to compute a position.
 */
export async function createSize(label: string): Promise<ServiceResult<{ id: string; label: string }>> {
  const trimmed = label.trim();
  if (trimmed === "") {
    return { success: false, error: "برچسب سایز نمی‌تواند خالی باشد" };
  }

  const existing = await db.size.findUnique({ where: { label: trimmed } });
  if (existing) {
    return { success: false, error: "این سایز قبلاً تعریف شده است" };
  }

  const highest = await db.size.findFirst({ orderBy: { sortOrder: "desc" } });
  const size = await db.size.create({ data: { label: trimmed, sortOrder: (highest?.sortOrder ?? -1) + 1 } });

  return { success: true, data: { id: size.id, label: size.label } };
}

export async function renameSize(sizeId: string, label: string): Promise<ServiceResult<void>> {
  const trimmed = label.trim();
  if (trimmed === "") {
    return { success: false, error: "برچسب سایز نمی‌تواند خالی باشد" };
  }

  const duplicate = await db.size.findUnique({ where: { label: trimmed } });
  if (duplicate && duplicate.id !== sizeId) {
    return { success: false, error: "این سایز قبلاً تعریف شده است" };
  }

  await db.size.update({ where: { id: sizeId }, data: { label: trimmed } });
  return { success: true, data: undefined };
}

/**
 * No delete: `ProductPieceSize` rows reference a size by foreign key, and
 * historical `OrderItem`s snapshot the label rather than the id, so
 * removing a size that's already priced anywhere would either orphan a
 * live catalog row or require a much bigger reconciliation flow than this
 * small, rarely-changing reference list needs. Renaming and reordering
 * cover every real request this screen exists for.
 */
export async function reorderSizes(orderedSizeIds: string[]): Promise<ServiceResult<void>> {
  await db.$transaction(orderedSizeIds.map((sizeId, index) => db.size.update({ where: { id: sizeId }, data: { sortOrder: index } })));
  return { success: true, data: undefined };
}

export interface PriceHistoryRow {
  id: string;
  oldPrice: bigint;
  newPrice: bigint;
  reason: string | null;
  changedByName: string;
  createdAt: Date;
}

export async function getPriceHistory(productPieceSizeId: string): Promise<PriceHistoryRow[]> {
  const rows = await db.priceHistory.findMany({
    where: { productPieceSizeId },
    orderBy: { createdAt: "desc" },
    include: { changedBy: { select: { fullName: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    oldPrice: row.oldPrice,
    newPrice: row.newPrice,
    reason: row.reason,
    changedByName: row.changedBy.fullName,
    createdAt: row.createdAt,
  }));
}

/**
 * Applies one adjustment (percentage/fixed, increase/decrease, with
 * optional upward rounding) to every selected `ProductPieceSize`, writing
 * a `PriceHistory` row per changed size and one `AuditLog` "price_updated"
 * entry per distinct product touched (not one per size — that would flood
 * the audit trail for what is, from a review standpoint, a single action).
 */
export async function bulkUpdatePrices(
  productPieceSizeIds: string[],
  adjustment: PriceAdjustment,
  roundTo: number,
  reason: string | undefined,
  performedById: string,
): Promise<ServiceResult<{ updatedCount: number }>> {
  const targets = await db.productPieceSize.findMany({
    where: { id: { in: productPieceSizeIds } },
    include: { productPiece: { select: { productId: true } } },
  });

  if (targets.length === 0) {
    return { success: false, error: "موردی برای بروزرسانی انتخاب نشده است" };
  }

  const productIdsTouched = new Set<string>();

  await db.$transaction(async (tx) => {
    for (const target of targets) {
      const newPrice = applyPriceAdjustment(Number(target.unitPrice), adjustment, roundTo);
      if (newPrice === Number(target.unitPrice)) continue;

      await tx.productPieceSize.update({ where: { id: target.id }, data: { unitPrice: BigInt(newPrice) } });
      await tx.priceHistory.create({
        data: {
          productPieceSizeId: target.id,
          oldPrice: target.unitPrice,
          newPrice: BigInt(newPrice),
          reason: reason && reason.trim() !== "" ? reason.trim() : null,
          changedById: performedById,
        },
      });
      productIdsTouched.add(target.productPiece.productId);
    }
  });

  for (const productId of productIdsTouched) {
    await logAuditEvent({
      entityType: AUDIT_ENTITY_TYPE,
      entityId: productId,
      action: "price_updated",
      performedById,
      changes: { bulkUpdate: true, adjustment },
    });
  }

  return { success: true, data: { updatedCount: targets.length } };
}

// ---------------------------------------------------------------------------
// Duplication
// ---------------------------------------------------------------------------

/**
 * Duplicates pieces, sizes, pack sizes, and prices — exactly Phase 12's
 * list, no more. The image is deliberately NOT copied (not in that list),
 * and price history starts fresh for the new product rather than
 * inheriting the source's history, which describes the source product's
 * price changes, not the new one's.
 */
export async function duplicateProduct(sourceProductId: string, performedById: string): Promise<ServiceResult<Product>> {
  const source = await getProductDetails(sourceProductId);
  if (!source) {
    return { success: false, error: "محصول یافت نشد" };
  }

  const productCode = await generateProductCode();

  const newProduct = await db.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        productCode,
        categoryId: source.categoryId,
        name: `${source.name} (کپی)`,
        description: source.description,
      },
    });

    for (const piece of source.pieces) {
      const createdPiece = await tx.productPiece.create({
        data: { productId: created.id, name: piece.name, sortOrder: piece.sortOrder },
      });

      for (const size of piece.sizes) {
        await tx.productPieceSize.create({
          data: {
            productPieceId: createdPiece.id,
            sizeId: size.sizeId,
            unitPrice: size.unitPrice,
            defaultPackSize: size.defaultPackSize,
          },
        });
      }
    }

    return created;
  });

  await logAuditEvent({
    entityType: AUDIT_ENTITY_TYPE,
    entityId: newProduct.id,
    action: "created",
    performedById,
    changes: { duplicatedFrom: sourceProductId },
  });

  return { success: true, data: newProduct };
}

// ---------------------------------------------------------------------------
// Order-builder support (Phase 13) — additive extension, nothing above changed.
// ---------------------------------------------------------------------------

export interface ProductForOrder {
  id: string;
  productCode: string;
  name: string;
  imageFilePath: string | null;
  pieces: {
    id: string;
    name: string;
    sizes: {
      productPieceSizeId: string;
      sizeLabel: string;
      unitPrice: number;
      defaultPackSize: number;
    }[];
  }[];
}

/**
 * Everything the New Order screen renders for one tapped product: ALL
 * active pieces, each with ALL its priced sizes (Phase 13's single-screen
 * rule). Inactive/unpriced entries are excluded — they are not orderable,
 * so showing them in the order flow would only invite dead-end taps.
 */
export async function getProductForOrder(productId: string): Promise<ProductForOrder | null> {
  const product = await db.product.findUnique({
    where: { id: productId, deletedAt: null, isActive: true },
    include: {
      pieces: {
        where: { deletedAt: null, isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          sizes: {
            where: { deletedAt: null, isActive: true, unitPrice: { gt: 0 } },
            include: { size: true },
            orderBy: { size: { sortOrder: "asc" } },
          },
        },
      },
    },
  });
  if (!product) return null;

  return {
    id: product.id,
    productCode: product.productCode,
    name: product.name,
    imageFilePath: product.imageFilePath,
    pieces: product.pieces
      .filter((piece) => piece.sizes.length > 0)
      .map((piece) => ({
        id: piece.id,
        name: piece.name,
        sizes: piece.sizes.map((entry) => ({
          productPieceSizeId: entry.id,
          sizeLabel: entry.size.label,
          unitPrice: Number(entry.unitPrice),
          defaultPackSize: entry.defaultPackSize,
        })),
      })),
  };
}

/**
 * The order flow's product grid: favorites first, then recently updated
 * (Phase 13 "Recent & Frequent Products"), active products only, searched
 * by Persian name or product code.
 */
export async function searchProductsForOrder(query: string): Promise<
  { id: string; productCode: string; name: string; imageFilePath: string | null }[]
> {
  const trimmed = query.trim();
  return db.product.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      ...(trimmed
        ? { OR: [{ name: { contains: trimmed, mode: "insensitive" } }, { productCode: { contains: trimmed, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    take: 24,
    select: { id: true, productCode: true, name: true, imageFilePath: true },
  });
}
