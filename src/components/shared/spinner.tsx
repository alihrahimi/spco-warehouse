import { cn } from "@/lib/utils";

interface SpinnerProps {
  /** Pixel size of the spinner. Defaults to 24 (inline use); pass 40+ for full-page loading states. */
  size?: number;
  className?: string;
  /** Accessible label read by screen readers — required since the spinner itself carries no text. */
  label?: string;
}

/**
 * The generic loading indicator behind `app/loading.tsx` and any
 * action-level loading state (Design System §14 — "Loading" empty state).
 * List/table screens should prefer a skeleton over this component once
 * built (Design System §14 explains why); this is for full-page and
 * action-level waits.
 */
export function Spinner({ size = 24, className, label = "در حال بارگذاری" }: SpinnerProps) {
  return (
    <svg
      role="status"
      aria-label={label}
      className={cn("animate-spin text-primary", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
