import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { AuditAction } from "@/lib/enums";

export interface LogAuditEventInput {
  entityType: string;
  entityId: string;
  action: AuditAction;
  performedById: string;
  /** Optional before/after diff — worth recording for status/payment-type transitions, skippable for a plain create. */
  changes?: Prisma.InputJsonValue;
}

/**
 * Every tracked business-data change (Phase 11: customer created/updated/
 * status changed/payment type changed; future phases reuse this for
 * products/orders) goes through this one function — mirrors
 * `lib/auth/audit-log.ts`'s pattern for authentication events, kept as a
 * separate table/function since the two audit trails have different
 * shapes and different audiences (security review vs. business history).
 *
 * Never throws: a failed audit write must not block the operation it's
 * describing.
 */
export async function logAuditEvent(input: LogAuditEventInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        performedById: input.performedById,
        changes: input.changes,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log entry", error);
  }
}
