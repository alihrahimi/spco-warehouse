"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NotificationSettings } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { updateNotificationSettingAction } from "@/features/settings/actions";
import { NOTIFICATION_EVENT_TYPES } from "@/features/settings/notification-event-types";

/**
 * Per-event notification routing (the internal framework's admin surface).
 * Enabling an event only controls whether it is QUEUED — no external
 * delivery exists in v1 by explicit scope, so queued events remain
 * `pending` until a sender is implemented; the history table below this
 * panel makes that state visible rather than hidden.
 */
export function NotificationSettingsPanel({ initial }: { initial: NotificationSettings[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(
    initial.map((row) => ({
      eventType: row.eventType,
      isEnabled: row.isEnabled,
      telegramChatId: row.telegramChatId ?? "",
    })),
  );
  const [savingEventType, setSavingEventType] = useState<string | null>(null);

  function labelFor(eventType: string): string {
    return NOTIFICATION_EVENT_TYPES.find((entry) => entry.eventType === eventType)?.labelFa ?? eventType;
  }

  async function handleSave(index: number) {
    const row = rows[index];
    if (!row) return;

    setSavingEventType(row.eventType);
    const result = await updateNotificationSettingAction(row);
    setSavingEventType(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("تنظیمات اعلان ذخیره شد");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row, index) => (
        <Card key={row.eventType} className="flex flex-wrap items-end gap-4">
          <div className="min-w-40">
            <p className="mb-2 text-body font-medium text-foreground">{labelFor(row.eventType)}</p>
            <Switch
              label={row.isEnabled ? "فعال" : "غیرفعال"}
              checked={row.isEnabled}
              onCheckedChange={(checked) =>
                setRows((current) => current.map((entry, i) => (i === index ? { ...entry, isEnabled: checked } : entry)))
              }
            />
          </div>
          <FormField label="شناسه چت تلگرام (اختیاری)" htmlFor={`chat-${row.eventType}`} className="min-w-64 flex-1">
            <Input
              id={`chat-${row.eventType}`}
              dir="ltr"
              value={row.telegramChatId}
              onChange={(event) =>
                setRows((current) => current.map((entry, i) => (i === index ? { ...entry, telegramChatId: event.target.value } : entry)))
              }
            />
          </FormField>
          <Button type="button" size="compact" loading={savingEventType === row.eventType} onClick={() => handleSave(index)}>
            ذخیره
          </Button>
        </Card>
      ))}
      <p className="text-body-small text-muted-foreground">
        ارسال خارجی (تلگرام/واتساپ/پیامک/ایمیل) در نسخه ۱ فعال نیست — رویدادهای فعال‌شده در صف ثبت می‌شوند و پس از راه‌اندازی
        سرویس ارسال، به‌صورت خودکار پردازش خواهند شد.
      </p>
    </div>
  );
}
