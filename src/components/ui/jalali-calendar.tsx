"use client";

import { jalaaliMonthLength, toGregorian } from "jalaali-js";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { toPersianDigits } from "@/lib/format/persian-digits";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/** Saturday-first, matching the Jalali week convention (DESIGN-SYSTEM.md §8). */
const WEEKDAY_LABELS = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

function getFirstWeekdayIndex(jy: number, jm: number): number {
  const gregorian = toGregorian(jy, jm, 1);
  const jsDay = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd).getDay(); // 0=Sunday..6=Saturday
  return (jsDay + 1) % 7; // 0=Saturday..6=Friday
}

function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export interface JalaliCalendarProps {
  viewYear: number;
  viewMonth: number; // 1-12
  onViewChange: (year: number, month: number) => void;
  onSelect: (date: Date) => void;
  selected?: Date | null;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
}

/**
 * The app's Jalali calendar grid, built directly on `jalaali-js` (pure
 * calendar math, already used by `lib/format/date.ts`) rather than
 * `react-multi-date-picker`: that library's built-in calendar and its
 * `react-element-popper` positioning dependency render nothing under
 * React 19 in this project (verified empirically — the custom `render`
 * prop, the library's default input, and its standalone `<Calendar>`
 * export all produced zero output, with no console error). This component
 * plus a `Popover` (same primitive already used by `Autocomplete`/
 * `MultiSelect`) replaces it entirely, with full control over styling and
 * RTL behavior instead of fighting a third-party skin.
 *
 * Month navigation follows DATA-TABLE-PAGINATION's convention: "next"
 * (forward in time) points left and sits at the trailing (left) edge;
 * "previous" points right and sits at the leading (right) edge — the
 * reverse of an LTR calendar, consistent with every other RTL-flipped
 * control in this library.
 */
export function JalaliCalendar({
  viewYear,
  viewMonth,
  onViewChange,
  onSelect,
  selected,
  rangeStart,
  rangeEnd,
}: JalaliCalendarProps) {
  const daysInMonth = jalaaliMonthLength(viewYear, viewMonth);
  const firstWeekdayIndex = getFirstWeekdayIndex(viewYear, viewMonth);

  function goToPreviousMonth() {
    if (viewMonth === 1) onViewChange(viewYear - 1, 12);
    else onViewChange(viewYear, viewMonth - 1);
  }

  function goToNextMonth() {
    if (viewMonth === 12) onViewChange(viewYear + 1, 1);
    else onViewChange(viewYear, viewMonth + 1);
  }

  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekdayIndex }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <div className="w-72 p-3">
      <div className="flex items-center justify-between pb-2">
        <button
          type="button"
          onClick={goToPreviousMonth}
          aria-label="ماه قبل"
          className="flex size-8 items-center justify-center rounded-small text-foreground-secondary hover:bg-hover"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
        <span className="text-body font-medium text-foreground">
          {MONTH_NAMES[viewMonth - 1]} {toPersianDigits(viewYear)}
        </span>
        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="ماه بعد"
          className="flex size-8 items-center justify-center rounded-small text-foreground-secondary hover:bg-hover"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 pb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="flex h-8 items-center justify-center text-body-small text-muted-foreground">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} />;

          const { gy, gm, gd } = toGregorian(viewYear, viewMonth, day);
          const cellDate = new Date(gy, gm - 1, gd);
          const isEndpoint = isSameDay(cellDate, selected) || isSameDay(cellDate, rangeStart) || isSameDay(cellDate, rangeEnd);
          const inRange = Boolean(rangeStart && rangeEnd && cellDate > rangeStart && cellDate < rangeEnd);

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(cellDate)}
              className={cn(
                "flex h-9 items-center justify-center rounded-small text-body-small text-foreground hover:bg-hover",
                isEndpoint && "bg-primary text-primary-foreground hover:bg-primary-hover",
                inRange && !isEndpoint && "bg-primary-light hover:bg-primary-light",
              )}
            >
              {toPersianDigits(day)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
