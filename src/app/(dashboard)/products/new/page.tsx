"use client";

import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PageContainer } from "@/components/shared/page-container";
import { toast } from "@/components/ui/toast";
import { createProductAction } from "@/features/products/actions";
import { ProductForm } from "@/features/products/components/product-form";

export default function NewProductPage() {
  const router = useRouter();

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Breadcrumb items={[{ label: "محصولات", href: "/products" }, { label: "محصول جدید" }]} />
        <h1 className="text-h2 font-semibold text-foreground">ثبت محصول جدید</h1>

        <Card className="max-w-2xl">
          <ProductForm
            onCancel={() => router.push("/products")}
            onSubmit={async (values) => {
              const result = await createProductAction(values);
              if (!result.success) return result;
              toast.success("محصول ثبت شد. اکنون قطعه‌ها و قیمت‌ها را اضافه کنید.");
              router.push(`/products/${result.data.id}`);
              return { success: true };
            }}
          />
        </Card>
      </div>
    </PageContainer>
  );
}
