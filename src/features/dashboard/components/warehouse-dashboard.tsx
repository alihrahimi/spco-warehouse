import { ClipboardList, Plus, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { formatJalaliDateTime } from "@/lib/format/date";
import { toPersianDigits } from "@/lib/format/persian-digits";
import type { WarehouseDashboardData } from "@/features/dashboard/services";

/**
 * The Warehouse Dashboard — final-revision requirement #1: an order-entry
 * system, not a management dashboard with buttons hidden. One huge
 * primary action, an unfinished-work list, one counter for a sense of
 * progress through the shift. No reports, no settings, no catalog
 * management, nothing to read that isn't directly about getting the next
 * order placed — restaurant-waiter-on-a-tablet, per the brief's own
 * comparison.
 */
export function WarehouseDashboard({ data }: { data: WarehouseDashboardData }) {
  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Button asChild className="h-24 w-full text-h2">
          <Link href="/orders/new">
            <Plus className="size-9" />
            سفارش جدید
          </Link>
        </Button>

        <Card className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-medium bg-primary-light text-primary">
              <ClipboardList className="size-6" />
            </span>
            <p className="text-body-large font-medium text-foreground">
              {toPersianDigits(data.todayOrderCount)} سفارش امروز ثبت شده
            </p>
          </div>
          <Button asChild variant="outline" size="compact">
            <Link href="/orders">همه سفارش‌ها</Link>
          </Button>
        </Card>

        <Card className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-medium bg-secondary-light text-secondary">
              <Users className="size-6" />
            </span>
            <p className="text-body-large font-medium text-foreground">مدیریت مشتریان</p>
          </div>
          <Button asChild variant="outline" size="compact">
            <Link href="/customers">مشتریان</Link>
          </Button>
        </Card>

        <Card>
          <h2 className="mb-4 text-h4 font-semibold text-foreground">ادامه پیش‌نویس‌ها</h2>
          {data.draftOrders.length === 0 ? (
            <EmptyState icon={ClipboardList} title="پیش‌نویسی وجود ندارد" description="سفارش‌های نیمه‌کاره اینجا نمایش داده می‌شوند." />
          ) : (
            <div className="divide-y divide-divider">
              {data.draftOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/new?draft=${order.id}`}
                  className="flex items-center justify-between gap-4 py-3.5 hover:bg-hover"
                >
                  <div>
                    <p className="text-body-large font-medium text-foreground">{order.customerName}</p>
                    <p className="text-body-small text-foreground-secondary">
                      {toPersianDigits(order.itemCount)} قلم — آخرین ویرایش {formatJalaliDateTime(order.updatedAt)}
                    </p>
                  </div>
                  <Button size="compact" variant="secondary">
                    ادامه
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
