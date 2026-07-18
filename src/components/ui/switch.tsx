"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { useId } from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps extends SwitchPrimitive.SwitchProps {
  label?: string;
}

/**
 * DESIGN-SYSTEM.md §8: OFF = thumb left, ON = thumb right — the same
 * physical direction most switch components already default to, which is
 * exactly why this needs a deliberate note. If the thumb's resting/active
 * position were built with *logical* properties (`start`/`end`,
 * `margin-inline-*`), `dir="rtl"` on the document would silently flip it
 * to ON=left. The track/thumb below use physical `left` + a raw
 * `translate-x` transform instead — transforms are never affected by
 * `dir`, so ON=right holds regardless of the surrounding direction.
 */
export function Switch({ label, className, id, ...props }: SwitchProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  const track = (
    <SwitchPrimitive.Root
      id={fieldId}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-disabled-border transition-colors data-[state=checked]:bg-primary disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="absolute left-1 size-5 rounded-full bg-surface shadow-[var(--shadow-elevation-1)] transition-transform data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  );

  if (!label) return track;

  return (
    <div className="flex items-center gap-3">
      {track}
      <label htmlFor={fieldId} className="text-body text-foreground">
        {label}
      </label>
    </div>
  );
}
