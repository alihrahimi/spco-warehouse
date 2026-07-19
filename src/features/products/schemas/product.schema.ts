import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(2, "نام محصول را وارد کنید"),
  categoryId: z.string().uuid("دسته‌بندی را انتخاب کنید"),
  description: z.string().trim().optional().or(z.literal("")),
});

export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2, "نام دسته‌بندی را وارد کنید"),
  description: z.string().trim().optional().or(z.literal("")),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const pieceSchema = z.object({
  name: z.string().trim().min(1, "نام قطعه را وارد کنید"),
});

export type PieceInput = z.infer<typeof pieceSchema>;

/** A size's price + pack size for one piece. `unitPrice` is validated as a positive integer Toman amount (no decimals, per Phase 01's currency decision). */
export const priceEntrySchema = z.object({
  sizeId: z.string().uuid(),
  unitPrice: z.number().int("قیمت باید عدد صحیح باشد").positive("قیمت باید بیشتر از صفر باشد"),
  defaultPackSize: z.number().int().positive("سایز بسته باید بیشتر از صفر باشد").default(6),
});

export type PriceEntryInput = z.infer<typeof priceEntrySchema>;

export const priceAdjustmentSchema = z.object({
  productPieceSizeIds: z.array(z.string().uuid()).min(1, "حداقل یک مورد را انتخاب کنید"),
  adjustmentType: z.enum(["percentage_increase", "percentage_decrease", "fixed_increase", "fixed_decrease"]),
  value: z.number().positive("مقدار باید بیشتر از صفر باشد"),
  roundTo: z.number().int().min(0).default(0),
  reason: z.string().trim().optional().or(z.literal("")),
});

export type PriceAdjustmentInput = z.infer<typeof priceAdjustmentSchema>;

/** Empty string clears the code (stored as `null`); otherwise free-text — accounting codes aren't guaranteed numeric-only across every external system. */
export const accountingCodeSchema = z.object({
  code: z.string().trim().max(40, "کد حسابداری نباید بیشتر از ۴۰ کاراکتر باشد"),
});

export type AccountingCodeInput = z.infer<typeof accountingCodeSchema>;

export const productSearchSchema = z.object({
  query: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().uuid().optional(),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("updatedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type ProductSearchInput = z.infer<typeof productSearchSchema>;
