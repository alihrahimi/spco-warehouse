import type { CustomerStatus } from "@/lib/enums";
import { cn } from "@/lib/utils";

/**
 * Customer status pill — its own component rather than reusing
 * `StatusBadge` (order statuses) or `AccountStatusBadge` (user account
 * statuses): each domain has a different value set and different Persian
 * labels, and conflating them risks the exact bug already caught once in
 * Phase 10 (rendering an order's "تکمیل شده" for an unrelated entity).
 */
const statusConfig: Record<CustomerStatus, { label: string; className: string }> = {
  active: { label: "فعال", className: "bg-success-light text-success border-success/30" },
  inactive: { label: "غیرفعال", className: "bg-disabled text-foreground-secondary border-disabled-border" },
  blocked: { label: "مسدود", className: "bg-danger-light text-danger border-danger/30" },
};

export function CustomerStatusBadge({ status, className }: { status: CustomerStatus; className?: string }) {
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
