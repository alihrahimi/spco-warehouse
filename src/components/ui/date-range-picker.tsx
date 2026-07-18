"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { toJalaali } from "jalaali-js";
import { Calendar } from "lucide-react";
import { useState } from "react";

import { JalaliCalendar } from "@/components/ui/jalali-calendar";
import { formatJalaliNumeric } from "@/lib/format/date";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Range variant of `DatePicker`, built ahead of any v1 screen needing it
 * (per SCREEN-SPECS.md's "future-ready" note — Order List's future
 * date-range filter is the anticipated first consumer). Same
 * `JalaliCalendar` grid as the single-date picker; a click sets `from` if
 * empty or picking a new range, and `to` once `from` is set (swapping if
 * the second click lands before the first).
 */
export function DateRangePicker({ value, onChange, placeholder = "بازه تاریخ را انتخاب کنید", disabled, className, id }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const anchor = value.from ?? new Date();
  const anchorJalali = toJalaali(anchor);
  const [view, setView] = useState({ year: anchorJalali.jy, month: anchorJalali.jm });

  const displayValue =
    value.from && value.to
      ? `${formatJalaliNumeric(value.from)} تا ${formatJalaliNumeric(value.to)}`
      : "";

  function handleSelect(date: Date) {
    if (!value.from || (value.from && value.to)) {
      onChange({ from: date, to: null });
      return;
    }
    if (date < value.from) {
      onChange({ from: date, to: value.from });
    } else {
      onChange({ from: value.from, to: date });
    }
    setOpen(false);
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "flex h-[52px] w-full items-center justify-between rounded-medium border border-border bg-surface px-4 text-body-large text-foreground disabled:bg-disabled disabled:text-disabled-foreground",
            !displayValue && "text-muted-foreground",
            className,
          )}
        >
          <span>{displayValue || placeholder}</span>
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
            onSelect={handleSelect}
            rangeStart={value.from}
            rangeEnd={value.to}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
