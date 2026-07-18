import { z } from "zod";

import { toLatinDigits } from "@/lib/format/persian-digits";

/**
 * Accepts Persian or Latin digits (normalizing before the pattern check,
 * since a warehouse tablet's Persian keyboard is the expected input
 * method), and requires the standard Iranian mobile shape: `09` followed
 * by 9 digits (11 digits total, e.g. `09123456789`).
 */
const mobileSchema = z
  .string()
  .trim()
  .min(1, "شماره موبایل را وارد کنید")
  .transform((value) => toLatinDigits(value))
  .refine((value) => /^09\d{9}$/.test(value), "شماره موبایل معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹");

/** Optional landline/secondary phone — looser than mobile (allows area-code-prefixed numbers), still digits-only after normalization. */
const optionalPhoneSchema = z
  .string()
  .trim()
  .transform((value) => toLatinDigits(value))
  .refine((value) => value === "" || /^0\d{9,10}$/.test(value), "شماره تلفن معتبر نیست")
  .optional()
  .or(z.literal(""));

export const customerSchema = z.object({
  name: z.string().trim().min(2, "نام مشتری را وارد کنید"),
  mobile: mobileSchema,
  defaultPaymentType: z.enum(["cash", "cheque"], { message: "نوع پرداخت را انتخاب کنید" }),
  phone: optionalPhoneSchema,
  province: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export const customerSearchSchema = z.object({
  query: z.string().trim().optional(),
  status: z.enum(["active", "inactive", "blocked"]).optional(),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["name", "createdAt", "lastOrderDate"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type CustomerSearchInput = z.infer<typeof customerSearchSchema>;
