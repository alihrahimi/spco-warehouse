import { cn } from "@/lib/utils";

/**
 * DESIGN-SYSTEM.md §10 — the seven statuses, self-contained here rather
 * than importing Prisma's `OrderStatus`/payment enums: this is a UI-library
 * component (Phase 08 explicitly excludes any database connection), so it
 * defines its own status vocabulary and a feature maps its domain enum
 * values onto these keys wherever a badge is actually rendered.
 */
export type StatusBadgeStatus =
  | "draft"
  | "pre_invoice_generated"
  | "pending_payment"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "unpaid"
  | "partial_payment"
  | "fully_settled";

const statusConfig: Record<StatusBadgeStatus, { label: string; className: string }> = {
  // draft/pre_invoice_generated/unpaid added in Phase 13 (additive
  // extension for the new order lifecycle + payment states — the original
  // seven entries are untouched).
  draft: { label: "پیش‌نویس", className: "bg-disabled text-foreground-secondary border-disabled-border" },
  pre_invoice_generated: { label: "پیش‌فاکتور صادر شده", className: "bg-primary-light text-primary border-primary-border" },
  unpaid: { label: "پرداخت نشده", className: "bg-danger-light text-danger border-danger/30" },
  pending_payment: { label: "در انتظار پرداخت", className: "bg-warning-light text-warning border-warning/30" },
  preparing: { label: "در حال آماده‌سازی", className: "bg-info-light text-info border-info/30" },
  ready: { label: "آماده ارسال", className: "bg-secondary-light text-secondary border-secondary/30" },
  completed: { label: "تکمیل شده", className: "bg-success-light text-success border-success/30" },
  // Deliberately neutral, not Danger: a cancelled order is a closed state,
  // not an error, and shouldn't visually alarm staff — DESIGN-SYSTEM.md §10.
  cancelled: { label: "لغو شده", className: "bg-disabled text-foreground-secondary border-disabled-border" },
  partial_payment: { label: "پرداخت ناقص", className: "bg-warning-light text-warning border-warning/30" },
  fully_settled: { label: "تسویه کامل", className: "bg-success-light text-success border-success/30" },
};

export function StatusBadge({ status, className }: { status: StatusBadgeStatus; className?: string }) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-body-small font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
