"use client";

import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/toast";
import { updateCustomerAction } from "@/features/customers/actions";
import { CustomerForm, type CustomerFormProps } from "@/features/customers/components/customer-form";

interface EditCustomerFormProps {
  customerId: string;
  defaultValues: CustomerFormProps["defaultValues"];
}

/** Thin client wrapper so the Edit page itself can stay a Server Component that fetches the customer directly. */
export function EditCustomerForm({ customerId, defaultValues }: EditCustomerFormProps) {
  const router = useRouter();

  return (
    <CustomerForm
      defaultValues={defaultValues}
      submitLabel="ذخیره تغییرات"
      onCancel={() => router.push(`/customers/${customerId}`)}
      onSubmit={async (values) => {
        const result = await updateCustomerAction(customerId, values);
        if (!result.success) return result;
        toast.success("تغییرات ذخیره شد");
        router.push(`/customers/${customerId}`);
        return { success: true };
      }}
    />
  );
}
