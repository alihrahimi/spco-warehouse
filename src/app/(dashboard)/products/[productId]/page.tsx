import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PageContainer } from "@/components/shared/page-container";
import { ProductStatusBadge } from "@/components/shared/product-status-badge";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getAllSizes, getProductDetails } from "@/features/products/services";
import { getDefaultPackSize } from "@/features/settings/services";
import { BulkPriceUpdateTrigger } from "@/features/products/components/bulk-price-update-trigger";
import { DeleteProductButton } from "@/features/products/components/delete-product-button";
import { DuplicateProductButton } from "@/features/products/components/duplicate-product-button";
import { PieceEditor, type PieceWithSizes } from "@/features/products/components/piece-editor";
import { ProductFavoriteToggle } from "@/features/products/components/product-favorite-toggle";
import { ProductImageUpload } from "@/features/products/components/product-image-upload";
import { ProductStatusToggle } from "@/features/products/components/product-status-toggle";
import type { BulkPriceUpdateTarget } from "@/features/products/components/bulk-price-update-dialog";

interface ProductDetailsPageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { productId } = await params;
  const [product, allSizes, defaultPackSize, session] = await Promise.all([
    getProductDetails(productId),
    getAllSizes(),
    getDefaultPackSize(),
    getCurrentSession(),
  ]);
  if (!product) notFound();
  const canDelete = Boolean(session && hasPermission(session.user.role, "products:delete"));

  // Every piece shows a row for every size in the system, whether or not
  // it's been priced yet — this is what lets PieceEditor flag "قیمتی
  // تعریف نشده" per SCREEN-SPECS.md §9 instead of silently omitting
  // unconfigured sizes.
  const pieces: PieceWithSizes[] = product.pieces.map((piece) => {
    const configuredBySize = new Map(piece.sizes.map((entry) => [entry.sizeId, entry]));

    return {
      id: piece.id,
      name: piece.name,
      sortOrder: piece.sortOrder,
      sizes: allSizes.map((size) => {
        const configured = configuredBySize.get(size.id);
        return {
          sizeId: size.id,
          sizeLabel: size.label,
          productPieceSizeId: configured?.id ?? null,
          unitPrice: configured ? Number(configured.unitPrice) : null,
          defaultPackSize: configured?.defaultPackSize ?? null,
        };
      }),
    };
  });

  const bulkPriceTargets: BulkPriceUpdateTarget[] = product.pieces.flatMap((piece) =>
    piece.sizes.map((entry) => ({
      productPieceSizeId: entry.id,
      label: `${piece.name} — سایز ${entry.size.label}`,
      currentPrice: Number(entry.unitPrice),
    })),
  );

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Breadcrumb items={[{ label: "محصولات", href: "/products" }, { label: product.name }]} />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-h2 font-semibold text-foreground">{product.name}</h1>
              <ProductStatusBadge isActive={product.isActive} />
            </div>
            <p dir="ltr" className="mt-1 text-body-small text-muted-foreground">
              {product.productCode} · {product.category.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ProductFavoriteToggle productId={product.id} isFavorite={product.isFavorite} />
            <ProductStatusToggle productId={product.id} isActive={product.isActive} />
            <DuplicateProductButton productId={product.id} productName={product.name} />
            <Button asChild variant="outline">
              <Link href={`/products/${product.id}/edit`}>
                <Pencil className="size-4" />
                ویرایش
              </Link>
            </Button>
            {canDelete ? <DeleteProductButton productId={product.id} productName={product.name} /> : null}
          </div>
        </div>

        <Card>
          <div className="flex flex-col gap-6 sm:flex-row">
            <ProductImageUpload productId={product.id} imageFilePath={product.imageFilePath} />
            <div className="flex-1">
              <p className="text-body-small text-foreground-secondary">توضیحات</p>
              <p className="mt-1 text-body text-foreground">{product.description || "—"}</p>
              <p className="mt-4 text-body-small text-foreground-secondary">
                {toPersianDigits(product.pieces.length)} قطعه
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-h4 font-semibold text-foreground">قطعه‌ها، سایزها و قیمت‌ها</h2>
            <BulkPriceUpdateTrigger targets={bulkPriceTargets} />
          </div>
          <PieceEditor productId={product.id} pieces={pieces} allSizes={allSizes} defaultPackSize={defaultPackSize} />
        </Card>
      </div>
    </PageContainer>
  );
}
