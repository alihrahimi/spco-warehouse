import { toLatinDigits, toPersianDigits } from "@/lib/format/persian-digits";

/**
 * Toman formatting per Design System §3/§7/§8: Persian digits, comma
 * grouping, no decimals, unit word trailing the number (e.g. "۱۲۰,۰۰۰ تومان").
 *
 * Deliberately does not delegate to `Intl.NumberFormat("fa-IR")`: that
 * locale groups digits with the Arabic thousands separator (٬) by default,
 * which does not match the comma-grouped format already fixed across
 * UX-FLOW.md, DESIGN-SYSTEM.md, and SCREEN-SPECS.md. Grouping is done
 * against the Latin representation first, then converted to Persian digits,
 * so the separator character stays a plain comma as specified.
 */

const TOMAN_UNIT = "تومان";

/** Rounds to the nearest whole Toman — the currency has no decimal places. */
function toWholeToman(amount: number | bigint): bigint {
  if (typeof amount === "bigint") return amount;
  return BigInt(Math.round(amount));
}

function groupWithCommas(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export interface FormatTomanOptions {
  /** Append the "تومان" unit word. Defaults to `true`. */
  withUnit?: boolean;
}

/**
 * Formats an integer Toman amount for display, e.g. `formatToman(1800000)`
 * → `"۱,۸۰۰,۰۰۰ تومان"`.
 */
export function formatToman(amount: number | bigint, options: FormatTomanOptions = {}): string {
  const { withUnit = true } = options;
  const whole = toWholeToman(amount);
  const isNegative = whole < 0n;
  const digits = (isNegative ? -whole : whole).toString();
  const grouped = groupWithCommas(digits);
  const withSign = isNegative ? `-${grouped}` : grouped;
  const persian = toPersianDigits(withSign);
  return withUnit ? `${persian} ${TOMAN_UNIT}` : persian;
}

/**
 * Parses a live-typed, formatted Toman string back into a raw integer.
 * Accepts Persian or Latin digits, comma/Arabic-Indic separators, and an
 * optional trailing unit word — strips everything that isn't a digit or a
 * leading minus sign. Returns `0` for empty or unparseable input.
 */
export function parseTomanInput(raw: string): number {
  const latin = toLatinDigits(raw);
  const cleaned = latin.replace(/[^0-9-]/g, "");
  if (cleaned === "" || cleaned === "-") return 0;
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}
