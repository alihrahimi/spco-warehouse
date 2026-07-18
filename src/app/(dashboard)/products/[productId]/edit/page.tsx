import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PageContainer } from "@/components/shared/page-container";
import { requirePermission } from "@/lib/auth/session";
import { getProductBasicById } from "@/features/products/services";
import { EditProductForm } from "@/features/products/components/edit-product-form";

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

/** Not prefix-matchable in proxy.ts (the `[productId]` segment varies), so the guard lives here — same `products:edit` gate the Server Action already enforces. */
export default async function EditProductPage({ params }: EditProductPageProps) {
  await requirePermission("products:edit");
  const { productId } = await params;
  const product = await getProductBasicById(productId);
  if (!product) notFound();

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Breadcrumb
          items={[
            { label: "محصولات", href: "/products" },
            { label: product.name, href: `/products/${product.id}` },
            { label: "ویرایش" },
          ]}
        />
        <div>
          <h1 className="text-h2 font-semibold text-foreground">ویرایش محصول</h1>
          <p dir="ltr" className="mt-1 text-body-small text-muted-foreground">
            {product.productCode}
          </p>
        </div>

        <Card className="max-w-2xl">
          <EditProductForm
            productId={product.id}
            defaultValues={{
              name: product.name,
              categoryId: product.categoryId,
              description: product.description ?? "",
            }}
          />
        </Card>
      </div>
    </PageContainer>
  );
}
