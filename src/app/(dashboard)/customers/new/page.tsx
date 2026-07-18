"use client";

import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PageContainer } from "@/components/shared/page-container";
import { toast } from "@/components/ui/toast";
import { createCustomerAction } from "@/features/customers/actions";
import { CustomerForm } from "@/features/customers/components/customer-form";

export default function NewCustomerPage() {
  const router = useRouter();

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Breadcrumb items={[{ label: "مشتریان", href: "/customers" }, { label: "مشتری جدید" }]} />
        <h1 className="text-h2 font-semibold text-foreground">ثبت مشتری جدید</h1>

        <Card className="max-w-2xl">
          <CustomerForm
            onCancel={() => router.push("/customers")}
            onSubmit={async (values) => {
              const result = await createCustomerAction(values);
              if (!result.success) return result;
              toast.success("مشتری ثبت شد");
              router.push(`/customers/${result.data.id}`);
              return { success: true };
            }}
          />
        </Card>
      </div>
    </PageContainer>
  );
}
