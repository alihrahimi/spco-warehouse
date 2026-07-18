"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { extractIpAddress, extractUserAgent } from "@/lib/auth/request-info";
import { requirePermission, requireSession } from "@/lib/auth/session";
import {
  adminResetPasswordSchema,
  changePasswordSchema,
  type AdminResetPasswordInput,
  type ChangePasswordInput,
} from "@/features/auth/schemas/change-password.schema";
import { changeOwnPassword, resetPasswordByAdmin } from "@/features/auth/services";

export type ActionResult = { success: true } | { success: false; error: string; fieldErrors?: Record<string, string> };

async function getRequestContext() {
  const headerList = await headers();
  return {
    ipAddress: extractIpAddress(headerList),
    userAgent: extractUserAgent(headerList),
  };
}

export async function changePasswordAction(input: ChangePasswordInput): Promise<ActionResult> {
  const session = await requireSession();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { success: false, error: "اطلاعات وارد شده معتبر نیست", fieldErrors };
  }

  const context = await getRequestContext();
  const result = await changeOwnPassword(session.user.id, parsed.data.currentPassword, parsed.data.newPassword, context);

  if (!result.success) {
    return { success: false, error: result.error, fieldErrors: { currentPassword: result.error } };
  }

  return { success: true };
}

/**
 * Admin-only. The permission check happens here, inside the Server
 * Action — not just in middleware — because a Server Action can be
 * invoked directly and isn't a page navigation middleware would intercept.
 * No page calls this yet (User Management is a later phase); it exists so
 * that phase has real, already-audited logic to call into rather than
 * needing to design the reset flow itself.
 */
export async function resetPasswordByAdminAction(input: AdminResetPasswordInput): Promise<ActionResult> {
  const session = await requirePermission("users:manage");

  const parsed = adminResetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "اطلاعات وارد شده معتبر نیست" };
  }

  const context = await getRequestContext();
  const result = await resetPasswordByAdmin(parsed.data.userId, parsed.data.newPassword, session.user.id, context);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/users");
  return { success: true };
}
