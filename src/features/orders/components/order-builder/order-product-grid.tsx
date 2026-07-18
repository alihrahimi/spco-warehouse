"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, PackageSearch } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { SearchInput, NumberInput } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { formatToman } from "@/lib/format/currency";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { searchProductsForOrderAction, getProductForOrderAction } from "@/features/products";
import { useOrderBuilderStore } from "@/store/order-builder-store";

/**
 * The core order-entry interaction (final-revision requirement #7) —
 * deliberately NOT a dialog. Every product is a row in one list; tapping
 * a row expands it in place to show ALL its pieces and ALL their sizes at
 * once, each size with pack and unit inputs bound directly to the order
 * store — typing a number updates the order immediately, with no separate
 * "add to order" step, no popup, no page navigation. Only one product is
 * expanded at a time (a 15-piece × 4-size product is already 60+ input
 * pairs; keeping the rest collapsed is what makes this fast on a tablet
 * rather than an endless scroll).
 */
export function OrderProductGrid({
  expandedProductId,
  onExpandedChange,
}: {
  expandedProductId: string | null;
  onExpandedChange: (productId: string | null) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const lines = useOrderBuilderStore((state) => state.lines);

  const { data: products, isLoading } = useQuery({
    queryKey: ["orders", "product-grid", debouncedSearch],
    queryFn: async () => {
      const result = await searchProductsForOrderAction(debouncedSearch);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  function itemCountFor(productId: string): number {
    return Object.values(lines).filter((line) => line.productId === productId && (line.packQuantity > 0 || line.unitQuantity > 0))
      .length;
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجوی طرح یا کد محصول..." />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : !products || products.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="محصولی یافت نشد"
          description={search ? "عبارت جستجو را تغییر دهید." : "هیچ محصول فعالی برای سفارش وجود ندارد."}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((product) => (
            <ProductRow
              key={product.id}
              id={product.id}
              name={product.name}
              productCode={product.productCode}
              imageFilePath={product.imageFilePath}
              itemCount={itemCountFor(product.id)}
              expanded={expandedProductId === product.id}
              onToggle={() => onExpandedChange(expandedProductId === product.id ? null : product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({
  id,
  name,
  productCode,
  imageFilePath,
  itemCount,
  expanded,
  onToggle,
}: {
  id: string;
  name: string;
  productCode: string;
  imageFilePath: string | null;
  itemCount: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  // Scrolls into view whenever a collapsed row is expanded — including
  // when `OrderLinesReview`'s edit button expands a row that's currently
  // scrolled out of sight, so "editing" a placed product never requires
  // hunting for it in a long list.
  useEffect(() => {
    if (expanded) rowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [expanded]);

  return (
    <div ref={rowRef} id={`product-row-${id}`} className="rounded-large border border-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-start"
        aria-expanded={expanded}
      >
        <div className="relative size-11 shrink-0 overflow-hidden rounded-medium bg-disabled">
          {imageFilePath ? (
            <Image src={imageFilePath} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <PackageSearch className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-large font-medium text-foreground">{name}</p>
          <p dir="ltr" className="text-body-small text-muted-foreground">
            {productCode}
          </p>
        </div>
        {itemCount > 0 ? (
          <span className="rounded-full bg-primary-light px-2.5 py-1 text-caption font-medium text-primary">
            {toPersianDigits(itemCount)} قلم
          </span>
        ) : null}
        <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded ? <ProductRowDetail productId={id} /> : null}
    </div>
  );
}

function ProductRowDetail({ productId }: { productId: string }) {
  const setLine = useOrderBuilderStore((state) => state.setLine);
  const lines = useOrderBuilderStore((state) => state.lines);

  const { data: product, isLoading } = useQuery({
    queryKey: ["orders", "product-detail", productId],
    queryFn: async () => {
      const result = await getProductForOrderAction(productId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  if (isLoading || !product) {
    return (
      <div className="flex flex-col gap-2 border-t border-divider p-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (product.pieces.length === 0) {
    return (
      <p className="border-t border-divider px-4 py-6 text-center text-body text-muted-foreground">
        برای این محصول هیچ قطعه قیمت‌گذاری‌شده‌ای وجود ندارد.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-divider p-3">
      {product.pieces.map((piece) => (
        <div key={piece.id} className="rounded-medium border border-divider">
          <p className="border-b border-divider bg-background px-3 py-2 text-body font-semibold text-foreground">{piece.name}</p>
          <div className="flex flex-col divide-y divide-divider">
            {piece.sizes.map((size) => {
              const line = lines[size.productPieceSizeId];
              const packQuantity = line?.packQuantity ?? 0;
              const unitQuantity = line?.unitQuantity ?? 0;
              const totalUnits = packQuantity * size.defaultPackSize + unitQuantity;

              function commit(next: { packQuantity: number; unitQuantity: number }) {
                setLine({
                  productPieceSizeId: size.productPieceSizeId,
                  productId: product!.id,
                  productName: product!.name,
                  productCode: product!.productCode,
                  pieceName: piece.name,
                  sizeLabel: size.sizeLabel,
                  packQuantity: next.packQuantity,
                  unitQuantity: next.unitQuantity,
                  packSize: size.defaultPackSize,
                  unitPrice: size.unitPrice,
                });
              }

              return (
                <div
                  key={size.productPieceSizeId}
                  className="grid grid-cols-[auto_1fr_1fr] items-end gap-2 px-3 py-2 sm:grid-cols-[auto_6rem_6rem_1fr]"
                >
                  <div className="w-14">
                    <p className="text-body font-medium text-foreground">سایز {toPersianDigits(size.sizeLabel)}</p>
                    <p className="text-caption text-muted-foreground">بسته {toPersianDigits(size.defaultPackSize)}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-caption font-medium text-foreground-secondary">بسته (Pack)</p>
                    <NumberInput
                      aria-label={`تعداد بسته سایز ${size.sizeLabel} ${piece.name}`}
                      value={packQuantity === 0 ? "" : packQuantity}
                      onChange={(value) => commit({ packQuantity: value === "" ? 0 : value, unitQuantity })}
                      min={0}
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-caption font-medium text-foreground-secondary">عددی (Unit)</p>
                    <NumberInput
                      aria-label={`تعداد عددی سایز ${size.sizeLabel} ${piece.name}`}
                      value={unitQuantity === 0 ? "" : unitQuantity}
                      onChange={(value) => commit({ packQuantity, unitQuantity: value === "" ? 0 : value })}
                      min={0}
                    />
                  </div>
                  <div className="col-span-3 text-body-small text-foreground-secondary sm:col-span-1 sm:text-end">
                    {totalUnits > 0 ? (
                      <>
                        <span className="font-medium text-foreground">{toPersianDigits(totalUnits)} عدد</span>
                        {" — "}
                        {formatToman(totalUnits * size.unitPrice)}
                      </>
                    ) : (
                      <span>{formatToman(size.unitPrice)} / عدد</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
