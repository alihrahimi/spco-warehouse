import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PageContainer } from "@/components/shared/page-container";
import { OrderBuilder, type OrderBuilderInitialState } from "@/features/orders/components/order-builder/order-builder";
import { getOrderForBuilder } from "@/features/orders/services";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

interface NewOrderPageProps {
  searchParams: Promise<{ draft?: string; edit?: string }>;
}

/**
 * Three entries into the same builder: fresh (`/orders/new`), continuing a
 * draft (`?draft=<id>` — Phase 13 draft recovery), or versioned editing of
 * a generated order (`?edit=<id>` — every save creates a version, gated
 * on `orders:edit` — warehouse staff, who only hold `orders:create` and
 * `orders:status`, are blocked here rather than allowed to fill out an
 * edit they can't ultimately save).
 */
export default async function NewOrderPage({ searchParams }: NewOrderPageProps) {
  const { draft, edit } = await searchParams;
  const session = await requirePermission(edit ? "orders:edit" : "orders:create");
  const canCreateCustomer = hasPermission(session.user.role, "customers:edit");

  let initialState: OrderBuilderInitialState | null = null;

  if (draft || edit) {
    const orderId = (draft ?? edit) as string;
    const loaded = await getOrderForBuilder(orderId);
    if (!loaded) notFound();

    if (draft && loaded.status !== "draft") notFound();
    if (edit && (loaded.status === "draft" || loaded.status === "completed" || loaded.status === "cancelled")) notFound();

    initialState = {
      orderId: loaded.orderId,
      mode: draft ? "draft" : "versioned_edit",
      customer: loaded.customer,
      lines: loaded.items.map((item) => ({
        productPieceSizeId: item.productPieceSizeId,
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        pieceName: item.pieceName,
        sizeLabel: item.sizeLabel,
        packQuantity: item.packQuantity,
        unitQuantity: item.unitQuantity,
        packSize: item.packSize,
        unitPrice: item.unitPrice,
      })),
      notes: loaded.notes,
      customerNotes: loaded.customerNotes,
    };
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Breadcrumb
          items={[
            { label: "سفارش‌ها", href: "/orders" },
            { label: initialState?.mode === "versioned_edit" ? "ویرایش سفارش" : "سفارش جدید" },
          ]}
        />
        <h1 className="text-h2 font-semibold text-foreground">
          {initialState?.mode === "versioned_edit" ? "ویرایش سفارش" : "ثبت سفارش جدید"}
        </h1>
        <OrderBuilder initialState={initialState} canCreateCustomer={canCreateCustomer} />
      </div>
    </PageContainer>
  );
}
