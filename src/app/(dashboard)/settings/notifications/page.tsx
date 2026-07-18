// Settings read live database state per request — never prerendered at build time.
export const dynamic = "force-dynamic";

import { BellOff } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { formatJalaliDateTime } from "@/lib/format/date";
import { NotificationSettingsPanel } from "@/features/settings/components/notification-settings-panel";
import { getNotificationHistory, getNotificationSettings } from "@/features/settings/services";
import { NOTIFICATION_EVENT_TYPES } from "@/features/settings/notification-event-types";
import Link from "next/link";

const CHANNEL_LABELS: Record<string, string> = {
  telegram: "تلگرام",
  whatsapp: "واتساپ",
  sms: "پیامک",
  email: "ایمیل",
};

/**
 * Notification delivery status pill — its own vocabulary, NOT `StatusBadge`
 * (order statuses): reusing that component here would print order wording
 * like "در انتظار پرداخت" for a queued notification, the same cross-domain
 * badge bug already caught for user accounts (Phase 10) and customers
 * (Phase 11).
 */
const PENDING_STYLE = { label: "در صف", className: "bg-warning-light text-warning border-warning/30" };

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  pending: PENDING_STYLE,
  sent: { label: "ارسال‌شده", className: "bg-success-light text-success border-success/30" },
  failed: { label: "ناموفق", className: "bg-danger-light text-danger border-danger/30" },
};

function NotificationStatusBadge({ status }: { status: string }) {
  const config = STATUS_STYLE[status] ?? PENDING_STYLE;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-body-small font-medium", config.className)}>
      {config.label}
    </span>
  );
}

/** SCREEN-SPECS.md §18 (Notifications History) + the per-event routing settings, on one admin page. */
export default async function NotificationSettingsPage() {
  const [settings, history] = await Promise.all([getNotificationSettings(), getNotificationHistory()]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Breadcrumb items={[{ label: "تنظیمات", href: "/settings" }, { label: "اعلان‌ها" }]} />
        <PageHeader title="اعلان‌ها" />

        <NotificationSettingsPanel initial={settings} />

        <Card>
          <h2 className="mb-4 text-h4 font-semibold text-foreground">تاریخچه اعلان‌ها</h2>
          {history.length === 0 ? (
            <EmptyState icon={BellOff} title="اعلانی ثبت نشده" description="رویدادهای اعلان اینجا نمایش داده می‌شوند." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-body">
                <thead>
                  <tr className="border-b border-border text-table-header text-foreground-secondary">
                    <th className="h-12 px-3 text-start font-medium">زمان</th>
                    <th className="h-12 px-3 text-start font-medium">رویداد</th>
                    <th className="h-12 px-3 text-start font-medium">کانال</th>
                    <th className="h-12 px-3 text-start font-medium">سفارش</th>
                    <th className="h-12 px-3 text-start font-medium">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((event) => (
                    <tr key={event.id} className="h-12 border-b border-divider last:border-0">
                      <td className="px-3 text-foreground">{formatJalaliDateTime(event.createdAt)}</td>
                      <td className="px-3 text-foreground">
                        {NOTIFICATION_EVENT_TYPES.find((entry) => entry.eventType === event.eventType)?.labelFa ?? event.eventType}
                      </td>
                      <td className="px-3 text-foreground">{CHANNEL_LABELS[event.channel] ?? event.channel}</td>
                      <td className="px-3">
                        {event.relatedOrder?.orderNumber ? (
                          <Link href={`/orders/${event.relatedOrder.id}`} dir="ltr" className="text-primary hover:underline">
                            {event.relatedOrder.orderNumber}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3">
                        <NotificationStatusBadge status={event.status} />
                      </td>
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
