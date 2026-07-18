import { getServerSession, type Session } from "next-auth";

import { authOptions } from "@/lib/auth/auth-options";
import { hasPermission, type Permission } from "@/lib/auth/permissions";

/** Server Components/Actions/Route Handlers all read the session through this — never `getServerSession(authOptions)` directly, so the config import stays in one place. */
export function getCurrentSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * Throws if there is no session. Use in a Server Action/Route Handler as
 * the first line — middleware already blocks unauthenticated *page*
 * requests, but Server Actions can be invoked directly and need their own
 * check (defense in depth, not redundant).
 */
export async function requireSession(): Promise<Session> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

/** Throws if there is no session, or the session's role lacks `permission`. */
export async function requirePermission(permission: Permission): Promise<Session> {
  const session = await requireSession();
  if (!hasPermission(session.user.role, permission)) {
    throw new Error("PERMISSION_DENIED");
  }
  return session;
}
