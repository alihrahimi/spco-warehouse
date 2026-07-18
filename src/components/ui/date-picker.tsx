"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { toJalaali } from "jalaali-js";
import { Calendar } from "lucide-react";
import { useState } from "react";

import { JalaliCalendar } from "@/components/ui/jalali-calendar";
import { formatJalaliNumeric, getCurrentJalaliYear } from "@/lib/format/date";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  id?: string;
}

/**
 * The app's only date input — native Jalali, never Gregorian-with-
 * converted-labels, per DESIGN-SYSTEM.md §8. See `JalaliCalendar` for why
 * this is a hand-built Popover + calendar grid rather than
 * `react-multi-date-picker` (approved in Phase 01, but empirically broken
 * under React 19 in this project).
 */
export function DatePicker({ value, onChange, placeholder = "انتخاب تاریخ", disabled, invalid, className, id }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const initialView = value ? toJalaali(value) : { jy: getCurrentJalaliYear(), jm: 1 };
  const [view, setView] = useState({ year: initialView.jy, month: value ? toJalaali(value).jm : 1 });

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          data-invalid={invalid || undefined}
          className={cn(
            "flex h-[52px] w-full items-center justify-between rounded-medium border border-border bg-surface px-4 text-body-large text-foreground disabled:bg-disabled disabled:text-disabled-foreground data-[invalid]:border-danger",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span>{value ? formatJalaliNumeric(value) : placeholder}</span>
          <Calendar className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 overflow-hidden rounded-medium border border-border bg-surface shadow-[var(--shadow-elevation-3)]"
        >
          <JalaliCalendar
            viewYear={view.year}
            viewMonth={view.month}
            onViewChange={(year, month) => setView({ year, month })}
            selected={value}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
