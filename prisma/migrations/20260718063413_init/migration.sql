-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_login_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "auth_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_type" TEXT NOT NULL,
    "user_id" TEXT,
    "attempted_username" TEXT,
    "performed_by" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "auth_audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "changes" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "phone" TEXT,
    "province" TEXT,
    "city" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "default_payment_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_code" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_file_path" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_pieces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "product_pieces_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sizes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "product_piece_sizes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_piece_id" TEXT NOT NULL,
    "size_id" TEXT NOT NULL,
    "unit_price" BIGINT NOT NULL,
    "default_pack_size" INTEGER NOT NULL DEFAULT 6,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "product_piece_sizes_product_piece_id_fkey" FOREIGN KEY ("product_piece_id") REFERENCES "product_pieces" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "product_piece_sizes_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "sizes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_piece_size_id" TEXT NOT NULL,
    "old_price" BIGINT NOT NULL,
    "new_price" BIGINT NOT NULL,
    "reason" TEXT,
    "changed_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "price_history_product_piece_size_id_fkey" FOREIGN KEY ("product_piece_size_id") REFERENCES "product_piece_sizes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "price_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_number" TEXT,
    "jalali_year" INTEGER NOT NULL,
    "customer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" BIGINT NOT NULL,
    "total_amount" BIGINT NOT NULL,
    "notes" TEXT,
    "customer_notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "pre_invoice_generated_at" DATETIME,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_versions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "order_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "product_piece_size_id" TEXT NOT NULL,
    "product_name_snapshot" TEXT NOT NULL,
    "product_code_snapshot" TEXT NOT NULL,
    "piece_name_snapshot" TEXT NOT NULL,
    "size_label_snapshot" TEXT NOT NULL,
    "pack_quantity" INTEGER NOT NULL,
    "unit_quantity" INTEGER NOT NULL,
    "pack_size_snapshot" INTEGER NOT NULL,
    "total_units" INTEGER NOT NULL,
    "unit_price_snapshot" BIGINT NOT NULL,
    "total_price" BIGINT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "order_items_product_piece_size_id_fkey" FOREIGN KEY ("product_piece_size_id") REFERENCES "product_piece_sizes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "cash_payment_type" TEXT,
    "amount" BIGINT NOT NULL,
    "cheque_number" TEXT,
    "cheque_bank_name" TEXT,
    "cheque_issue_date" DATETIME,
    "cheque_due_date" DATETIME,
    "paid_at" DATETIME NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number_prefix" TEXT NOT NULL DEFAULT 'INV',
    "footer_note" TEXT,
    "show_logo_on_invoice" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "invoice_sequences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jalali_year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "code_sequences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "invoice_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "company_name_snapshot" TEXT NOT NULL,
    "company_logo_snapshot" TEXT,
    "phone_numbers_snapshot" JSONB NOT NULL,
    "whatsapp_snapshot" TEXT,
    "telegram_snapshot" TEXT,
    "instagram_snapshot" TEXT,
    "address_snapshot" TEXT,
    "footer_text_snapshot" TEXT,
    "pdf_file_path" TEXT,
    "generated_at" DATETIME NOT NULL,
    "generated_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "invoice_documents_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invoice_documents_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_name" TEXT NOT NULL,
    "manager_name" TEXT,
    "logo_file_path" TEXT,
    "whatsapp_number" TEXT,
    "telegram_handle" TEXT,
    "instagram_handle" TEXT,
    "address" TEXT,
    "footer_text" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "company_phone_numbers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_settings_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'telephone',
    "label" TEXT,
    "sort_order" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "company_phone_numbers_company_settings_id_fkey" FOREIGN KEY ("company_settings_id") REFERENCES "company_settings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "related_order_id" TEXT,
    "recipient" TEXT NOT NULL,
    "message_body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "sent_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "notification_events_related_order_id_fkey" FOREIGN KEY ("related_order_id") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_type" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "telegram_chat_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "application_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT NOT NULL,
    "value_type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "auth_audit_logs_user_id_idx" ON "auth_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "auth_audit_logs_event_type_idx" ON "auth_audit_logs"("event_type");

-- CreateIndex
CREATE INDEX "auth_audit_logs_created_at_idx" ON "auth_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_performed_by_idx" ON "audit_logs"("performed_by");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customer_code_key" ON "customers"("customer_code");

-- CreateIndex
CREATE INDEX "customers_mobile_idx" ON "customers"("mobile");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");

-- CreateIndex
CREATE INDEX "customers_is_favorite_idx" ON "customers"("is_favorite");

-- CreateIndex
CREATE INDEX "customers_city_idx" ON "customers"("city");

-- CreateIndex
CREATE UNIQUE INDEX "products_product_code_key" ON "products"("product_code");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_is_active_idx" ON "products"("is_active");

-- CreateIndex
CREATE INDEX "products_is_favorite_idx" ON "products"("is_favorite");

-- CreateIndex
CREATE INDEX "products_updated_at_idx" ON "products"("updated_at");

-- CreateIndex
CREATE INDEX "product_pieces_product_id_idx" ON "product_pieces"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_pieces_product_id_name_key" ON "product_pieces"("product_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sizes_label_key" ON "sizes"("label");

-- CreateIndex
CREATE INDEX "product_piece_sizes_size_id_idx" ON "product_piece_sizes"("size_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_piece_sizes_product_piece_id_size_id_key" ON "product_piece_sizes"("product_piece_id", "size_id");

-- CreateIndex
CREATE INDEX "price_history_product_piece_size_id_idx" ON "price_history"("product_piece_size_id");

-- CreateIndex
CREATE INDEX "price_history_created_at_idx" ON "price_history"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_jalali_year_status_idx" ON "orders"("jalali_year", "status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "order_versions_order_id_idx" ON "order_versions"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_versions_order_id_version_number_key" ON "order_versions"("order_id", "version_number");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_piece_size_id_idx" ON "order_items"("product_piece_size_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_order_id_product_piece_size_id_key" ON "order_items"("order_id", "product_piece_size_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_payment_method_idx" ON "payments"("payment_method");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_sequences_jalali_year_key" ON "invoice_sequences"("jalali_year");

-- CreateIndex
CREATE UNIQUE INDEX "code_sequences_key_key" ON "code_sequences"("key");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_documents_order_id_key" ON "invoice_documents"("order_id");

-- CreateIndex
CREATE INDEX "company_phone_numbers_company_settings_id_idx" ON "company_phone_numbers"("company_settings_id");

-- CreateIndex
CREATE INDEX "notification_events_status_idx" ON "notification_events"("status");

-- CreateIndex
CREATE INDEX "notification_events_related_order_id_idx" ON "notification_events"("related_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_event_type_key" ON "notification_settings"("event_type");

-- CreateIndex
CREATE UNIQUE INDEX "application_settings_setting_key_key" ON "application_settings"("setting_key");
