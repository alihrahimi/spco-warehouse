import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PageContainer } from "@/components/shared/page-container";
import { getCustomerById } from "@/features/customers/services";
import { EditCustomerForm } from "@/features/customers/components/edit-customer-form";
import type { PaymentMethod } from "@/lib/enums";
import { requirePermission } from "@/lib/auth/session";

interface EditCustomerPageProps {
  params: Promise<{ customerId: string }>;
}

/** Not prefix-matchable in proxy.ts (the `[customerId]` segment varies), so the guard lives here — same `customers:edit` gate the Server Action already enforces. */
export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  await requirePermission("customers:edit");
  const { customerId } = await params;
  const customer = await getCustomerById(customerId);
  if (!customer) notFound();

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Breadcrumb
          items={[
            { label: "مشتریان", href: "/customers" },
            { label: customer.name, href: `/customers/${customer.id}` },
            { label: "ویرایش" },
          ]}
        />
        <div>
          <h1 className="text-h2 font-semibold text-foreground">ویرایش مشتری</h1>
          <p dir="ltr" className="mt-1 text-body-small text-muted-foreground">
            {customer.customerCode}
          </p>
        </div>

        <Card className="max-w-2xl">
          <EditCustomerForm
            customerId={customer.id}
            defaultValues={{
              name: customer.name,
              mobile: customer.mobile,
              // Cast is safe: this column is only ever written through
              // `customerSchema`'s `z.enum(PAYMENT_METHODS)`, so every row
              // already holds a valid `PaymentMethod` value — the DB
              // column itself is a plain `string` now that SQLite has no
              // enum type (see `src/lib/enums.ts`).
              defaultPaymentType: customer.defaultPaymentType as PaymentMethod,
              phone: customer.phone ?? "",
              province: customer.province ?? "",
              city: customer.city ?? "",
              address: customer.address ?? "",
              notes: customer.notes ?? "",
            }}
          />
        </Card>
      </div>
    </PageContainer>
  );
}
