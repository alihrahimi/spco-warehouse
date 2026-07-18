-- CreateEnum
CREATE TYPE "phone_kind" AS ENUM ('mobile', 'telephone');

-- AlterTable: Phase 14 Company Settings additions.
ALTER TABLE "company_settings" ADD COLUMN "manager_name" VARCHAR(100);
ALTER TABLE "company_phone_numbers" ADD COLUMN "kind" "phone_kind" NOT NULL DEFAULT 'telephone';
