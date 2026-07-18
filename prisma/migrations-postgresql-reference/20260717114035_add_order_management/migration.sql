-- (Enum values referenced below were added — and committed — by the
-- preceding add_order_enums migration; see its header comment.)

-- AlterTable orders: drafts have no order number until converted, and the
-- yearly sequence must never be consumed by an abandoned draft.
ALTER TABLE "orders" ALTER COLUMN "order_number" DROP NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'draft';
ALTER TABLE "orders" ADD COLUMN "customer_notes" TEXT;
ALTER TABLE "orders" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "orders" ADD COLUMN "pre_invoice_generated_at" TIMESTAMPTZ(6);

-- AlterTable order_items: Phase 13 replaced the single mode+quantity pair
-- with simultaneous pack AND unit quantities. Backfill maps the old shape
-- losslessly (pack rows -> pack_quantity, unit rows -> unit_quantity)
-- before the old columns are dropped; total_units/total_price are already
-- correct under either representation.
ALTER TABLE "order_items" ADD COLUMN "pack_quantity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "order_items" ADD COLUMN "unit_quantity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "order_items" ADD COLUMN "product_code_snapshot" VARCHAR(10) NOT NULL DEFAULT '';

UPDATE "order_items" SET "pack_quantity" = "quantity" WHERE "order_type" = 'pack';
UPDATE "order_items" SET "unit_quantity" = "quantity" WHERE "order_type" = 'unit';
UPDATE "order_items" oi
SET "product_code_snapshot" = p."product_code"
FROM "product_piece_sizes" pps
JOIN "product_pieces" pp ON pp."id" = pps."product_piece_id"
JOIN "products" p ON p."id" = pp."product_id"
WHERE oi."product_piece_size_id" = pps."id";

ALTER TABLE "order_items" ALTER COLUMN "pack_quantity" DROP DEFAULT;
ALTER TABLE "order_items" ALTER COLUMN "unit_quantity" DROP DEFAULT;
ALTER TABLE "order_items" ALTER COLUMN "product_code_snapshot" DROP DEFAULT;
ALTER TABLE "order_items" DROP COLUMN "order_type";
ALTER TABLE "order_items" DROP COLUMN "quantity";

-- DropEnum: order_type is unreferenced once the column above is gone.
DROP TYPE "order_type";

-- CreateIndex: one row per (order, piece+size) — the schema-level guard
-- behind "prevent duplicate items".
CREATE UNIQUE INDEX "order_items_order_id_product_piece_size_id_key" ON "order_items"("order_id", "product_piece_size_id");

-- AlterTable payments: full cheque record.
ALTER TABLE "payments" ADD COLUMN "cheque_bank_name" VARCHAR(100);
ALTER TABLE "payments" ADD COLUMN "cheque_issue_date" DATE;

-- AlterTable invoice_documents: address joins the frozen company snapshot;
-- pdf_file_path becomes nullable (snapshot at generation, PDF on first export).
ALTER TABLE "invoice_documents" ADD COLUMN "address_snapshot" TEXT;
ALTER TABLE "invoice_documents" ALTER COLUMN "pdf_file_path" DROP NOT NULL;

-- CreateTable
CREATE TABLE "order_versions" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "reason" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_versions_order_id_version_number_key" ON "order_versions"("order_id", "version_number");

-- CreateIndex
CREATE INDEX "order_versions_order_id_idx" ON "order_versions"("order_id");

-- AddForeignKey
ALTER TABLE "order_versions" ADD CONSTRAINT "order_versions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_versions" ADD CONSTRAINT "order_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
