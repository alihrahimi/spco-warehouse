import { db } from "@/lib/db";
import type { AuthEventType } from "@/lib/enums";

export interface LogAuthEventInput {
  eventType: AuthEventType;
  /** The affected account, when known (null for a failed login against a nonexistent username). */
  userId?: string | null;
  /** The raw username typed at login, captured even when it matches no real user. */
  attemptedUsername?: string | null;
  /** Set only when the actor differs from the affected account (an admin resetting someone else's password). */
  performedById?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Every authentication event required by Phase 10 (login success/failure,
 * logout, password change, admin password reset) is written through this
 * one function, so the audit trail's shape can't drift between call sites.
 * Never throws: an audit-log write failing must not block the auth flow
 * it's describing — the error is logged server-side instead.
 */
export async function logAuthEvent(input: LogAuthEventInput): Promise<void> {
  try {
    await db.authAuditLog.create({
      data: {
        eventType: input.eventType,
        userId: input.userId ?? null,
        attemptedUsername: input.attemptedUsername ?? null,
        performedById: input.performedById ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to write auth audit log entry", error);
  }
}
