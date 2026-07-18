import {
  Activity,
  ClipboardList,
  CreditCard,
  Package,
  PackageCheck,
  Plus,
  Settings,
  Timer,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/page-container";
import { StatCard } from "@/components/shared/stat-card";
import { formatToman } from "@/lib/format/currency";
import { formatJalaliDateTime } from "@/lib/format/date";
import { toPersianDigits } from "@/lib/format/persian-digits";
import type { DashboardStats } from "@/features/dashboard/services";

const ACTION_LABELS: Record<string, string> = {
  created: "ایجاد",
  updated: "ویرایش",
  status_changed: "تغییر وضعیت",
  payment_type_changed: "تغییر نوع پرداخت",
  price_updated: "بروزرسانی قیمت",
  piece_added: "افزودن قطعه",
  piece_removed: "حذف قطعه",
  payment_registered: "ثبت پرداخت",
  payment_updated: "ویرایش پرداخت",
  invoice_generated: "صدور پیش‌فاکتور",
  invoice_printed: "چاپ پیش‌فاکتور",
  pdf_exported: "خروجی PDF",
};

const ENTITY_LABELS: Record<string, string> = {
  customer: "مشتری",
  product: "محصول",
  order: "سفارش",
};

/**
 * The management dashboard — full business visibility (stats, payments,
 * top products/customers, activity feed) plus quick links into every
 * management module. Final-revision requirement #1: this is a genuinely
 * different application from `WarehouseDashboard`, not a permission-
 * filtered variant of it — a warehouse worker never sees any of this.
 */
export function AdministratorDashboard({ stats, canManageSettings }: { stats: DashboardStats; canManageSettings: boolean }) {
  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        {/* Primary CTA — the largest element on the screen, per UX-FLOW.md */}
        <Button asChild className="h-20 w-full text-h3">
          <Link href="/orders/new">
            <Plus className="size-7" />
            سفارش جدید
          </Link>
        </Button>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Button asChild variant="secondary" className="h-16">
            <Link href="/orders">
              <ClipboardList className="size-5" />
              سفارش‌ها
            </Link>
          </Button>
          <Button asChild variant="secondary" className="h-16">
            <Link href="/customers">
              <Users className="size-5" />
              مشتریان
            </Link>
          </Button>
          <Button asChild variant="secondary" className="h-16">
            <Link href="/products">
              <Package className="size-5" />
              محصولات
            </Link>
          </Button>
          <Button asChild variant="secondary" className="h-16">
            <Link href="/utilities">
              <Activity className="size-5" />
              ابزارها
            </Link>
          </Button>
          {canManageSettings ? (
            <Button asChild variant="secondary" className="col-span-2 h-16 sm:col-span-4">
              <Link href="/settings">
                <Settings className="size-5" />
                تنظیمات
              </Link>
            </Button>
          ) : null}
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="سفارش‌های امروز" value={toPersianDigits(stats.todayOrders)} icon={ClipboardList} />
          <StatCard label="در حال آماده‌سازی" value={toPersianDigits(stats.preparingOrders)} icon={Timer} />
          <StatCard label="آماده ارسال" value={toPersianDigits(stats.readyOrders)} icon={PackageCheck} />
          <StatCard label="تکمیل‌شده امروز" value={toPersianDigits(stats.completedToday)} icon={PackageCheck} />
        </div>

        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-medium bg-warning-light text-warning">
              <Wallet className="size-6" />
            </span>
            <div>
              <p className="text-body font-medium text-foreground">
                {toPersianDigits(stats.pendingPayments.count)} سفارش با مانده پرداخت
              </p>
              <p className="text-body-small text-foreground-secondary">
                مجموع مانده: {formatToman(stats.pendingPayments.totalOutstanding)}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="compact">
            <Link href="/orders">مشاهده سفارش‌ها</Link>
          </Button>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-h4 font-semibold text-foreground">
              <CreditCard className="size-5 text-primary" />
              پرداخت‌های اخیر
            </h2>
            {stats.recentPayments.length === 0 ? (
              <p className="text-body-small text-muted-foreground">هنوز پرداختی ثبت نشده است.</p>
            ) : (
              <div className="divide-y divide-divider">
                {stats.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <Link href={`/orders/${payment.orderId}`} className="text-body font-medium text-primary hover:underline" dir="ltr">
                        {payment.orderNumber ?? "—"}
                      </Link>
                      <p className="text-body-small text-foreground-secondary">{payment.customerName}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-body font-medium text-foreground">{formatToman(payment.amount)}</p>
                      <p className="text-caption text-muted-foreground">{formatJalaliDateTime(payment.paidAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-h4 font-semibold text-foreground">
              <TrendingUp className="size-5 text-primary" />
              پرفروش‌ترین محصولات
            </h2>
            {stats.topProducts.length === 0 ? (
              <p className="text-body-small text-muted-foreground">با ثبت اولین سفارش‌ها، پرفروش‌ها اینجا نمایش داده می‌شوند.</p>
            ) : (
              <div className="divide-y divide-divider">
                {stats.topProducts.map((product) => (
                  <div key={product.productCode} className="flex items-center justify-between py-2.5">
                    <p className="text-body text-foreground">
                      {product.productName}
                      <span dir="ltr" className="ms-2 text-caption text-muted-foreground">
                        {product.productCode}
                      </span>
                    </p>
                    <p className="text-body-small text-foreground-secondary">
                      {toPersianDigits(product.totalUnits)} عدد — {formatToman(product.totalAmount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-h4 font-semibold text-foreground">
              <Users className="size-5 text-primary" />
              مشتریان برتر
            </h2>
            {stats.topCustomers.length === 0 ? (
              <p className="text-body-small text-muted-foreground">با ثبت اولین سفارش‌ها، مشتریان برتر اینجا نمایش داده می‌شوند.</p>
            ) : (
              <div className="divide-y divide-divider">
                {stats.topCustomers.map((customer) => (
                  <div key={customer.customerId} className="flex items-center justify-between py-2.5">
                    <Link href={`/customers/${customer.customerId}`} className="text-body font-medium text-primary hover:underline">
                      {customer.customerName}
                    </Link>
                    <p className="text-body-small text-foreground-secondary">
                      {toPersianDigits(customer.orderCount)} سفارش — {formatToman(customer.totalAmount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-h4 font-semibold text-foreground">
              <Activity className="size-5 text-primary" />
              فعالیت‌های اخیر
            </h2>
            {stats.recentActivity.length === 0 ? (
              <p className="text-body-small text-muted-foreground">فعالیت‌ها اینجا ثبت می‌شوند.</p>
            ) : (
              <div className="divide-y divide-divider">
                {stats.recentActivity.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2">
                    <p className="text-body-small text-foreground">
                      {ACTION_LABELS[entry.action] ?? entry.action} {ENTITY_LABELS[entry.entityType] ?? entry.entityType} — {entry.performedByName}
                    </p>
                    <p className="text-caption text-muted-foreground">{formatJalaliDateTime(entry.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
