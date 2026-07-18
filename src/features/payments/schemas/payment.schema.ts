import { z } from "zod";

/**
 * Cheque payments require the full cheque record (Phase 13: number, bank,
 * issue date, due date); cash payments must not carry cheque fields. The
 * discriminated refinement below produces field-level Persian errors
 * instead of one generic message.
 */
export const paymentSchema = z
  .object({
    paymentMethod: z.enum(["cash", "cheque"], { message: "روش پرداخت را انتخاب کنید" }),
    cashPaymentType: z.enum(["deposit", "remaining_balance", "full_payment"]).optional(),
    amount: z.number().int("مبلغ باید عدد صحیح باشد").positive("مبلغ باید بیشتر از صفر باشد"),
    chequeNumber: z.string().trim().optional().or(z.literal("")),
    chequeBankName: z.string().trim().optional().or(z.literal("")),
    /** ISO datetime strings — the UI's Jalali pickers convert before submitting. */
    chequeIssueDate: z.string().datetime().optional(),
    chequeDueDate: z.string().datetime().optional(),
    notes: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === "cheque") {
      if (!data.chequeNumber) ctx.addIssue({ code: "custom", path: ["chequeNumber"], message: "شماره چک را وارد کنید" });
      if (!data.chequeBankName) ctx.addIssue({ code: "custom", path: ["chequeBankName"], message: "نام بانک را وارد کنید" });
      if (!data.chequeDueDate) ctx.addIssue({ code: "custom", path: ["chequeDueDate"], message: "تاریخ سررسید را انتخاب کنید" });
    }
  });

export type PaymentInput = z.infer<typeof paymentSchema>;
