-- CreateEnum
CREATE TYPE "customer_status" AS ENUM ('active', 'inactive', 'blocked');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('created', 'updated', 'status_changed', 'payment_type_changed');

-- Sequence backing the permanent, never-reused Customer Code (C000001, ...).
-- Native Postgres sequences already guarantee "never reused" (gaps from a
-- rolled-back transaction are fine and expected; a value once issued is
-- never issued again), which is exactly Phase 11's requirement.
CREATE SEQUENCE "customer_code_seq" START 1;

-- AlterTable: new optional profile/classification fields.
ALTER TABLE "customers" ADD COLUMN "address" TEXT;
ALTER TABLE "customers" ADD COLUMN "city" VARCHAR(100);
ALTER TABLE "customers" ADD COLUMN "province" VARCHAR(100);
ALTER TABLE "customers" ADD COLUMN "phone" VARCHAR(20);
ALTER TABLE "customers" ADD COLUMN "status" "customer_status" NOT NULL DEFAULT 'active';
ALTER TABLE "customers" ADD COLUMN "is_favorite" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: customer_code, added nullable first so any pre-existing rows
-- can be backfilled deterministically before the NOT NULL constraint is
-- applied (there are none in practice yet — Customer Management is being
-- introduced in this migration — but a real migration is written to be
-- correct regardless).
ALTER TABLE "customers" ADD COLUMN "customer_code" VARCHAR(10);

WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at") AS rn
  FROM "customers"
  WHERE "customer_code" IS NULL
)
UPDATE "customers"
SET "customer_code" = 'C' || LPAD(ordered.rn::text, 6, '0')
FROM ordered
WHERE "customers"."id" = ordered."id";

-- Advance the sequence past any backfilled codes so the next real INSERT
-- via nextval() cannot collide with one just assigned above.
SELECT setval('customer_code_seq', GREATEST((SELECT COUNT(*) FROM "customers"), 1), (SELECT COUNT(*) FROM "customers") > 0);

ALTER TABLE "customers" ALTER COLUMN "customer_code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "customers_customer_code_key" ON "customers"("customer_code");

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");

-- CreateIndex
CREATE INDEX "customers_is_favorite_idx" ON "customers"("is_favorite");

-- CreateIndex
CREATE INDEX "customers_city_idx" ON "customers"("city");

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" "audit_action" NOT NULL,
    "performed_by" UUID NOT NULL,
    "changes" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_performed_by_idx" ON "audit_logs"("performed_by");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
