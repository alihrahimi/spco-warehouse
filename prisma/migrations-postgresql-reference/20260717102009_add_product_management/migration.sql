-- AlterEnum: additive only, safe under Postgres 12+ (values are not used
-- anywhere else in this same migration file/transaction).
ALTER TYPE "audit_action" ADD VALUE 'price_updated';
ALTER TYPE "audit_action" ADD VALUE 'piece_added';
ALTER TYPE "audit_action" ADD VALUE 'piece_removed';

-- Sequence backing the permanent, never-reused Product Code (P000001, ...)
-- — same pattern and same guarantee as customer_code_seq (Phase 11).
CREATE SEQUENCE "product_code_seq" START 1;

-- AlterTable: new product fields.
ALTER TABLE "products" ADD COLUMN "image_file_path" VARCHAR(255);
ALTER TABLE "products" ADD COLUMN "is_favorite" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: product_code, nullable first for deterministic backfill of
-- any pre-existing rows, matching the customer_code migration's pattern.
ALTER TABLE "products" ADD COLUMN "product_code" VARCHAR(10);

WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at") AS rn
  FROM "products"
  WHERE "product_code" IS NULL
)
UPDATE "products"
SET "product_code" = 'P' || LPAD(ordered.rn::text, 6, '0')
FROM ordered
WHERE "products"."id" = ordered."id";

SELECT setval('product_code_seq', GREATEST((SELECT COUNT(*) FROM "products"), 1), (SELECT COUNT(*) FROM "products") > 0);

ALTER TABLE "products" ALTER COLUMN "product_code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "products_product_code_key" ON "products"("product_code");

-- CreateIndex
CREATE INDEX "products_is_favorite_idx" ON "products"("is_favorite");

-- CreateIndex
CREATE INDEX "products_updated_at_idx" ON "products"("updated_at");

-- AlterTable: piece ordering, defaults existing rows to 0 (their relative
-- order among pieces of the same product is then whatever the UI's
-- reorder action first sets it to — no pre-existing rows in practice, per
-- the same reasoning as every prior code+backfill migration in this
-- project).
ALTER TABLE "product_pieces" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "price_history" (
    "id" UUID NOT NULL,
    "product_piece_size_id" UUID NOT NULL,
    "old_price" BIGINT NOT NULL,
    "new_price" BIGINT NOT NULL,
    "reason" TEXT,
    "changed_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_history_product_piece_size_id_idx" ON "price_history"("product_piece_size_id");

-- CreateIndex
CREATE INDEX "price_history_created_at_idx" ON "price_history"("created_at");

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_piece_size_id_fkey" FOREIGN KEY ("product_piece_size_id") REFERENCES "product_piece_sizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
