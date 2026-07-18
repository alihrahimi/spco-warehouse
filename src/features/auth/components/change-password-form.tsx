"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField, PasswordInput } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { changePasswordAction } from "@/features/auth/actions";
import { changePasswordSchema, type ChangePasswordInput } from "@/features/auth/schemas/change-password.schema";

export function ChangePasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(values: ChangePasswordInput) {
    setIsSubmitting(true);
    const result = await changePasswordAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof ChangePasswordInput, { message });
        }
      }
      toast.error(result.error);
      return;
    }

    toast.success("رمز عبور با موفقیت تغییر کرد");
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-w-md flex-col gap-4">
      <FormField label="رمز عبور فعلی" htmlFor="currentPassword" error={errors.currentPassword?.message}>
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          invalid={Boolean(errors.currentPassword)}
          {...register("currentPassword")}
        />
      </FormField>
      <FormField label="رمز عبور جدید" htmlFor="newPassword" error={errors.newPassword?.message}>
        <PasswordInput id="newPassword" autoComplete="new-password" invalid={Boolean(errors.newPassword)} {...register("newPassword")} />
      </FormField>
      <FormField label="تکرار رمز عبور جدید" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          invalid={Boolean(errors.confirmPassword)}
          {...register("confirmPassword")}
        />
      </FormField>
      <Button type="submit" loading={isSubmitting} className="mt-2 self-start">
        تغییر رمز عبور
      </Button>
    </form>
  );
}
