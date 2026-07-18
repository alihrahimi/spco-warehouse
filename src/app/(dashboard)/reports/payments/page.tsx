"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import type { DateRange } from "@/components/ui/date-range-picker";
import { formatToman } from "@/lib/format/currency";
import { formatJalaliDateTime, formatJalaliNumeric } from "@/lib/format/date";
import { getPaymentsReportAction } from "@/features/reports/actions";
import { ReportShell } from "@/features/reports/components/report-shell";

const METHOD_LABELS: Record<string, string> = { cash: "نقدی", cheque: "چک" };

export default function PaymentsReportPage() {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "payments", range.from?.toISOString(), range.to?.toISOString()],
    queryFn: async () => {
      const result = await getPaymentsReportAction({ dateFrom: range.from?.toISOString(), dateTo: range.to?.toISOString() });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  return (
    <ReportShell title="گزارش پرداخت‌ها" range={range} onRangeChange={setRange}>
      {isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : data.rows.length === 0 ? (
        <EmptyState icon={CreditCard} title="پرداختی در این بازه نیست" description="بازه تاریخ را تغییر دهید." />
      ) : (
        <Card>
          <p className="mb-4 text-body font-medium text-foreground">
            مجموع دریافتی بازه: <span className="font-bold">{formatToman(data.totalAmount)}</span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-body">
              <thead>
                <tr className="border-b border-border text-table-header text-foreground-secondary">
                  <th className="h-12 px-3 text-start font-medium">زمان</th>
                  <th className="h-12 px-3 text-start font-medium">سفارش</th>
                  <th className="h-12 px-3 text-start font-medium">مشتری</th>
                  <th className="h-12 px-3 text-start font-medium">روش</th>
                  <th className="h-12 px-3 text-start font-medium">مبلغ</th>
                  <th className="h-12 px-3 text-start font-medium">جزئیات چک</th>
                  <th className="h-12 px-3 text-start font-medium">ثبت توسط</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.paymentId} className="h-12 border-b border-divider last:border-0">
                    <td className="px-3 text-foreground">{formatJalaliDateTime(new Date(row.paidAt))}</td>
                    <td className="px-3">
                      <Link href={`/orders/${row.orderId}`} dir="ltr" className="text-primary hover:underline print:text-foreground">
                        {row.orderNumber ?? "—"}
                      </Link>
                    </td>
                    <td className="px-3 text-foreground">{row.customerName}</td>
                    <td className="px-3 text-foreground">{METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod}</td>
                    <td className="px-3 font-medium text-foreground">{formatToman(row.amount)}</td>
                    <td className="px-3 text-foreground-secondary">
                      {row.paymentMethod === "cheque" ? (
                        <>
                          <span dir="ltr">{row.chequeNumber}</span> — {row.chequeBankName}
                          {row.chequeDueDate ? ` — سررسید ${formatJalaliNumeric(new Date(row.chequeDueDate))}` : null}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 text-foreground">{row.registeredByName}</td>
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
