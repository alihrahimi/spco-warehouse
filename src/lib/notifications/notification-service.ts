import { db } from "@/lib/db";
import type { NotificationChannel } from "@/lib/enums";

/**
 * Phase 13 notification FOUNDATION — architecture only, no sending.
 *
 * How this is real rather than a placeholder: `queueNotification` writes a
 * genuine `NotificationEvent` row (the queue table from the Database
 * Phase) with status `pending`. A future phase implements senders by
 * registering one per channel in `CHANNEL_SENDERS` below and draining
 * pending rows; every call site queuing events today keeps working
 * unchanged. Until a sender exists for a channel, its events simply
 * remain `pending` in the queue — accurate, inspectable state (surfaced
 * by the Notifications History screen planned in SCREEN-SPECS.md §18),
 * not a silent no-op.
 */

export interface NotificationSender {
  send(recipient: string, messageBody: string): Promise<void>;
}

/** Populated by future phases (Telegram first, per Phase 01). Empty today by design. */
const CHANNEL_SENDERS: Partial<Record<NotificationChannel, NotificationSender>> = {};

export interface QueueNotificationInput {
  channel: NotificationChannel;
  eventType: string;
  recipient: string;
  messageBody: string;
  relatedOrderId?: string;
}

export async function queueNotification(input: QueueNotificationInput): Promise<void> {
  try {
    await db.notificationEvent.create({
      data: {
        channel: input.channel,
        eventType: input.eventType,
        recipient: input.recipient,
        messageBody: input.messageBody,
        relatedOrderId: input.relatedOrderId ?? null,
      },
    });
  } catch (error) {
    // Queuing a notification must never break the business operation that
    // triggered it — same failure philosophy as the audit loggers.
    console.error("Failed to queue notification event", error);
  }
}

export function hasSenderForChannel(channel: NotificationChannel): boolean {
  return channel in CHANNEL_SENDERS;
}
