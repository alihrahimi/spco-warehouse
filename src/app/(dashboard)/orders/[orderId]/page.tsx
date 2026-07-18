import { CreditCard, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PageContainer } from "@/components/shared/page-container";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge, type StatusBadgeStatus } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatToman } from "@/lib/format/currency";
import { formatJalaliDateTime, formatJalaliNumeric } from "@/lib/format/date";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import type { OrderStatus } from "@/lib/enums";
import { getOrderDetails } from "@/features/orders/services";
import { OrderActions } from "@/features/orders/components/order-details/order-actions";
import { VersionHistoryDialog } from "@/features/orders/components/order-details/version-history-dialog";

interface OrderDetailsPageProps {
  params: Promise<{ orderId: string }>;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = { cash: "نقدی", cheque: "چک" };
const CASH_TYPE_LABELS: Record<string, string> = {
  deposit: "پیش‌پرداخت",
  remaining_balance: "تسویه باقیمانده",
  full_payment: "تسویه کامل",
};

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const order = await getOrderDetails(orderId);
  if (!order) notFound();

  const paidAmount = order.payments.reduce((sum, payment) => sum + payment.amount, 0n);
  const remainingAmount = order.totalAmount - paidAmount;
  const paymentStatus: StatusBadgeStatus =
    paidAmount === 0n ? "unpaid" : remainingAmount <= 0n ? "fully_settled" : "partial_payment";
  const isAdmin = hasPermission(session.user.role, "users:manage");
  const canViewPayments = hasPermission(session.user.role, "payments:view");
  const canRegisterPayment = hasPermission(session.user.role, "payments:create");
  const canEditItems = hasPermission(session.user.role, "orders:edit");
  const canDeleteDraft = hasPermission(session.user.role, "orders:delete");
  const title = order.orderNumber ?? "پیش‌نویس سفارش";

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Breadcrumb items={[{ label: "سفارش‌ها", href: "/orders" }, { label: title }]} />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-h2 font-semibold text-foreground" dir={order.orderNumber ? "ltr" : undefined}>
                {title}
              </h1>
              <StatusBadge status={order.status as StatusBadgeStatus} />
              {order.status !== "draft" && canViewPayments ? <StatusBadge status={paymentStatus} /> : null}
            </div>
            <p className="mt-1 text-body-small text-foreground-secondary">
              <Link href={`/customers/${order.customer.id}`} className="text-primary hover:underline">
                {order.customer.name}
              </Link>
              <span dir="ltr" className="ms-2 text-muted-foreground">
                {order.customer.customerCode}
              </span>
              {" · "}ثبت: {formatJalaliNumeric(order.createdAt)} توسط {order.createdBy.fullName}
              {order.preInvoiceGeneratedAt ? ` · صدور پیش‌فاکتور: ${formatJalaliNumeric(order.preInvoiceGeneratedAt)}` : null}
            </p>
          </div>
          {isAdmin && order.status !== "draft" ? <VersionHistoryDialog orderId={order.id} currentVersion={order.version} /> : null}
        </div>

        <OrderActions
          orderId={order.id}
          status={order.status as OrderStatus}
          remainingAmount={Number(remainingAmount > 0n ? remainingAmount : 0n)}
          canRegisterPayment={canRegisterPayment}
          canEditItems={canEditItems}
          canDeleteDraft={canDeleteDraft}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="مبلغ کل" value={formatToman(order.totalAmount)} icon={Wallet} />
          {canViewPayments ? (
            <>
              <StatCard label="پرداخت‌شده" value={formatToman(paidAmount)} icon={CreditCard} />
              <StatCard label="مانده" value={formatToman(remainingAmount)} icon={Wallet} />
            </>
          ) : null}
        </div>

        <Card>
          <h2 className="mb-4 text-h4 font-semibold text-foreground">اقلام سفارش</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-body">
              <thead>
                <tr className="border-b border-border text-table-header text-foreground-secondary">
                  <th className="h-12 px-3 text-start font-medium">محصول</th>
                  <th className="h-12 px-3 text-start font-medium">قطعه</th>
                  <th className="h-12 px-3 text-start font-medium">سایز</th>
                  <th className="h-12 px-3 text-start font-medium">بسته</th>
                  <th className="h-12 px-3 text-start font-medium">عددی</th>
                  <th className="h-12 px-3 text-start font-medium">جمع عدد</th>
                  <th className="h-12 px-3 text-start font-medium">قیمت واحد</th>
                  <th className="h-12 px-3 text-start font-medium">جمع</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="h-12 border-b border-divider last:border-0">
                    <td className="px-3 text-foreground">
                      {item.productNameSnapshot}
                      <span dir="ltr" className="ms-1 text-caption text-muted-foreground">
                        {item.productCodeSnapshot}
                      </span>
                    </td>
                    <td className="px-3 text-foreground">{item.pieceNameSnapshot}</td>
                    <td className="px-3 text-foreground">{toPersianDigits(item.sizeLabelSnapshot)}</td>
                    <td className="px-3 text-foreground">
                      {item.packQuantity > 0 ? `${toPersianDigits(item.packQuantity)} × ${toPersianDigits(item.packSizeSnapshot)}` : "—"}
                    </td>
                    <td className="px-3 text-foreground">{item.unitQuantity > 0 ? toPersianDigits(item.unitQuantity) : "—"}</td>
                    <td className="px-3 font-medium text-foreground">{toPersianDigits(item.totalUnits)}</td>
                    <td className="px-3 text-foreground-secondary">{formatToman(item.unitPriceSnapshot)}</td>
                    <td className="px-3 font-medium text-foreground">{formatToman(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td colSpan={7} className="px-3 py-3 text-body font-semibold text-foreground">
                    جمع کل
                  </td>
                  <td className="px-3 py-3 text-body font-bold text-foreground">{formatToman(order.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {canViewPayments ? (
        <Card>
          <h2 className="mb-4 text-h4 font-semibold text-foreground">پرداخت‌ها</h2>
          {order.payments.length === 0 ? (
            <EmptyState icon={CreditCard} title="پرداختی ثبت نشده" description="پرداخت‌های این سفارش اینجا نمایش داده می‌شوند." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-body">
                <thead>
                  <tr className="border-b border-border text-table-header text-foreground-secondary">
                    <th className="h-12 px-3 text-start font-medium">تاریخ</th>
                    <th className="h-12 px-3 text-start font-medium">روش</th>
                    <th className="h-12 px-3 text-start font-medium">مبلغ</th>
                    <th className="h-12 px-3 text-start font-medium">جزئیات چک</th>
                    <th className="h-12 px-3 text-start font-medium">ثبت توسط</th>
                    <th className="h-12 px-3 text-start font-medium">توضیحات</th>
                  </tr>
                </thead>
                <tbody>
                  {order.payments.map((payment) => (
                    <tr key={payment.id} className="h-12 border-b border-divider last:border-0">
                      <td className="px-3 text-foreground">{formatJalaliDateTime(payment.paidAt)}</td>
                      <td className="px-3 text-foreground">
                        {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                        {payment.cashPaymentType ? ` — ${CASH_TYPE_LABELS[payment.cashPaymentType]}` : null}
                      </td>
                      <td className="px-3 font-medium text-foreground">{formatToman(payment.amount)}</td>
                      <td className="px-3 text-foreground-secondary">
                        {payment.paymentMethod === "cheque" ? (
                          <>
                            <span dir="ltr">{payment.chequeNumber}</span> — {payment.chequeBankName}
                            {payment.chequeDueDate ? ` — سررسید ${formatJalaliNumeric(payment.chequeDueDate)}` : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 text-foreground">{payment.createdBy.fullName}</td>
                      <td className="px-3 text-foreground-secondary">{payment.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        ) : null}

        {(order.notes || order.customerNotes) && (
          <Card className="grid gap-4 sm:grid-cols-2">
            {order.customerNotes ? (
              <div>
                <p className="text-body-small text-foreground-secondary">یادداشت مشتری — روی پیش‌فاکتور چاپ می‌شود</p>
                <p className="mt-1 text-body text-foreground">{order.customerNotes}</p>
              </div>
            ) : null}
            {order.notes ? (
              <div>
                <p className="text-body-small text-foreground-secondary">یادداشت داخلی — هرگز چاپ نمی‌شود</p>
                <p className="mt-1 text-body text-foreground">{order.notes}</p>
              </div>
            ) : null}
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
