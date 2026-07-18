import { toJalaali, toGregorian, type JalaaliDate } from "jalaali-js";
import { toPersianDigits } from "@/lib/format/persian-digits";

/**
 * Jalali (Persian/Shamsi) date conversion and display formatting, per Phase
 * 01: every user-facing date is Jalali; Gregorian `Date` objects remain the
 * storage/interchange format everywhere else in the stack (Prisma, the
 * database, `Date` arithmetic).
 */

const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

/** Converts a Gregorian `Date` to its Jalali `{ jy, jm, jd }` components. */
export function toJalaliDate(date: Date): JalaaliDate {
  return toJalaali(date);
}

/** Converts Jalali `(jy, jm, jd)` components to a Gregorian `Date`. */
export function fromJalaliDate(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

/**
 * Formats a `Date` as a numeric Jalali date, e.g. `۱۴۰۵/۰۴/۲۶`. This is the
 * default format used across order lists, tables, and timestamps.
 */
export function formatJalaliNumeric(date: Date): string {
  const { jy, jm, jd } = toJalaali(date);
  return toPersianDigits(`${jy}/${pad2(jm)}/${pad2(jd)}`);
}

/**
 * Formats a `Date` as a long-form Jalali date, e.g. `۲۶ تیر ۱۴۰۵`. Used on
 * the invoice header, where a numeric-only date reads less naturally.
 */
export function formatJalaliLong(date: Date): string {
  const { jy, jm, jd } = toJalaali(date);
  const monthName = JALALI_MONTH_NAMES[jm - 1];
  return toPersianDigits(`${jd} `) + monthName + toPersianDigits(` ${jy}`);
}

/**
 * Formats a `Date` as a Jalali date plus 24-hour clock time, e.g.
 * `۱۴۰۵/۰۴/۲۶ ۱۴:۳۰` — used in the Notifications History log.
 */
export function formatJalaliDateTime(date: Date): string {
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  return `${formatJalaliNumeric(date)} ${toPersianDigits(time)}`;
}

/**
 * The current Jalali year, used to drive per-year invoice numbering
 * (`InvoiceSequence`, per the Database Phase) and default filter values.
 */
export function getCurrentJalaliYear(): number {
  return toJalaali(new Date()).jy;
}

/**
 * UTC instant of today's 00:00 in Tehran (siteConfig's business timezone).
 * Iran abolished DST in 2022 — the offset is a fixed +03:30, so Tehran
 * midnight is simply that calendar date's UTC midnight minus 3.5 hours.
 * Used by "today's orders"-style dashboard stats so the day boundary
 * follows the warehouse's clock, not the VPS's.
 */
export function tehranStartOfToday(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const utcMidnight = Date.UTC(get("year"), get("month") - 1, get("day"));
  return new Date(utcMidnight - 3.5 * 60 * 60 * 1000);
}
