/**
 * Digit conversion between Latin and Persian numerals.
 *
 * Design System §1/§2: every on-screen and PDF numeral is rendered in
 * Persian digits (۰۱۲۳۴۵۶۷۸۹ — Unicode U+06F0–U+06F9), while stored/parsed
 * values stay plain numeric. Input parsing also accepts Arabic-Indic digits
 * (٠-٩ — U+0660–U+0669), since some Android keyboards produce that set
 * instead of the Persian one depending on the device's locale settings.
 */

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"] as const;

const ARABIC_INDIC_TO_LATIN: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

const PERSIAN_TO_LATIN: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

/** Converts every Latin digit (0-9) in `input` to its Persian equivalent. */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (digit) => {
    const index = Number(digit);
    return PERSIAN_DIGITS[index] ?? digit;
  });
}

/**
 * Converts Persian or Arabic-Indic digits in `input` back to Latin digits.
 * Non-digit characters (grouping separators, unit words) are left untouched.
 */
export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (digit) => PERSIAN_TO_LATIN[digit] ?? ARABIC_INDIC_TO_LATIN[digit] ?? digit);
}
