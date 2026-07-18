"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { useId } from "react";

import { cn } from "@/lib/utils";

export interface CheckboxProps extends CheckboxPrimitive.CheckboxProps {
  /**
   * Rendered after the control in DOM order. Per DESIGN-SYSTEM.md §8, this
   * alone (with no extra RTL handling) places the control at the right
   * edge and the label extending to its left — the natural result of DOM
   * order under `dir="rtl"`. Omit for a bare checkbox (e.g. a DataTable
   * selection cell) and pass `aria-label` instead.
   */
  label?: string;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  const control = (
    <CheckboxPrimitive.Root
      id={fieldId}
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-small border border-border bg-surface data-[state=checked]:border-primary data-[state=checked]:bg-primary disabled:bg-disabled disabled:border-disabled-border",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="size-4 text-primary-foreground" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) return control;

  return (
    <div className="flex items-center gap-3">
      {control}
      <label htmlFor={fieldId} className="text-body text-foreground">
        {label}
      </label>
    </div>
  );
}
