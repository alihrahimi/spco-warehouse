"use client";

import { useQuery } from "@tanstack/react-query";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { History } from "lucide-react";
import { formatToman } from "@/lib/format/currency";
import { formatJalaliDateTime } from "@/lib/format/date";
import { getPriceHistoryAction } from "@/features/products/actions";

export interface PriceHistoryDialogProps {
  productPieceSizeId: string;
  sizeLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PriceHistoryDialog({ productPieceSizeId, sizeLabel, open, onOpenChange }: PriceHistoryDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["products", "price-history", productPieceSizeId],
    queryFn: async () => {
      const result = await getPriceHistoryAction(productPieceSizeId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>تاریخچه قیمت — سایز {sizeLabel}</DialogTitle>
        <div className="mt-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <EmptyState icon={History} title="تغییری ثبت نشده" description="هنوز قیمت این سایز تغییر نکرده است." />
          ) : (
            <table className="w-full border-collapse text-body">
              <thead>
                <tr className="border-b border-border text-table-header text-foreground-secondary">
                  <th className="h-10 px-2 text-start font-medium">تاریخ</th>
                  <th className="h-10 px-2 text-start font-medium">قیمت قبلی</th>
                  <th className="h-10 px-2 text-start font-medium">قیمت جدید</th>
                  <th className="h-10 px-2 text-start font-medium">توسط</th>
                  <th className="h-10 px-2 text-start font-medium">دلیل</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry) => (
                  <tr key={entry.id} className="border-b border-divider last:border-0">
                    <td className="px-2 py-2 text-foreground">{formatJalaliDateTime(entry.createdAt)}</td>
                    <td className="px-2 py-2 text-foreground-secondary">{formatToman(entry.oldPrice)}</td>
                    <td className="px-2 py-2 font-medium text-foreground">{formatToman(entry.newPrice)}</td>
                    <td className="px-2 py-2 text-foreground">{entry.changedByName}</td>
                    <td className="px-2 py-2 text-foreground-secondary">{entry.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
