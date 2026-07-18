"use client";

import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import type { DateRange } from "@/components/ui/date-range-picker";
import { formatToman } from "@/lib/format/currency";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { getTopCustomersReportAction } from "@/features/reports/actions";
import { ReportShell } from "@/features/reports/components/report-shell";

export default function TopCustomersReportPage() {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "top-customers", range.from?.toISOString(), range.to?.toISOString()],
    queryFn: async () => {
      const result = await getTopCustomersReportAction({ dateFrom: range.from?.toISOString(), dateTo: range.to?.toISOString() });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  return (
    <ReportShell title="مشتریان برتر" range={range} onRangeChange={setRange}>
      {isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : data.length === 0 ? (
        <EmptyState icon={Users} title="داده‌ای در این بازه نیست" description="بازه تاریخ را تغییر دهید." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-body">
              <thead>
                <tr className="border-b border-border text-table-header text-foreground-secondary">
                  <th className="h-12 px-3 text-start font-medium">رتبه</th>
                  <th className="h-12 px-3 text-start font-medium">مشتری</th>
                  <th className="h-12 px-3 text-start font-medium">تعداد سفارش</th>
                  <th className="h-12 px-3 text-start font-medium">مجموع عددی</th>
                  <th className="h-12 px-3 text-start font-medium">مجموع خرید</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={row.customerId} className="h-12 border-b border-divider last:border-0">
                    <td className="px-3 text-foreground">{toPersianDigits(index + 1)}</td>
                    <td className="px-3">
                      <Link href={`/customers/${row.customerId}`} className="font-medium text-primary hover:underline print:text-foreground">
                        {row.customerName}
                      </Link>
                      <span dir="ltr" className="ms-2 text-caption text-muted-foreground">
                        {row.customerCode}
                      </span>
                    </td>
                    <td className="px-3 text-foreground">{toPersianDigits(row.orderCount)}</td>
                    <td className="px-3 text-foreground">{toPersianDigits(row.totalUnits)}</td>
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
