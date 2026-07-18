/**
 * Canonical value sets for every column that used to be a Prisma `enum`.
 *
 * SQLite has no native enum type, so `schema.prisma` models these columns
 * as plain `String` (see the per-model comments there) — which also makes
 * the schema genuinely provider-swappable, since Postgres enums and SQLite
 * strings would otherwise need two different schemas. Prisma Client no
 * longer generates these as TS types/runtime objects, so this module is
 * now their single source of truth: the literal string values written to
 * the database are UNCHANGED from the old Postgres enum values (so no data
 * migration implication going the other way), only where the TypeScript
 * type comes from has moved.
 *
 * Each constant is validated at the boundary by the matching Zod schema in
 * the owning feature's `schemas/*.ts` — the database itself no longer
 * enforces membership, exactly like every other `String` column already
 * relied on application-layer validation for shape (max length, etc.).
 */

export const PAYMENT_METHODS = ["cash", "cheque"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CASH_PAYMENT_TYPES = ["deposit", "remaining_balance", "full_payment"] as const;
export type CashPaymentType = (typeof CASH_PAYMENT_TYPES)[number];

/**
 * Lifecycle: draft → pre_invoice_generated → pending_payment → preparing →
 * ready → completed, with cancelled reachable from any non-completed
 * state. All transitions are manual (Phase 13).
 */
export const ORDER_STATUSES = [
  "draft",
  "pre_invoice_generated",
  "pending_payment",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const NOTIFICATION_CHANNELS = ["telegram", "whatsapp", "sms", "email"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = ["pending", "sent", "failed"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const SETTING_VALUE_TYPES = ["string", "number", "boolean", "json"] as const;
export type SettingValueType = (typeof SETTING_VALUE_TYPES)[number];

export const USER_STATUSES = ["active", "inactive", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const AUTH_EVENT_TYPES = [
  "login_success",
  "login_failed",
  "logout",
  "password_changed",
  "password_reset_by_admin",
] as const;
export type AuthEventType = (typeof AUTH_EVENT_TYPES)[number];

export const CUSTOMER_STATUSES = ["active", "inactive", "blocked"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const AUDIT_ACTIONS = [
  "created",
  "updated",
  "status_changed",
  "payment_type_changed",
  "price_updated",
  "piece_added",
  "piece_removed",
  "payment_registered",
  "payment_updated",
  "invoice_generated",
  "invoice_printed",
  "pdf_exported",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const PHONE_KINDS = ["mobile", "telephone"] as const;
export type PhoneKind = (typeof PHONE_KINDS)[number];
