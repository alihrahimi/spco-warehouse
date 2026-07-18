"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { customerSchema, type CustomerInput } from "@/features/customers/schemas/customer.schema";

export interface CustomerFormProps {
  defaultValues?: Partial<CustomerInput>;
  onSubmit: (values: CustomerInput) => Promise<{ success: boolean; error?: string; fieldErrors?: Record<string, string> }>;
  onCancel?: () => void;
  submitLabel?: string;
}

const PAYMENT_TYPE_OPTIONS = [
  { value: "cash", label: "نقدی" },
  { value: "cheque", label: "چک" },
];

/**
 * Shared by the full Create/Edit pages and the Quick Create overlay
 * (UX-FLOW.md's "customer not found → add new" path, embedded in a
 * `Dialog` — see `customer-picker.tsx`) — one form implementation, not
 * duplicated between the two contexts.
 */
export function CustomerForm({ defaultValues, onSubmit, onCancel, submitLabel = "ذخیره" }: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      mobile: defaultValues?.mobile ?? "",
      defaultPaymentType: defaultValues?.defaultPaymentType ?? "cash",
      phone: defaultValues?.phone ?? "",
      province: defaultValues?.province ?? "",
      city: defaultValues?.city ?? "",
      address: defaultValues?.address ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  // react-compiler(incompatible-library): react-hook-form's `watch()`
  // returns a value that can't be safely auto-memoized — same accepted,
  // documented limitation already noted for TanStack Table in
  // `components/table/data-table.tsx`.
  // eslint-disable-next-line react-hooks/incompatible-library
  const paymentType = watch("defaultPaymentType");

  async function handleFormSubmit(values: CustomerInput) {
    setFormError(null);
    setIsSubmitting(true);
    const result = await onSubmit(values);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof CustomerInput, { message });
        }
      }
      setFormError(result.error ?? "ذخیره‌سازی با خطا مواجه شد");
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="flex flex-col gap-4">
      {formError ? <p className="text-body-small text-danger">{formError}</p> : null}

      <FormField label="نام مشتری" htmlFor="name" required error={errors.name?.message}>
        <Input id="name" invalid={Boolean(errors.name)} placeholder="نام مشتری را وارد کنید" {...register("name")} />
      </FormField>

      <FormField label="شماره موبایل" htmlFor="mobile" required error={errors.mobile?.message}>
        <Input id="mobile" dir="ltr" invalid={Boolean(errors.mobile)} placeholder="۰۹۱۲۳۴۵۶۷۸۹" {...register("mobile")} />
      </FormField>

      <FormField label="نوع پرداخت پیش‌فرض" htmlFor="defaultPaymentType" required error={errors.defaultPaymentType?.message}>
        <RadioGroup
          value={paymentType}
          onValueChange={(value) => setValue("defaultPaymentType", value as CustomerInput["defaultPaymentType"])}
          options={PAYMENT_TYPE_OPTIONS}
        />
      </FormField>

      <FormField label="تلفن ثابت (اختیاری)" htmlFor="phone" error={errors.phone?.message}>
        <Input id="phone" dir="ltr" invalid={Boolean(errors.phone)} {...register("phone")} />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="استان (اختیاری)" htmlFor="province" error={errors.province?.message}>
          <Input id="province" invalid={Boolean(errors.province)} {...register("province")} />
        </FormField>
        <FormField label="شهر (اختیاری)" htmlFor="city" error={errors.city?.message}>
          <Input id="city" invalid={Boolean(errors.city)} {...register("city")} />
        </FormField>
      </div>

      <FormField label="آدرس (اختیاری)" htmlFor="address" error={errors.address?.message}>
        <Textarea id="address" invalid={Boolean(errors.address)} {...register("address")} />
      </FormField>

      <FormField label="یادداشت داخلی (اختیاری)" htmlFor="notes" error={errors.notes?.message}>
        <Textarea id="notes" invalid={Boolean(errors.notes)} placeholder="این یادداشت هرگز روی فاکتور چاپ نمی‌شود" {...register("notes")} />
      </FormField>

      <div className="mt-2 flex flex-row-reverse gap-3">
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            انصراف
          </Button>
        ) : null}
      </div>
    </form>
  );
}
