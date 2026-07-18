-- Split from add_order_management deliberately: Postgres forbids USING a
-- new enum value in the same transaction that ADDs it, and Prisma applies
-- each migration file in a single transaction — so the values land (and
-- commit) here, and the following migration's `SET DEFAULT 'draft'` etc.
-- can reference them safely.

-- AlterEnum: new order lifecycle states (additive).
ALTER TYPE "order_status" ADD VALUE 'draft' BEFORE 'pending_payment';
ALTER TYPE "order_status" ADD VALUE 'pre_invoice_generated' BEFORE 'pending_payment';

-- AlterEnum: Phase 13 audit actions (additive).
ALTER TYPE "audit_action" ADD VALUE 'payment_registered';
ALTER TYPE "audit_action" ADD VALUE 'payment_updated';
ALTER TYPE "audit_action" ADD VALUE 'invoice_generated';
ALTER TYPE "audit_action" ADD VALUE 'invoice_printed';
ALTER TYPE "audit_action" ADD VALUE 'pdf_exported';

-- AlterEnum: notification channels the architecture is ready for (additive).
ALTER TYPE "notification_channel" ADD VALUE 'whatsapp';
ALTER TYPE "notification_channel" ADD VALUE 'sms';
ALTER TYPE "notification_channel" ADD VALUE 'email';
