"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import type { PriceAdjustment } from "@/lib/product/price-rounding";
import {
  accountingCodeSchema,
  categorySchema,
  pieceSchema,
  priceAdjustmentSchema,
  priceEntrySchema,
  productSchema,
  productSearchSchema,
  type AccountingCodeInput,
  type CategoryInput,
  type PieceInput,
  type PriceAdjustmentInput,
  type PriceEntryInput,
  type ProductInput,
  type ProductSearchInput,
} from "@/features/products/schemas/product.schema";
import {
  bulkUpdatePrices,
  changeProductStatus,
  createCategory,
  createPiece,
  createProduct,
  createSize,
  deletePiece,
  deleteProduct,
  deleteProductImage,
  duplicateProduct,
  getAllSizes,
  getCategories,
  getPriceHistory,
  getProductForAccounting,
  listProducts,
  renameSize,
  reorderPieces,
  reorderSizes,
  toggleFavoriteProduct,
  getProductForOrder,
  searchProductsForAccounting,
  searchProductsForOrder,
  updateAccountingCode,
  updatePiece,
  updateProduct,
  uploadProductImage,
  upsertPieceSize,
  type PriceHistoryRow,
  type ProductForAccounting,
  type ProductForOrder,
  type ProductListResult,
} from "@/features/products/services";
import type { Product, ProductCategory, ProductPiece, Size } from "@prisma/client";

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

export async function createProductAction(input: ProductInput): Promise<ActionResult<Product>> {
  const session = await requirePermission("products:edit");

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "اطلاعات وارد شده معتبر نیست", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  const result = await createProduct(parsed.data, session.user.id);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/products");
  return { success: true, data: result.data };
}

export async function updateProductAction(productId: string, input: ProductInput): Promise<ActionResult> {
  const session = await requirePermission("products:edit");

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "اطلاعات وارد شده معتبر نیست", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  const result = await updateProduct(productId, parsed.data, session.user.id);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return { success: true, data: undefined };
}

export async function changeProductStatusAction(productId: string, isActive: boolean): Promise<ActionResult> {
  const session = await requirePermission("products:edit");

  const result = await changeProductStatus(productId, isActive, session.user.id);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return { success: true, data: undefined };
}

export async function toggleFavoriteProductAction(productId: string, isFavorite: boolean): Promise<ActionResult> {
  await requirePermission("products:edit");

  const result = await toggleFavoriteProduct(productId, isFavorite);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/products");
  return { success: true, data: undefined };
}

export async function uploadProductImageAction(productId: string, formData: FormData): Promise<ActionResult<{ imageFilePath: string | null }>> {
  const session = await requirePermission("products:edit");

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "فایلی انتخاب نشده است" };
  }

  const result = await uploadProductImage(productId, file, session.user.id);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return { success: true, data: { imageFilePath: result.data.imageFilePath } };
}

export async function deleteProductImageAction(productId: string): Promise<ActionResult> {
  const session = await requirePermission("products:edit");

  const result = await deleteProductImage(productId, session.user.id);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return { success: true, data: undefined };
}

/** Real delete — `products:delete` is a stricter gate than the `products:edit` the deactivate toggle uses. */
export async function deleteProductAction(productId: string): Promise<ActionResult> {
  const session = await requirePermission("products:delete");

  const result = await deleteProduct(productId, session.user.id);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/products");
  return { success: true, data: undefined };
}

/** A read invoked as a Server Action for the same reason as `listCustomersAction` (Phase 11) — see that file's comment. */
export async function listProductsAction(input: ProductSearchInput): Promise<ActionResult<ProductListResult>> {
  await requirePermission("products:view");

  const parsed = productSearchSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "پارامترهای جستجو معتبر نیست" };

  const data = await listProducts(parsed.data);
  return { success: true, data };
}

export async function getCategoriesAction(): Promise<ActionResult<ProductCategory[]>> {
  await requirePermission("products:view");
  const data = await getCategories();
  return { success: true, data };
}

export async function createCategoryAction(input: CategoryInput): Promise<ActionResult<ProductCategory>> {
  await requirePermission("products:edit");

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "اطلاعات وارد شده معتبر نیست", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  const result = await createCategory(parsed.data);
  if (!result.success) return { success: false, error: result.error };

  return { success: true, data: result.data };
}

/**
 * Global sizes admin surface (final-revision requirement #6): every action
 * here is `products:edit` — the same permission that already gates piece
 * price entry, since a size list only exists to serve pricing.
 */
export async function getAllSizesAction(): Promise<ActionResult<Size[]>> {
  await requirePermission("products:view");
  const data = await getAllSizes();
  return { success: true, data };
}

export async function createSizeAction(label: string): Promise<ActionResult<{ id: string; label: string }>> {
  await requirePermission("products:edit");
  const result = await createSize(label);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/products/sizes");
  return { success: true, data: result.data };
}

export async function renameSizeAction(sizeId: string, label: string): Promise<ActionResult> {
  await requirePermission("products:edit");
  const result = await renameSize(sizeId, label);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/products/sizes");
  return { success: true, data: undefined };
}

export async function reorderSizesAction(orderedSizeIds: string[]): Promise<ActionResult> {
  await requirePermission("products:edit");
  const result = await reorderSizes(orderedSizeIds);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/products/sizes");
  return { success: true, data: undefined };
}

export async function createPieceAction(productId: string, input: PieceInput): Promise<ActionResult<ProductPiece>> {
  const session = await requirePermission("products:edit");

  const parsed = pieceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "اطلاعات وارد شده معتبر نیست", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  const result = await createPiece(productId, parsed.data, session.user.id);
  if (!result.success) return { success: false, error: result.error, fieldErrors: { name: result.error } };

  revalidatePath(`/products/${productId}`);
  return { success: true, data: result.data };
}

export async function updatePieceAction(pieceId: string, input: PieceInput): Promise<ActionResult> {
  const session = await requirePermission("products:edit");

  const parsed = pieceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "اطلاعات وارد شده معتبر نیست", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  const result = await updatePiece(pieceId, parsed.data, session.user.id);
  if (!result.success) return { success: false, error: result.error, fieldErrors: { name: result.error } };

  revalidatePath(`/products/${result.data.productId}`);
  return { success: true, data: undefined };
}

export async function deletePieceAction(pieceId: string, productId: string): Promise<ActionResult> {
  const session = await requirePermission("products:edit");

  const result = await deletePiece(pieceId, session.user.id);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath(`/products/${productId}`);
  return { success: true, data: undefined };
}

export async function reorderPiecesAction(productId: string, orderedPieceIds: string[]): Promise<ActionResult> {
  await requirePermission("products:edit");

  const result = await reorderPieces(productId, orderedPieceIds);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath(`/products/${productId}`);
  return { success: true, data: undefined };
}

export async function upsertPieceSizeAction(
  pieceId: string,
  productId: string,
  input: PriceEntryInput,
  reason?: string,
): Promise<ActionResult> {
  const session = await requirePermission("products:edit");

  const parsed = priceEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "اطلاعات وارد شده معتبر نیست", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  const result = await upsertPieceSize(
    pieceId,
    parsed.data.sizeId,
    parsed.data.unitPrice,
    parsed.data.defaultPackSize,
    session.user.id,
    reason,
  );
  if (!result.success) return { success: false, error: result.error };

  revalidatePath(`/products/${productId}`);
  return { success: true, data: undefined };
}

export async function getPriceHistoryAction(productPieceSizeId: string): Promise<ActionResult<PriceHistoryRow[]>> {
  await requirePermission("products:view");
  const data = await getPriceHistory(productPieceSizeId);
  return { success: true, data };
}

export async function bulkUpdatePricesAction(input: PriceAdjustmentInput): Promise<ActionResult<{ updatedCount: number }>> {
  const session = await requirePermission("products:edit");

  const parsed = priceAdjustmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "اطلاعات وارد شده معتبر نیست" };
  }

  const adjustment: PriceAdjustment = { type: parsed.data.adjustmentType, value: parsed.data.value };
  const result = await bulkUpdatePrices(
    parsed.data.productPieceSizeIds,
    adjustment,
    parsed.data.roundTo,
    parsed.data.reason,
    session.user.id,
  );
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/products");
  return { success: true, data: result.data };
}

export async function duplicateProductAction(productId: string): Promise<ActionResult<Product>> {
  const session = await requirePermission("products:edit");

  const result = await duplicateProduct(productId, session.user.id);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/products");
  return { success: true, data: result.data };
}

/** Phase 13 additive extension — the order builder's product picker reads. */
export async function searchProductsForOrderAction(
  query: string,
): Promise<ActionResult<{ id: string; productCode: string; name: string; imageFilePath: string | null }[]>> {
  await requirePermission("products:view");
  const data = await searchProductsForOrder(query);
  return { success: true, data };
}

export async function getProductForOrderAction(productId: string): Promise<ActionResult<ProductForOrder>> {
  await requirePermission("products:view");
  const data = await getProductForOrder(productId);
  if (!data) return { success: false, error: "محصول یافت نشد یا غیرفعال است" };
  return { success: true, data };
}

/** Inline-editable Accounting Code field on the product detail page (Accounting Helper's Products-page extension). */
export async function updateAccountingCodeAction(
  productPieceSizeId: string,
  productId: string,
  input: AccountingCodeInput,
): Promise<ActionResult<{ accountingCode: string | null }>> {
  const session = await requirePermission("products:edit");

  const parsed = accountingCodeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "کد حسابداری معتبر نیست", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  const result = await updateAccountingCode(productPieceSizeId, parsed.data.code, session.user.id);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath(`/products/${productId}`);
  return { success: true, data: result.data };
}

/**
 * Accounting Helper's own reads (Tools section) — gated on `utilities:use`
 * rather than `products:view`, since these exist solely to serve that one
 * tool page, not general catalog browsing.
 */
export async function searchProductsForAccountingAction(
  query: string,
): Promise<ActionResult<{ id: string; productCode: string; name: string }[]>> {
  await requirePermission("utilities:use");
  const data = await searchProductsForAccounting(query);
  return { success: true, data };
}

export async function getProductForAccountingAction(productId: string): Promise<ActionResult<ProductForAccounting>> {
  await requirePermission("utilities:use");
  const data = await getProductForAccounting(productId);
  if (!data) return { success: false, error: "محصول یافت نشد" };
  return { success: true, data };
}
