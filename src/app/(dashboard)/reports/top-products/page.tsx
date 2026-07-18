"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import type { DateRange } from "@/components/ui/date-range-picker";
import { formatToman } from "@/lib/format/currency";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { getTopProductsReportAction } from "@/features/reports/actions";
import { ReportShell } from "@/features/reports/components/report-shell";

export default function TopProductsReportPage() {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "top-products", range.from?.toISOString(), range.to?.toISOString()],
    queryFn: async () => {
      const result = await getTopProductsReportAction({ dateFrom: range.from?.toISOString(), dateTo: range.to?.toISOString() });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  return (
    <ReportShell title="پرفروش‌ترین محصولات" range={range} onRangeChange={setRange}>
      {isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : data.length === 0 ? (
        <EmptyState icon={TrendingUp} title="داده‌ای در این بازه نیست" description="بازه تاریخ را تغییر دهید." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-body">
              <thead>
                <tr className="border-b border-border text-table-header text-foreground-secondary">
                  <th className="h-12 px-3 text-start font-medium">رتبه</th>
                  <th className="h-12 px-3 text-start font-medium">محصول</th>
                  <th className="h-12 px-3 text-start font-medium">قطعه</th>
                  <th className="h-12 px-3 text-start font-medium">بسته‌ها</th>
                  <th className="h-12 px-3 text-start font-medium">مجموع عددی</th>
                  <th className="h-12 px-3 text-start font-medium">مبلغ فروش</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={`${row.productCode}-${row.pieceName}`} className="h-12 border-b border-divider last:border-0">
                    <td className="px-3 text-foreground">{toPersianDigits(index + 1)}</td>
                    <td className="px-3 text-foreground">
                      {row.productName}
                      <span dir="ltr" className="ms-2 text-caption text-muted-foreground">
                        {row.productCode}
                      </span>
                    </td>
                    <td className="px-3 text-foreground">{row.pieceName}</td>
                    <td className="px-3 text-foreground">{toPersianDigits(row.totalPacks)}</td>
                    <td className="px-3 font-medium text-foreground">{toPersianDigits(row.totalUnits)}</td>
                    <td className="px-3 font-medium text-foreground">{formatToman(row.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </ReportShell>
  );
}
