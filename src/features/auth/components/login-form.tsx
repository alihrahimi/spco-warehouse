"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, Input, PasswordInput } from "@/components/ui/input";
import { AUTH_ERROR_CODES, type LoginSurface } from "@/lib/auth/error-codes";
import { loginSchema, type LoginInput } from "@/features/auth/schemas/login.schema";

/**
 * Maps the short codes `authorize()` throws (see auth-options.ts's comment
 * on why they're codes, not sentences) to the exact Persian error copy
 * Phase 10 requires: Invalid username, Invalid password, Suspended
 * account, Inactive account, plus the final-revision addition of a
 * wrong-login-surface message.
 */
const ERROR_MESSAGES: Record<string, string> = {
  [AUTH_ERROR_CODES.INVALID_USERNAME]: "نام کاربری یا رمز عبور اشتباه است.",
  [AUTH_ERROR_CODES.INVALID_PASSWORD]: "نام کاربری یا رمز عبور اشتباه است.",
  [AUTH_ERROR_CODES.ACCOUNT_INACTIVE]: "حساب کاربری شما غیرفعال شده است. با مدیر سیستم تماس بگیرید.",
  [AUTH_ERROR_CODES.ACCOUNT_SUSPENDED]: "حساب کاربری شما معلق شده است. با مدیر سیستم تماس بگیرید.",
  [AUTH_ERROR_CODES.WRONG_LOGIN_SURFACE]: "این حساب کاربری اجازه ورود از این صفحه را ندارد.",
};

const DEFAULT_ERROR_MESSAGE = "ورود ناموفق بود. دوباره تلاش کنید.";

/**
 * Shared by both `/login/admin` and `/login/warehouse` — `surface` is
 * never user-entered, it's fixed per page and sent alongside the
 * credentials so `authorize()` can reject an account that doesn't belong
 * on that login surface (the final-revision "two completely separate
 * applications" requirement).
 */
export function LoginForm({ surface }: { surface: LoginSurface }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      username: values.username,
      password: values.password,
      surface,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setFormError(ERROR_MESSAGES[result.error] ?? DEFAULT_ERROR_MESSAGE);
      return;
    }

    // `callbackUrl` comes from a query param (set by `proxy.ts`'s redirect
    // to `/login`, then forwarded by the chooser page), so it can't be a
    // statically-known literal `typedRoutes` could validate — same cast
    // pattern as `Breadcrumb`/`SidebarItem`.
    const callbackUrl = searchParams.get("callbackUrl") ?? "/";
    router.push(callbackUrl as Route);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex w-full flex-col gap-4">
      {formError ? <Alert variant="danger" title={formError} /> : null}

      <FormField label="نام کاربری" htmlFor="username" error={errors.username?.message}>
        <Input id="username" autoFocus autoComplete="username" invalid={Boolean(errors.username)} {...register("username")} />
      </FormField>

      <FormField label="رمز عبور" htmlFor="password" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" invalid={Boolean(errors.password)} {...register("password")} />
      </FormField>

      <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
        ورود
      </Button>
    </form>
  );
}
