"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { productSchema, type ProductInput } from "@/features/products/schemas/product.schema";
import { CategorySelect } from "@/features/products/components/category-select";

export interface ProductFormProps {
  defaultValues?: Partial<ProductInput>;
  onSubmit: (values: ProductInput) => Promise<{ success: boolean; error?: string; fieldErrors?: Record<string, string> }>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function ProductForm({ defaultValues, onSubmit, onCancel, submitLabel = "ذخیره" }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      categoryId: defaultValues?.categoryId ?? "",
      description: defaultValues?.description ?? "",
    },
  });

  // react-compiler(incompatible-library): same accepted, documented
  // limitation as CustomerForm (Phase 11) — react-hook-form's `watch()`.
  // eslint-disable-next-line react-hooks/incompatible-library
  const categoryId = watch("categoryId");

  async function handleFormSubmit(values: ProductInput) {
    setFormError(null);
    setIsSubmitting(true);
    const result = await onSubmit(values);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof ProductInput, { message });
        }
      }
      setFormError(result.error ?? "ذخیره‌سازی با خطا مواجه شد");
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="flex flex-col gap-4">
      {formError ? <p className="text-body-small text-danger">{formError}</p> : null}

      <FormField label="نام طرح" htmlFor="name" required error={errors.name?.message}>
        <Input id="name" invalid={Boolean(errors.name)} placeholder="مثال: خرس آبی" {...register("name")} />
      </FormField>

      <FormField label="دسته‌بندی" htmlFor="categoryId" required error={errors.categoryId?.message}>
        <CategorySelect value={categoryId} onChange={(value) => setValue("categoryId", value)} invalid={Boolean(errors.categoryId)} />
      </FormField>

      <FormField label="توضیحات (اختیاری)" htmlFor="description" error={errors.description?.message}>
        <Textarea id="description" invalid={Boolean(errors.description)} {...register("description")} />
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
