"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { useId } from "react";

import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps extends RadioGroupPrimitive.RadioGroupProps {
  options: RadioOption[];
  /** Stacks options vertically instead of the default horizontal row. */
  orientation?: "horizontal" | "vertical";
}

/**
 * DESIGN-SYSTEM.md §8: control at the right of its own label, ≥12px gap
 * between options (`gap-3` = 12px) for comfortable touch spacing.
 */
export function RadioGroup({ options, orientation = "horizontal", className, ...props }: RadioGroupProps) {
  const groupId = useId();

  return (
    <RadioGroupPrimitive.Root
      className={cn("flex gap-3", orientation === "vertical" ? "flex-col" : "flex-row flex-wrap", className)}
      {...props}
    >
      {options.map((option) => {
        const fieldId = `${groupId}-${option.value}`;
        return (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroupPrimitive.Item
              id={fieldId}
              value={option.value}
              className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface data-[state=checked]:border-primary"
            >
              <RadioGroupPrimitive.Indicator className="size-3 rounded-full bg-primary" />
            </RadioGroupPrimitive.Item>
            <label htmlFor={fieldId} className="text-body text-foreground">
              {option.label}
            </label>
          </div>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}
