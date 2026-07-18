"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input, NumberInput } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { updateSystemSettingsAction } from "@/features/settings/actions";
import type { SystemSettingsView } from "@/features/settings/services";

/**
 * System settings (Phase 14): the shared order/invoice numbering prefix
 * (one number system since Phase 13), invoice footer note + logo toggle,
 * and the app-level defaults (pack size for new product sizes, currency
 * display label) stored in `application_settings`.
 */
export function SystemSettingsForm({ initial }: { initial: SystemSettingsView }) {
  const router = useRouter();
  const [numberPrefix, setNumberPrefix] = useState(initial.numberPrefix);
  const [invoiceFooterNote, setInvoiceFooterNote] = useState(initial.invoiceFooterNote);
  const [showLogoOnInvoice, setShowLogoOnInvoice] = useState(initial.showLogoOnInvoice);
  const [defaultPackSize, setDefaultPackSize] = useState<number | "">(initial.defaultPackSize);
  const [currencyLabel, setCurrencyLabel] = useState(initial.currencyLabel);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    setFieldErrors({});
    if (defaultPackSize === "") {
      setFieldErrors({ defaultPackSize: "سایز بسته را وارد کنید" });
      return;
    }

    setIsSubmitting(true);
    const result = await updateSystemSettingsAction({
      numberPrefix,
      invoiceFooterNote,
      showLogoOnInvoice,
      defaultPackSize,
      currencyLabel,
    });
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      toast.error(result.error);
      return;
    }
    toast.success("تنظیمات سیستم ذخیره شد");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <h2 className="text-h4 font-semibold text-foreground">شماره‌گذاری اسناد</h2>
        <p className="text-body-small text-foreground-secondary">
          شماره سفارش و پیش‌فاکتور یکسان است و سالانه از نو شروع می‌شود (مثال: {numberPrefix ? `${numberPrefix}-1405-000001` : "1405-000001"}).
          تغییر پیشوند فقط روی شماره‌های بعدی اعمال می‌شود.
        </p>
        <FormField label="پیشوند شماره (اختیاری — خالی یعنی بدون پیشوند)" htmlFor="numberPrefix" error={fieldErrors.numberPrefix}>
          <Input id="numberPrefix" dir="ltr" value={numberPrefix} invalid={Boolean(fieldErrors.numberPrefix)} onChange={(e) => setNumberPrefix(e.target.value)} className="max-w-48" />
        </FormField>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-h4 font-semibold text-foreground">چاپ پیش‌فاکتور</h2>
        <FormField label="یادداشت فوتر پیش‌فاکتور (اختیاری)" htmlFor="invoiceFooterNote">
          <Input id="invoiceFooterNote" value={invoiceFooterNote} onChange={(e) => setInvoiceFooterNote(e.target.value)} />
        </FormField>
        <Switch label="نمایش لوگو روی پیش‌فاکتور" checked={showLogoOnInvoice} onCheckedChange={setShowLogoOnInvoice} />
      </Card>

      <Card className="grid gap-4 sm:grid-cols-2">
        <FormField label="سایز بسته پیش‌فرض برای سایزهای جدید" htmlFor="defaultPackSize" error={fieldErrors.defaultPackSize}>
          <NumberInput id="defaultPackSize" value={defaultPackSize} onChange={setDefaultPackSize} min={1} />
        </FormField>
        <FormField label="واحد پول نمایشی" htmlFor="currencyLabel" error={fieldErrors.currencyLabel}>
          <Input id="currencyLabel" value={currencyLabel} invalid={Boolean(fieldErrors.currencyLabel)} onChange={(e) => setCurrencyLabel(e.target.value)} />
        </FormField>
      </Card>

      <Button type="button" loading={isSubmitting} onClick={handleSave} className="self-start">
        ذخیره تنظیمات
      </Button>
    </div>
  );
}
