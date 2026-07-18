"use server";

import { revalidatePath } from "next/cache";
import type { NotificationSettings } from "@prisma/client";

import { requirePermission } from "@/lib/auth/session";
import {
  companySettingsSchema,
  notificationSettingSchema,
  systemSettingsSchema,
  type CompanySettingsInput,
  type NotificationSettingInput,
  type SystemSettingsInput,
} from "@/features/settings/schemas/settings.schema";
import {
  getNotificationSettings,
  updateCompanyLogo,
  updateCompanySettings,
  updateNotificationSetting,
  updateSystemSettings,
} from "@/features/settings/services";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

function zodFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function updateCompanySettingsAction(input: CompanySettingsInput): Promise<ActionResult> {
  await requirePermission("settings:manage");

  const parsed = companySettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "اطلاعات وارد شده معتبر نیست", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  const result = await updateCompanySettings(parsed.data);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/settings");
  return { success: true, data: undefined };
}

export async function updateCompanyLogoAction(formData: FormData): Promise<ActionResult<{ logoFilePath: string }>> {
  await requirePermission("settings:manage");

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "فایلی انتخاب نشده است" };
  }

  const result = await updateCompanyLogo(file);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/settings");
  return { success: true, data: result.data };
}

export async function updateSystemSettingsAction(input: SystemSettingsInput): Promise<ActionResult> {
  await requirePermission("settings:manage");

  const parsed = systemSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "اطلاعات وارد شده معتبر نیست", fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  const result = await updateSystemSettings(parsed.data);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/settings/system");
  return { success: true, data: undefined };
}

export async function getNotificationSettingsAction(): Promise<ActionResult<NotificationSettings[]>> {
  await requirePermission("settings:manage");
  const data = await getNotificationSettings();
  return { success: true, data };
}

export async function updateNotificationSettingAction(input: NotificationSettingInput): Promise<ActionResult> {
  await requirePermission("settings:manage");

  const parsed = notificationSettingSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "اطلاعات وارد شده معتبر نیست" };

  const result = await updateNotificationSetting(parsed.data.eventType, parsed.data.isEnabled, parsed.data.telegramChatId);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/settings/notifications");
  return { success: true, data: undefined };
}
