"use client";

import { Printer } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PageContainer } from "@/components/shared/page-container";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { formatJalaliNumeric } from "@/lib/format/date";

/**
 * Shared frame for every report page: title, optional Jalali date-range
 * filter, and print. "PDF Export" for reports = the browser's native
 * print-to-PDF from this same print view — one rendering path, and the
 * app chrome is already `print:hidden` at the layout level. (The invoice's
 * server-side Playwright pipeline stays reserved for the customer-facing
 * pre-invoice document, where pixel-perfect A4 output is a hard
 * requirement; internal reports don't justify a second server rendering
 * path.)
 */
export function ReportShell({
  title,
  range,
  onRangeChange,
  children,
}: {
  title: string;
  range?: DateRange;
  onRangeChange?: (range: DateRange) => void;
  children: ReactNode;
}) {
  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <div className="print:hidden">
          <Breadcrumb items={[{ label: "گزارش‌ها", href: "/reports" }, { label: title }]} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-h2 font-semibold text-foreground">{title}</h1>
            {range && (range.from || range.to) ? (
              <p className="mt-1 text-body-small text-foreground-secondary">
                بازه: {range.from ? formatJalaliNumeric(range.from) : "ابتدا"} تا {range.to ? formatJalaliNumeric(range.to) : "امروز"}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3 print:hidden">
            {range && onRangeChange ? (
              <div className="min-w-64">
                <DateRangePicker value={range} onChange={onRangeChange} />
              </div>
            ) : null}
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" />
              چاپ / PDF
            </Button>
          </div>
        </div>

        {children}
      </div>
    </PageContainer>
  );
}
