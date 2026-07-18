"use client";

import { Plus, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { updateCompanyLogoAction, updateCompanySettingsAction } from "@/features/settings/actions";
import type { CompanySettingsView } from "@/features/settings/services";

interface PhoneEntry {
  phoneNumber: string;
  kind: "mobile" | "telephone";
  label: string;
}

const KIND_OPTIONS = [
  { value: "mobile", label: "موبایل" },
  { value: "telephone", label: "تلفن ثابت" },
];

/**
 * SCREEN-SPECS.md §15 realized: the three grouped sections (company info /
 * contact channels / logo) with add-remove phone rows. Saving affects only
 * future invoices — the form states this plainly so staff never fear
 * breaking old documents.
 */
export function CompanySettingsForm({ initial }: { initial: CompanySettingsView | null }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [managerName, setManagerName] = useState(initial?.managerName ?? "");
  const [phones, setPhones] = useState<PhoneEntry[]>(initial?.phoneNumbers ?? []);
  const [whatsapp, setWhatsapp] = useState(initial?.whatsappNumber ?? "");
  const [telegram, setTelegram] = useState(initial?.telegramHandle ?? "");
  const [instagram, setInstagram] = useState(initial?.instagramHandle ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [footerText, setFooterText] = useState(initial?.footerText ?? "");
  const [logo, setLogo] = useState(initial?.logoFilePath ?? null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  function updatePhone(index: number, patch: Partial<PhoneEntry>) {
    setPhones((current) => current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  async function handleSave() {
    setFieldErrors({});
    setIsSubmitting(true);
    const result = await updateCompanySettingsAction({
      companyName,
      managerName,
      phoneNumbers: phones,
      whatsappNumber: whatsapp,
      telegramHandle: telegram,
      instagramHandle: instagram,
      address,
      footerText,
    });
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      toast.error(result.error);
      return;
    }
    toast.success("تنظیمات شرکت ذخیره شد");
    router.refresh();
  }

  async function handleLogoSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("logo", file);

    setIsUploadingLogo(true);
    const result = await updateCompanyLogoAction(formData);
    setIsUploadingLogo(false);
    event.target.value = "";

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setLogo(result.data.logoFilePath);
    toast.success("لوگو بروزرسانی شد");
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-body-small text-foreground-secondary">
        تغییرات فقط روی پیش‌فاکتورهای آینده اعمال می‌شود — اسناد صادرشده قبلی بدون تغییر باقی می‌مانند.
      </p>

      <Card className="flex flex-col gap-4">
        <h2 className="text-h4 font-semibold text-foreground">اطلاعات شرکت</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="نام شرکت" htmlFor="companyName" required error={fieldErrors.companyName}>
            <Input id="companyName" value={companyName} invalid={Boolean(fieldErrors.companyName)} onChange={(e) => setCompanyName(e.target.value)} />
          </FormField>
          <FormField label="نام مدیر (اختیاری)" htmlFor="managerName">
            <Input id="managerName" value={managerName} onChange={(e) => setManagerName(e.target.value)} />
          </FormField>
        </div>
        <FormField label="آدرس (اختیاری)" htmlFor="address">
          <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </FormField>
        <FormField label="متن فوتر فاکتور (اختیاری)" htmlFor="footerText">
          <Textarea id="footerText" value={footerText} onChange={(e) => setFooterText(e.target.value)} />
        </FormField>

        <div>
          <p className="mb-2 text-body font-medium text-foreground">لوگو</p>
          <div className="flex items-center gap-4">
            <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-large border border-border bg-disabled">
              {logo ? <Image src={logo} alt="لوگوی شرکت" fill sizes="96px" className="object-contain" /> : <span className="text-caption text-muted-foreground">بدون لوگو</span>}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoSelected} />
            <Button type="button" variant="outline" size="compact" loading={isUploadingLogo} onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" />
              {logo ? "تغییر لوگو" : "بارگذاری لوگو"}
            </Button>
          </div>
          {!initial ? <p className="mt-2 text-caption text-muted-foreground">ابتدا اطلاعات شرکت را ذخیره کنید، سپس لوگو را بارگذاری کنید.</p> : null}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h4 font-semibold text-foreground">شماره‌های تماس</h2>
          <Button type="button" variant="outline" size="compact" onClick={() => setPhones((current) => [...current, { phoneNumber: "", kind: "mobile", label: "" }])}>
            <Plus className="size-4" />
            افزودن شماره
          </Button>
        </div>
        {phones.length === 0 ? (
          <p className="text-body-small text-muted-foreground">هنوز شماره‌ای ثبت نشده است.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {phones.map((phone, index) => (
              <div key={index} className="grid grid-cols-[1fr_auto] items-end gap-2 sm:grid-cols-[1fr_10rem_1fr_auto]">
                <FormField label="شماره" htmlFor={`phone-${index}`}>
                  <Input id={`phone-${index}`} dir="ltr" value={phone.phoneNumber} onChange={(e) => updatePhone(index, { phoneNumber: e.target.value })} />
                </FormField>
                <FormField label="نوع" htmlFor={`kind-${index}`}>
                  <Select id={`kind-${index}`} options={KIND_OPTIONS} value={phone.kind} onValueChange={(value) => updatePhone(index, { kind: value as PhoneEntry["kind"] })} />
                </FormField>
                <FormField label="برچسب (اختیاری)" htmlFor={`label-${index}`}>
                  <Input id={`label-${index}`} value={phone.label} placeholder="مثال: فروش" onChange={(e) => updatePhone(index, { label: e.target.value })} />
                </FormField>
                <button
                  type="button"
                  aria-label="حذف شماره"
                  onClick={() => setPhones((current) => current.filter((_, i) => i !== index))}
                  className="mb-1 flex size-11 items-center justify-center rounded-medium text-danger hover:bg-danger-light"
                >
                  <X className="size-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="grid gap-4 sm:grid-cols-3">
        <FormField label="واتساپ (اختیاری)" htmlFor="whatsapp">
          <Input id="whatsapp" dir="ltr" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </FormField>
        <FormField label="تلگرام (اختیاری)" htmlFor="telegram">
          <Input id="telegram" dir="ltr" value={telegram} onChange={(e) => setTelegram(e.target.value)} />
        </FormField>
        <FormField label="اینستاگرام (اختیاری)" htmlFor="instagram">
          <Input id="instagram" dir="ltr" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        </FormField>
      </Card>

      <Button type="button" loading={isSubmitting} onClick={handleSave} className="self-start">
        ذخیره تنظیمات
      </Button>
    </div>
  );
}
