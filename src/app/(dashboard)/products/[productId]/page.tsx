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
import { buildPieceSizeGrid, getAllSizes, getProductDetails } from "@/features/products/services";
import { getDefaultPackSize } from "@/features/settings/services";
import { BulkPriceUpdateTrigger } from "@/features/products/components/bulk-price-update-trigger";
import { DeleteProductButton } from "@/features/products/components/delete-product-button";
import { DuplicateProductButton } from "@/features/products/components/duplicate-product-button";
import { PieceEditor } from "@/features/products/components/piece-editor";
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
  // `products:edit` — Warehouse Staff holds only `products:view` and must
  // see this whole page (they reference prices while taking orders), but
  // every mutating control below (favorite, status, duplicate, edit, image
  // upload, and every field inside PieceEditor) calls a Server Action that
  // throws PERMISSION_DENIED for them. Rendering those controls anyway let
  // a Warehouse Staff viewer trigger a save that could never succeed — the
  // save spinner got stuck forever because the thrown error skips the
  // `setIsSaving(false)` line right after the `await`. Not rendering the
  // control at all for a role that can't use it is the fix, matching the
  // `canDelete` pattern already used here.
  const canEdit = Boolean(session && hasPermission(session.user.role, "products:edit"));

  const pieces = buildPieceSizeGrid(product.pieces, allSizes);

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
            {canEdit ? (
              <>
                <ProductFavoriteToggle productId={product.id} isFavorite={product.isFavorite} />
                <ProductStatusToggle productId={product.id} isActive={product.isActive} />
                <DuplicateProductButton productId={product.id} productName={product.name} />
                <Button asChild variant="outline">
                  <Link href={`/products/${product.id}/edit`}>
                    <Pencil className="size-4" />
                    ویرایش
                  </Link>
                </Button>
              </>
            ) : null}
            {canDelete ? <DeleteProductButton productId={product.id} productName={product.name} /> : null}
          </div>
        </div>

        <Card>
          <div className="flex flex-col gap-6 sm:flex-row">
            <ProductImageUpload productId={product.id} imageFilePath={product.imageFilePath} canEdit={canEdit} />
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
            {canEdit ? <BulkPriceUpdateTrigger targets={bulkPriceTargets} /> : null}
          </div>
          <PieceEditor productId={product.id} pieces={pieces} allSizes={allSizes} defaultPackSize={defaultPackSize} canEdit={canEdit} />
        </Card>
      </div>
    </PageContainer>
  );
}
