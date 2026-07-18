import { z } from "zod";

import { toLatinDigits } from "@/lib/format/persian-digits";

const phoneEntrySchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(1, "شماره را وارد کنید")
    .transform((value) => toLatinDigits(value)),
  kind: z.enum(["mobile", "telephone"]),
  label: z.string().trim().optional().or(z.literal("")),
});

export const companySettingsSchema = z.object({
  companyName: z.string().trim().min(2, "نام شرکت را وارد کنید"),
  managerName: z.string().trim().optional().or(z.literal("")),
  phoneNumbers: z.array(phoneEntrySchema),
  whatsappNumber: z.string().trim().transform((value) => toLatinDigits(value)).optional().or(z.literal("")),
  telegramHandle: z.string().trim().optional().or(z.literal("")),
  instagramHandle: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  footerText: z.string().trim().optional().or(z.literal("")),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

/**
 * System settings (Phase 14): numbering prefix drives both the order and
 * invoice number format (one number system, fixed in Phase 13); currency
 * display and pack-size default live in the `application_settings`
 * key-value table designed for exactly this.
 */
export const systemSettingsSchema = z.object({
  numberPrefix: z
    .string()
    .trim()
    .max(10, "پیشوند حداکثر ۱۰ کاراکتر است")
    .regex(/^[A-Za-z0-9-]*$/, "پیشوند فقط حروف لاتین، رقم و خط تیره — روی اسناد چاپی و جستجو استفاده می‌شود")
    .optional()
    .or(z.literal("")),
  invoiceFooterNote: z.string().trim().optional().or(z.literal("")),
  showLogoOnInvoice: z.boolean(),
  defaultPackSize: z.number().int().positive("سایز بسته باید بیشتر از صفر باشد"),
  currencyLabel: z.string().trim().min(1, "واحد پول را وارد کنید"),
});

export type SystemSettingsInput = z.infer<typeof systemSettingsSchema>;

export const notificationSettingSchema = z.object({
  eventType: z.string().min(1),
  isEnabled: z.boolean(),
  telegramChatId: z.string().trim().optional().or(z.literal("")),
});

export type NotificationSettingInput = z.infer<typeof notificationSettingSchema>;
