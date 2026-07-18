import { cn } from "@/lib/utils";
import type { UserStatus } from "@/lib/enums";

/**
 * User account status pill — deliberately separate from `StatusBadge`
 * (order/payment statuses only, per DESIGN-SYSTEM.md §10's fixed
 * seven-value vocabulary). Reusing that component here would render the
 * wrong Persian words for an account (e.g. "تکمیل شده" for an active
 * user), since its labels are order-specific, not account-specific.
 */
const statusConfig: Record<UserStatus, { label: string; className: string }> = {
  active: { label: "فعال", className: "bg-success-light text-success border-success/30" },
  inactive: { label: "غیرفعال", className: "bg-disabled text-foreground-secondary border-disabled-border" },
  suspended: { label: "معلق", className: "bg-danger-light text-danger border-danger/30" },
};

export function AccountStatusBadge({ status, className }: { status: UserStatus; className?: string }) {
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
