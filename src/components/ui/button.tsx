import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { Spinner } from "@/components/shared/spinner";
import { cn } from "@/lib/utils";

/**
 * DESIGN-SYSTEM.md §7. Default height is 52px — the app's standard, not a
 * minimum floor, per Phase 01's "almost no computer knowledge" requirement.
 * `size="compact"` (44px, still above the accessibility floor) is reserved
 * for dense contexts like inline table-row actions.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-medium text-body font-medium transition-colors disabled:pointer-events-none disabled:bg-disabled disabled:text-disabled-foreground disabled:border-disabled-border",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        secondary: "border border-border bg-surface text-foreground hover:bg-hover",
        outline: "border border-primary bg-transparent text-primary hover:bg-primary-light",
        ghost: "bg-transparent text-foreground-secondary hover:bg-hover",
        danger: "bg-danger text-primary-foreground hover:opacity-90 active:opacity-80",
        success: "bg-success text-primary-foreground hover:opacity-90 active:opacity-80",
      },
      size: {
        default: "h-[52px] px-6",
        compact: "h-11 px-4",
        icon: "size-11 shrink-0 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Renders the button as its single child element (Radix `Slot`) instead of a `<button>`. */
  asChild?: boolean;
  /** Shows a spinner and disables interaction, without changing the button's footprint. */
  loading?: boolean;
}

export function Button({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }: ButtonProps) {
  // `asChild` is for pure navigation (e.g. wrapping a `Link`) — Radix
  // `Slot` requires exactly one element child to clone props onto, so it
  // can't also carry the conditional loading-spinner node the plain
  // `<button>` path below renders; loading state has no real meaning for
  // a link anyway, so this path skips it entirely rather than fighting
  // `Slot`'s single-child constraint.
  if (asChild) {
    return (
      <Slot className={cn(buttonVariants({ variant, size, className }))} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled ?? loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? <Spinner size={18} label="در حال پردازش" className="text-current" /> : null}
      {children}
    </button>
  );
}
