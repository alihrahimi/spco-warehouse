"use client";

import { useState, type InputHTMLAttributes } from "react";

import { formatToman, parseTomanInput } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  /** Raw Toman amount (no decimals). */
  value: number;
  onChange: (value: number) => void;
  invalid?: boolean;
}

/**
 * Live Persian-grouped Toman input, per DESIGN-SYSTEM.md §8: displays
 * `۱۲۰,۰۰۰ تومان` while typing, but the value passed to `onChange` is
 * always a raw integer — callers never handle formatted strings.
 *
 * The unit word is rendered as a fixed suffix inside the field rather than
 * live-typed, so the caret never has to jump around a moving "تومان" while
 * the user types digits in the middle of the number.
 */
export function CurrencyInput({ value, onChange, invalid, className, disabled, ...props }: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = value === 0 && !isFocused ? "" : formatToman(value, { withUnit: false });

  return (
    <div
      className={cn(
        "flex h-[52px] items-center rounded-medium border border-border bg-surface px-4 focus-within:border-primary",
        invalid && "border-danger",
        disabled && "bg-disabled",
        className,
      )}
    >
      <input
        type="text"
        inputMode="numeric"
        dir="ltr"
        aria-invalid={invalid}
        disabled={disabled}
        value={displayValue}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(event) => onChange(parseTomanInput(event.target.value))}
        className="min-w-0 flex-1 bg-transparent text-end text-body-large text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:text-disabled-foreground"
        placeholder="۰"
        {...props}
      />
      <span className="ms-2 shrink-0 text-body text-foreground-secondary">تومان</span>
    </div>
  );
}
