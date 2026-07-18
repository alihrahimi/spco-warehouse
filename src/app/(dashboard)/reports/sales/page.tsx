"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge, type StatusBadgeStatus } from "@/components/shared/status-badge";
import type { DateRange } from "@/components/ui/date-range-picker";
import { formatToman } from "@/lib/format/currency";
import { formatJalaliNumeric } from "@/lib/format/date";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { getSalesReportAction } from "@/features/reports/actions";
import { ReportShell } from "@/features/reports/components/report-shell";

export default function SalesReportPage() {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "sales", range.from?.toISOString(), range.to?.toISOString()],
    queryFn: async () => {
      const result = await getSalesReportAction({ dateFrom: range.from?.toISOString(), dateTo: range.to?.toISOString() });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  return (
    <ReportShell title="گزارش فروش و سفارش‌ها" range={range} onRangeChange={setRange}>
      {isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="تعداد سفارش" value={toPersianDigits(data.orderCount)} />
            <StatCard label="مجموع عددی" value={toPersianDigits(data.totalUnits)} />
            <StatCard label="جمع فروش" value={formatToman(data.totalAmount)} />
            <StatCard label="جمع دریافتی" value={formatToman(data.paidAmount)} />
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-body">
                <thead>
                  <tr className="border-b border-border text-table-header text-foreground-secondary">
                    <th className="h-12 px-3 text-start font-medium">شماره</th>
                    <th className="h-12 px-3 text-start font-medium">مشتری</th>
                    <th className="h-12 px-3 text-start font-medium">تاریخ</th>
                    <th className="h-12 px-3 text-start font-medium">وضعیت</th>
                    <th className="h-12 px-3 text-start font-medium">تعداد</th>
                    <th className="h-12 px-3 text-start font-medium">مبلغ</th>
                    <th className="h-12 px-3 text-start font-medium">دریافتی</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.orderId} className="h-12 border-b border-divider last:border-0">
                      <td className="px-3">
                        <Link href={`/orders/${row.orderId}`} dir="ltr" className="text-primary hover:underline print:text-foreground">
                          {row.orderNumber}
                        </Link>
                      </td>
                      <td className="px-3 text-foreground">{row.customerName}</td>
                      <td className="px-3 text-foreground">{formatJalaliNumeric(new Date(row.createdAt))}</td>
                      <td className="px-3">
                        <StatusBadge status={row.status as StatusBadgeStatus} />
                      </td>
                      <td className="px-3 text-foreground">{toPersianDigits(row.totalUnits)}</td>
                      <td className="px-3 font-medium text-foreground">{formatToman(row.totalAmount)}</td>
                      <td className="px-3 text-foreground-secondary">{formatToman(row.paidAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </ReportShell>
  );
}
