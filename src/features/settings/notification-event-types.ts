/**
 * The notification event types the system queues (Phase 13 foundation).
 * Client-safe module (no Prisma import) so the settings panel can render
 * Persian labels without pulling server-only code into the browser bundle
 * — same split rationale as `lib/auth/error-codes.ts`.
 */
export const NOTIFICATION_EVENT_TYPES: { eventType: string; labelFa: string }[] = [
  { eventType: "order_created", labelFa: "ثبت سفارش جدید" },
  { eventType: "payment_received", labelFa: "دریافت پرداخت" },
];
