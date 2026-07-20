/**
 * Public surface of the products feature (FRONTEND-ARCHITECTURE.md §4/§13:
 * other features import from here, never from internals). Exposes exactly
 * what the order builder (Phase 13) and the Accounting Helper feature need
 * — nothing else is sanctioned for cross-feature use.
 */
export { getProductForOrderAction, searchProductsForOrderAction } from "@/features/products/actions";
export type { ProductForOrder } from "@/features/products/services";

export {
  getProductForAccountingAction,
  searchProductsForAccountingAction,
  updateAccountingCodeAction,
  upsertPieceSizeAction,
} from "@/features/products/actions";
export type { ProductForAccounting } from "@/features/products/services";
