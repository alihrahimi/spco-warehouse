/**
 * Static, non-business configuration for the internal tool itself.
 *
 * Deliberately does NOT hold the manufacturer's company name, logo, or any
 * other business-identity field — those are database-driven via
 * `CompanySettings` (Database Phase) precisely so they're never hardcoded.
 * What lives here is only the technical identity of this application as a
 * piece of software (its PWA name, locale, timezone).
 */
export const siteConfig = {
  /** Internal tool name — shown in the browser tab and PWA install prompt. */
  appName: "سامانه انبار",
  locale: "fa-IR",
  direction: "rtl",
  /** Iran Standard Time — used for any server-side "current time" default. */
  timeZone: "Asia/Tehran",
} as const;
