import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * DESIGN-SYSTEM.md §11: every card shares radius-large, a surface
 * background, a 1px border (kept even under shadow — bright warehouse
 * lighting can wash a shadow-only edge out), elevation-1 at rest.
 * `interactive` adds the hover(desktop)/press(touch) elevation-2 step for
 * cards that are themselves tappable (e.g. a Dashboard tile, a product
 * card in the New Order picker).
 */
export function Card({ className, interactive, ...props }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-large border border-border bg-surface p-4 shadow-[var(--shadow-elevation-1)]",
        interactive && "cursor-pointer transition-shadow hover:shadow-[var(--shadow-elevation-2)] active:shadow-[var(--shadow-elevation-2)]",
        className,
      )}
      {...props}
    />
  );
}
