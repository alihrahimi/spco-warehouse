"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

/**
 * e.g. the XPS→PDF conversion's progress state (SCREEN-SPECS.md §17).
 * `value` is 0–100. The indicator fills from the right toward the left —
 * the reading direction under RTL — using a `scaleX` anchored to a
 * *physical* `right` origin rather than a `translateX` shift (the common
 * LTR-oriented implementation, which grows left-to-right and would need
 * inverting here). `transform-origin: right` is physical, unaffected by
 * `dir`, so this holds regardless of the surrounding direction.
 */
export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <ProgressPrimitive.Root
      value={value}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-disabled", className)}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full origin-right bg-primary transition-transform duration-300"
        style={{ transform: `scaleX(${value / 100})` }}
      />
    </ProgressPrimitive.Root>
  );
}
