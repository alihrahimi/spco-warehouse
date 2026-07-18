-- CreateTable
CREATE TABLE "invoice_documents" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "company_name_snapshot" VARCHAR(150) NOT NULL,
    "company_logo_snapshot" VARCHAR(255),
    "phone_numbers_snapshot" JSONB NOT NULL,
    "whatsapp_snapshot" VARCHAR(20),
    "telegram_snapshot" VARCHAR(100),
    "instagram_snapshot" VARCHAR(100),
    "footer_text_snapshot" TEXT,
    "pdf_file_path" VARCHAR(255) NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL,
    "generated_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invoice_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoice_documents_order_id_key" ON "invoice_documents"("order_id");

-- AddForeignKey
ALTER TABLE "invoice_documents" ADD CONSTRAINT "invoice_documents_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_documents" ADD CONSTRAINT "invoice_documents_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
