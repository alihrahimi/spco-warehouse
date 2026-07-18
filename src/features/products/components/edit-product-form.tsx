"use client";

import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/toast";
import { updateProductAction } from "@/features/products/actions";
import { ProductForm, type ProductFormProps } from "@/features/products/components/product-form";

interface EditProductFormProps {
  productId: string;
  defaultValues: ProductFormProps["defaultValues"];
}

export function EditProductForm({ productId, defaultValues }: EditProductFormProps) {
  const router = useRouter();

  return (
    <ProductForm
      defaultValues={defaultValues}
      submitLabel="ذخیره تغییرات"
      onCancel={() => router.push(`/products/${productId}`)}
      onSubmit={async (values) => {
        const result = await updateProductAction(productId, values);
        if (!result.success) return result;
        toast.success("تغییرات ذخیره شد");
        router.push(`/products/${productId}`);
        return { success: true };
      }}
    />
  );
}
