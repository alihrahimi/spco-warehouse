import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SizesManager } from "@/features/products/components/sizes-manager";
import { getAllSizes } from "@/features/products/services";

export const dynamic = "force-dynamic";

/** Global Sizes admin (final-revision requirement #5/#6) — defined once, reused by every product's pieces. */
export default async function SizesPage() {
  const sizes = await getAllSizes();

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Breadcrumb items={[{ label: "محصولات", href: "/products" }, { label: "سایزها" }]} />
        <PageHeader title="مدیریت سایزها" />
        <SizesManager initialSizes={sizes} />
      </div>
    </PageContainer>
  );
}
