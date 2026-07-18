import { cn } from "@/lib/utils";

/** Product status is a plain two-state boolean (Phase 12: Active/Inactive only, unlike Customer's three-state status), so this stays intentionally simpler than `CustomerStatusBadge`/`AccountStatusBadge` rather than forcing a shared abstraction across differently-shaped domains. */
export function ProductStatusBadge({ isActive, className }: { isActive: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-body-small font-medium",
        isActive
          ? "bg-success-light text-success border-success/30"
          : "bg-disabled text-foreground-secondary border-disabled-border",
        className,
      )}
    >
      {isActive ? "فعال" : "غیرفعال"}
    </span>
  );
}
