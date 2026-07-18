"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatToman } from "@/lib/format/currency";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { getOutstandingBalancesAction } from "@/features/reports/actions";
import { ReportShell } from "@/features/reports/components/report-shell";

export default function OutstandingReportPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "outstanding"],
    queryFn: async () => {
      const result = await getOutstandingBalancesAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const totalOutstanding = (data ?? []).reduce((sum, row) => sum + row.outstanding, 0n);

  return (
    <ReportShell title="گزارش مانده حساب‌ها">
      {isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : data.length === 0 ? (
        <EmptyState icon={Wallet} title="مانده‌ای وجود ندارد" description="هیچ مشتری‌ای بدهی باز ندارد." />
      ) : (
        <Card>
          <p className="mb-4 text-body font-medium text-foreground">
            مجموع مانده کل: <span className="font-bold text-warning">{formatToman(totalOutstanding)}</span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-body">
              <thead>
                <tr className="border-b border-border text-table-header text-foreground-secondary">
                  <th className="h-12 px-3 text-start font-medium">مشتری</th>
                  <th className="h-12 px-3 text-start font-medium">موبایل</th>
                  <th className="h-12 px-3 text-start font-medium">سفارش‌ها</th>
                  <th className="h-12 px-3 text-start font-medium">جمع خرید</th>
                  <th className="h-12 px-3 text-start font-medium">پرداختی</th>
                  <th className="h-12 px-3 text-start font-medium">مانده</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.customerId} className="h-12 border-b border-divider last:border-0">
                    <td className="px-3">
                      <Link href={`/customers/${row.customerId}`} className="font-medium text-primary hover:underline print:text-foreground">
                        {row.customerName}
                      </Link>
                      <span dir="ltr" className="ms-2 text-caption text-muted-foreground">
                        {row.customerCode}
                      </span>
                    </td>
                    <td dir="ltr" className="px-3 text-foreground">
                      {toPersianDigits(row.mobile)}
                    </td>
                    <td className="px-3 text-foreground">{toPersianDigits(row.orderCount)}</td>
                    <td className="px-3 text-foreground">{formatToman(row.totalAmount)}</td>
                    <td className="px-3 text-foreground-secondary">{formatToman(row.paidAmount)}</td>
                    <td className="px-3 font-bold text-warning">{formatToman(row.outstanding)}</td>
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
