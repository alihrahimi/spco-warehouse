"use client";

import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatToman } from "@/lib/format/currency";
import { formatJalaliDateTime } from "@/lib/format/date";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { getOrderVersionsAction } from "@/features/orders/actions";

interface SnapshotItem {
  productName: string;
  pieceName: string;
  sizeLabel: string;
  packQuantity: number;
  unitQuantity: number;
  totalUnits: number;
  totalPrice: string;
}

interface Snapshot {
  totalAmount: string;
  items: SnapshotItem[];
}

/** Admin-only review of superseded order versions — each entry is the full state the order had before that edit. Rendered only for administrators (the page gates it). */
export function VersionHistoryDialog({ orderId, currentVersion }: { orderId: string; currentVersion: number }) {
  const [open, setOpen] = useState(false);

  const { data: versions, isLoading } = useQuery({
    queryKey: ["orders", "versions", orderId],
    queryFn: async () => {
      const result = await getOrderVersionsAction(orderId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: open,
  });

  return (
    <>
      <Button type="button" variant="ghost" size="compact" onClick={() => setOpen(true)}>
        <History className="size-4" />
        تاریخچه نسخه‌ها (نسخه فعلی: {toPersianDigits(currentVersion)})
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>تاریخچه نسخه‌های سفارش</DialogTitle>
          <div className="mt-4 max-h-[65vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : !versions || versions.length === 0 ? (
              <EmptyState icon={History} title="نسخه قبلی وجود ندارد" description="این سفارش پس از صدور پیش‌فاکتور ویرایش نشده است." />
            ) : (
              <div className="flex flex-col gap-3">
                {versions.map((version) => {
                  const snapshot = version.snapshot as Snapshot;
                  return (
                    <div key={version.id} className="rounded-large border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-body font-semibold text-foreground">نسخه {toPersianDigits(version.versionNumber)}</p>
                        <p className="text-body-small text-foreground-secondary">
                          {formatJalaliDateTime(new Date(version.createdAt))} — {version.createdByName}
                        </p>
                      </div>
                      {version.reason ? <p className="mt-1 text-body-small text-foreground-secondary">دلیل: {version.reason}</p> : null}
                      <p className="mt-2 text-body-small text-foreground">
                        {toPersianDigits(snapshot.items?.length ?? 0)} قلم — جمع {formatToman(BigInt(snapshot.totalAmount ?? "0"))}
                      </p>
                      <div className="mt-2 divide-y divide-divider border-t border-divider">
                        {(snapshot.items ?? []).map((item, index) => (
                          <p key={index} className="py-1.5 text-body-small text-foreground-secondary">
                            {item.productName} — {item.pieceName} — سایز {toPersianDigits(item.sizeLabel)}:{" "}
                            {item.packQuantity > 0 ? `${toPersianDigits(item.packQuantity)} بسته ` : ""}
                            {item.unitQuantity > 0 ? `${toPersianDigits(item.unitQuantity)} عدد ` : ""}={" "}
                            {toPersianDigits(item.totalUnits)} عدد — {formatToman(BigInt(item.totalPrice))}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
