import { z } from "zod";

/**
 * One order line = one piece+size with BOTH quantities at once (Phase 13:
 * the user is never asked to choose pack vs unit mode). A line is valid
 * for saving as long as neither quantity is negative; a line only counts
 * toward a convertible order if at least one is positive.
 */
export const orderItemSchema = z
  .object({
    productPieceSizeId: z.string().uuid(),
    packQuantity: z.number().int("تعداد بسته باید عدد صحیح باشد").min(0, "تعداد بسته نمی‌تواند منفی باشد"),
    unitQuantity: z.number().int("تعداد عددی باید عدد صحیح باشد").min(0, "تعداد عددی نمی‌تواند منفی باشد"),
  })
  .refine((item) => item.packQuantity > 0 || item.unitQuantity > 0, {
    message: "حداقل یکی از تعداد بسته یا تعداد عددی باید بیشتر از صفر باشد",
  });

export type OrderItemInput = z.infer<typeof orderItemSchema>;

/** Draft saves tolerate an empty item list (an order-in-progress); conversion to pre-invoice enforces ≥1 item in the service layer. */
export const saveDraftSchema = z.object({
  orderId: z.string().uuid().nullable(),
  customerId: z.string().uuid("مشتری را انتخاب کنید"),
  items: z.array(orderItemSchema),
  notes: z.string().trim().optional().or(z.literal("")),
  customerNotes: z.string().trim().optional().or(z.literal("")),
});

export type SaveDraftInput = z.infer<typeof saveDraftSchema>;

/** Post-pre-invoice edits — same payload as a draft save plus the optional version-history reason. */
export const updateOrderSchema = z.object({
  orderId: z.string().uuid(),
  items: z.array(orderItemSchema).min(1, "سفارش باید حداقل یک قلم داشته باشد"),
  notes: z.string().trim().optional().or(z.literal("")),
  customerNotes: z.string().trim().optional().or(z.literal("")),
  changeReason: z.string().trim().optional().or(z.literal("")),
});

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export const orderSearchSchema = z.object({
  query: z.string().trim().optional(),
  status: z
    .enum(["draft", "pre_invoice_generated", "pending_payment", "preparing", "ready", "completed", "cancelled"])
    .optional(),
  customerId: z.string().uuid().optional(),
  paymentStatus: z.enum(["unpaid", "partial", "paid"]).optional(),
  /** ISO date strings (Gregorian) — the UI's Jalali range picker converts before submitting. */
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type OrderSearchInput = z.infer<typeof orderSearchSchema>;
