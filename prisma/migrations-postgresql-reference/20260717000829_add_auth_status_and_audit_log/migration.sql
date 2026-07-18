-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "auth_event_type" AS ENUM ('login_success', 'login_failed', 'logout', 'password_changed', 'password_reset_by_admin');

-- AlterTable: replace the two-state is_active boolean with a three-state
-- status enum (Phase 10 requires Active/Inactive/Suspended, which a
-- boolean cannot represent). Existing active users (is_active = true)
-- map to 'active'; anything else maps to 'inactive' — no row was ever
-- 'suspended' under the old model, so that mapping is unambiguous.
ALTER TABLE "users" ADD COLUMN "status" "user_status" NOT NULL DEFAULT 'active';
UPDATE "users" SET "status" = CASE WHEN "is_active" THEN 'active' ELSE 'inactive' END::"user_status";
ALTER TABLE "users" DROP COLUMN "is_active";

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateTable
CREATE TABLE "auth_audit_logs" (
    "id" UUID NOT NULL,
    "event_type" "auth_event_type" NOT NULL,
    "user_id" UUID,
    "attempted_username" VARCHAR(50),
    "performed_by" UUID,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_audit_logs_user_id_idx" ON "auth_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "auth_audit_logs_event_type_idx" ON "auth_audit_logs"("event_type");

-- CreateIndex
CREATE INDEX "auth_audit_logs_created_at_idx" ON "auth_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
