import { Package, Pencil, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { StatCard } from "@/components/shared/stat-card";
import { CustomerStatusBadge } from "@/components/shared/customer-status-badge";
import { StatusBadge, type StatusBadgeStatus } from "@/components/shared/status-badge";
import { formatToman } from "@/lib/format/currency";
import { formatJalaliNumeric } from "@/lib/format/date";
import { toPersianDigits } from "@/lib/format/persian-digits";
import {
  getCustomerById,
  getCustomerOrderHistory,
  getCustomerPaymentSummary,
} from "@/features/customers/services";
import { CustomerStatusMenu } from "@/features/customers/components/customer-status-menu";
import { FavoriteToggleButton } from "@/features/customers/components/favorite-toggle-button";
import type { CustomerStatus } from "@/lib/enums";

interface CustomerDetailsPageProps {
  params: Promise<{ customerId: string }>;
}

const PAYMENT_TYPE_LABELS_FA: Record<string, string> = {
  cash: "نقدی",
  cheque: "چک",
};

// Order.status values map 1:1 onto StatusBadge's vocabulary already (both
// were defined against the same Design System table), so no translation
// map is needed here the way Customer/User status badges each needed
// their own component.
function toOrderStatusBadgeStatus(status: string): StatusBadgeStatus {
  return status as StatusBadgeStatus;
}

export default async function CustomerDetailsPage({ params }: CustomerDetailsPageProps) {
  const { customerId } = await params;
  const customer = await getCustomerById(customerId);
  if (!customer) notFound();

  const [orderHistory, paymentSummary] = await Promise.all([
    getCustomerOrderHistory(customerId),
    getCustomerPaymentSummary(customerId),
  ]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Breadcrumb items={[{ label: "مشتریان", href: "/customers" }, { label: customer.name }]} />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-h2 font-semibold text-foreground">{customer.name}</h1>
              <CustomerStatusBadge status={customer.status as CustomerStatus} />
            </div>
            <p dir="ltr" className="mt-1 text-body-small text-muted-foreground">
              {customer.customerCode}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <FavoriteToggleButton customerId={customer.id} isFavorite={customer.isFavorite} />
            <CustomerStatusMenu customerId={customer.id} currentStatus={customer.status as CustomerStatus} />
            <Button asChild variant="outline">
              <Link href={`/customers/${customer.id}/edit`}>
                <Pencil className="size-4" />
                ویرایش
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="مانده حساب" value={formatToman(paymentSummary.outstandingBalance)} icon={Wallet} />
          <StatCard label="سفارش‌های باز" value={toPersianDigits(paymentSummary.openOrders)} icon={Package} />
          <StatCard label="مجموع سفارش‌ها" value={toPersianDigits(paymentSummary.totalOrders)} icon={Package} />
        </div>

        <Card>
          <h2 className="mb-4 text-h4 font-semibold text-foreground">اطلاعات مشتری</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-body-small text-foreground-secondary">شماره موبایل</p>
              <p dir="ltr" className="text-body-large font-medium text-foreground">
                {toPersianDigits(customer.mobile)}
              </p>
            </div>
            <div>
              <p className="text-body-small text-foreground-secondary">تلفن ثابت</p>
              <p dir="ltr" className="text-body-large font-medium text-foreground">
                {customer.phone ? toPersianDigits(customer.phone) : "—"}
              </p>
            </div>
            <div>
              <p className="text-body-small text-foreground-secondary">نوع پرداخت پیش‌فرض</p>
              <p className="text-body-large font-medium text-foreground">
                {PAYMENT_TYPE_LABELS_FA[customer.defaultPaymentType] ?? customer.defaultPaymentType}
              </p>
            </div>
            <div>
              <p className="text-body-small text-foreground-secondary">استان و شهر</p>
              <p className="text-body-large font-medium text-foreground">
                {[customer.province, customer.city].filter(Boolean).join(" / ") || "—"}
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <p className="text-body-small text-foreground-secondary">آدرس</p>
              <p className="text-body-large font-medium text-foreground">{customer.address || "—"}</p>
            </div>
            <div>
              <p className="text-body-small text-foreground-secondary">تاریخ ثبت</p>
              <p className="text-body-large font-medium text-foreground">{formatJalaliNumeric(customer.createdAt)}</p>
            </div>
            <div>
              <p className="text-body-small text-foreground-secondary">آخرین بروزرسانی</p>
              <p className="text-body-large font-medium text-foreground">{formatJalaliNumeric(customer.updatedAt)}</p>
            </div>
          </div>

          {customer.notes ? (
            <div className="mt-4 border-t border-divider pt-4">
              <p className="text-body-small text-foreground-secondary">یادداشت داخلی — این متن هرگز روی فاکتور چاپ نمی‌شود</p>
              <p className="mt-1 text-body text-foreground">{customer.notes}</p>
            </div>
          ) : null}
        </Card>

        <Card>
          <h2 className="mb-4 text-h4 font-semibold text-foreground">سوابق سفارش</h2>
          {orderHistory.length === 0 ? (
            <EmptyState icon={Package} title="هنوز سفارشی ثبت نشده" description="سفارش‌های این مشتری اینجا نمایش داده می‌شوند." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-body">
                <thead>
                  <tr className="border-b border-border text-table-header text-foreground-secondary">
                    <th className="h-12 px-3 text-start font-medium">شماره سفارش</th>
                    <th className="h-12 px-3 text-start font-medium">تاریخ</th>
                    <th className="h-12 px-3 text-start font-medium">وضعیت</th>
                    <th className="h-12 px-3 text-start font-medium">مبلغ کل</th>
                    <th className="h-12 px-3 text-start font-medium">پرداخت‌شده</th>
                    <th className="h-12 px-3 text-start font-medium">مانده</th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.map((order) => (
                    <tr key={order.id} className="h-14 border-b border-divider last:border-0">
                      <td dir="ltr" className="px-3 text-foreground">
                        {order.orderNumber ?? "— پیش‌نویس —"}
                      </td>
                      <td className="px-3 text-foreground">{formatJalaliNumeric(order.createdAt)}</td>
                      <td className="px-3">
                        <StatusBadge status={toOrderStatusBadgeStatus(order.status)} />
                      </td>
                      <td className="px-3 text-foreground">{formatToman(order.totalAmount)}</td>
                      <td className="px-3 text-foreground">{formatToman(order.paidAmount)}</td>
                      <td className="px-3 font-medium text-warning">{formatToman(order.totalAmount - order.paidAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
