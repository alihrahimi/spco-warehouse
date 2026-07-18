"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  /** Element `id`, for pairing with an external `<label htmlFor>`. */
  id?: string;
}

/**
 * DESIGN-SYSTEM.md §8: disclosure chevron at the trailing edge — left, in
 * RTL. Achieved by placing the `ChevronDown` icon last in the trigger's DOM
 * order under `dir="rtl"`, the same "correct by construction" approach
 * used throughout this library rather than a manual position override.
 */
export function Select({ options, value, onValueChange, placeholder = "انتخاب کنید", disabled, invalid, className, id }: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        id={id}
        aria-invalid={invalid}
        className={cn(
          "flex h-[52px] w-full items-center justify-between rounded-medium border border-border bg-surface px-4 text-body-large text-foreground data-[placeholder]:text-muted-foreground focus-visible:border-primary disabled:bg-disabled disabled:text-disabled-foreground aria-invalid:border-danger",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-5 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-72 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-medium border border-border bg-surface shadow-[var(--shadow-elevation-3)]"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="relative flex h-11 cursor-pointer select-none items-center rounded-small px-3 pe-8 text-body-large text-foreground outline-none data-[highlighted]:bg-hover data-[state=checked]:bg-primary-light data-[disabled]:pointer-events-none data-[disabled]:text-disabled-foreground"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute end-3 inline-flex">
                  <Check className="size-4 text-primary" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
