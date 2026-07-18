import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logAuthEvent } from "@/lib/auth/audit-log";
import type { UserStatus } from "@/lib/enums";

export type ServiceResult<T = void> = { success: true; data: T } | { success: false; error: string };

interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
}

/** Self-service password change — verifies `currentPassword` before writing the new hash. */
export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  context: RequestContext,
): Promise<ServiceResult> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) {
    return { success: false, error: "کاربر یافت نشد" };
  }

  const currentMatches = await verifyPassword(currentPassword, user.passwordHash);
  if (!currentMatches) {
    return { success: false, error: "رمز عبور فعلی صحیح نیست" };
  }

  const newHash = await hashPassword(newPassword);
  await db.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

  await logAuthEvent({
    eventType: "password_changed",
    userId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { success: true, data: undefined };
}

/**
 * Administrator-initiated reset on another user's account. `performedById`
 * is always set here (unlike `changeOwnPassword`) — this is what
 * distinguishes a self-service change from an admin action in the audit
 * log, per `AuthAuditLog`'s `performedById` field.
 */
export async function resetPasswordByAdmin(
  targetUserId: string,
  newPassword: string,
  performedById: string,
  context: RequestContext,
): Promise<ServiceResult> {
  const targetUser = await db.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser || targetUser.deletedAt) {
    return { success: false, error: "کاربر یافت نشد" };
  }

  const newHash = await hashPassword(newPassword);
  await db.user.update({ where: { id: targetUserId }, data: { passwordHash: newHash } });

  await logAuthEvent({
    eventType: "password_reset_by_admin",
    userId: targetUserId,
    performedById,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { success: true, data: undefined };
}

export interface CurrentUserProfile {
  id: string;
  fullName: string;
  username: string;
  /** Role slug (e.g. `"administrator"`) — see `lib/auth/roles.ts` for the Persian label lookup. */
  roleSlug: string;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
}

/** The Phase 10 "User Profile" requirement's five fields, plus id — read fresh from the DB rather than trusted from the JWT, since role/status could have changed since the token was issued. */
export async function getCurrentUserProfile(userId: string): Promise<CurrentUserProfile | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  if (!user || user.deletedAt) return null;

  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    roleSlug: user.role.name,
    status: user.status as UserStatus,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}
