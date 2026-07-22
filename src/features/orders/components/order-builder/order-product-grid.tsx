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
import { getPieceColor } from "@/lib/product/piece-colors";
import { searchProductsForOrderAction, getProductForOrderAction } from "@/features/products";
import { useOrderBuilderStore } from "@/store/order-builder-store";

/**
 * The core order-entry interaction (final-revision requirement #7) —
 * deliberately NOT a dialog. Every product is a row in one list; tapping
 * a row expands it in place, each size with pack and unit inputs bound
 * directly to the order store — typing a number updates the order
 * immediately, with no separate "add to order" step, no popup, no page
 * navigation. Only one product is expanded at a time, and within it each
 * PIECE is its own collapsed-by-default accordion section (multiple may
 * be open): a 100-piece product would otherwise render thousands of
 * input pairs at once, which is unnavigable AND slow. Collapsed pieces
 * render zero size rows. The expanded set lives up here (not in
 * ProductRowDetail) so it survives collapsing/reopening a product row —
 * the user's layout stays exactly as they left it for the whole visit.
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
  // Single-expand: opening a piece collapses whichever one was open (an
  // explicit revision of the earlier multi-expand behavior — with several
  // pieces open the page grew unmanageably long again). Clicking the open
  // piece closes it. Same rule on every piece accordion in the app.
  const [expandedPieceId, setExpandedPieceId] = useState<string | null>(null);
  const lines = useOrderBuilderStore((state) => state.lines);

  function togglePieceExpanded(pieceId: string) {
    setExpandedPieceId((current) => (current === pieceId ? null : pieceId));
  }

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
      {/*
       * Sticky search toolbar. `-mx-4` cancels the parent Card's own
       * horizontal `p-4` so this strip spans the card's full width while
       * stuck (there's a heading above it inside the same Card, so a
       * matching `-mt-4` would overlap that heading instead of reaching
       * the card's actual top edge — horizontal-only cancellation is the
       * correct trick here). Height (py-3 + 52px input = 76px) is what
       * `top-[76px]` on each expanded product row's own sticky header
       * below is measured against, so the two sticky layers stack instead
       * of both pinning to the same spot.
       */}
      <div className="sticky top-0 z-20 -mx-4 bg-surface px-4 py-3 shadow-[var(--shadow-elevation-2)]">
        <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجوی طرح یا کد محصول..." />
      </div>

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
              expandedPieceId={expandedPieceId}
              onTogglePiece={togglePieceExpanded}
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
  expandedPieceId,
  onTogglePiece,
}: {
  id: string;
  name: string;
  productCode: string;
  imageFilePath: string | null;
  itemCount: number;
  expanded: boolean;
  onToggle: () => void;
  expandedPieceId: string | null;
  onTogglePiece: (pieceId: string) => void;
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
        // When expanded, the header sticks to the top of the viewport while
        // its (possibly very long) piece/size list scrolls beneath it — the
        // user always sees which product they're typing into and can
        // collapse it with one tap, without scrolling back up first.
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 text-start",
          // top-[76px] (not top-0): stacks right below the sticky search
          // toolbar above instead of both pinning to the same spot.
          expanded && "sticky top-[76px] z-10 rounded-t-large border-b border-divider bg-surface",
        )}
        aria-expanded={expanded}
      >
        <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-border bg-disabled">
          {imageFilePath ? (
            // unoptimized: /uploads/* is auth-protected, which breaks the
            // cookie-less /_next/image optimizer fetch — see invoice-view.tsx.
            <Image src={imageFilePath} alt="" fill sizes="44px" unoptimized className="object-cover" />
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

      {expanded ? <ProductRowDetail productId={id} expandedPieceId={expandedPieceId} onTogglePiece={onTogglePiece} /> : null}
    </div>
  );
}

function ProductRowDetail({
  productId,
  expandedPieceId,
  onTogglePiece,
}: {
  productId: string;
  expandedPieceId: string | null;
  onTogglePiece: (pieceId: string) => void;
}) {
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
      {product.pieces.map((piece) => {
        const color = getPieceColor(piece.name);
        const isExpanded = expandedPieceId === piece.id;
        // Lines already entered for this piece — surfaced on the collapsed
        // header so typed quantities never become invisible just because
        // their section is closed.
        const enteredCount = piece.sizes.filter((size) => {
          const line = lines[size.productPieceSizeId];
          return line && (line.packQuantity > 0 || line.unitQuantity > 0);
        }).length;

        return (
        <div key={piece.id} className={cn("rounded-medium border", color.border)}>
          {/* Same name→color mapping as Product Details and Accounting Helper (lib/product/piece-colors) — a piece is recognizable by hue before its label is read, everywhere it appears. */}
          <button
            type="button"
            onClick={() => onTogglePiece(piece.id)}
            aria-expanded={isExpanded}
            className={cn("flex w-full items-center gap-2 rounded-t-medium px-3 py-2.5 text-start", color.bg, !isExpanded && "rounded-b-medium")}
          >
            <span className={cn("size-2.5 shrink-0 rounded-full", color.dot)} aria-hidden="true" />
            <span className={cn("text-body font-semibold", color.text)}>{piece.name}</span>
            <span className="text-caption text-muted-foreground">({toPersianDigits(piece.sizes.length)} سایز)</span>
            <span className="flex-1" />
            {enteredCount > 0 ? (
              <span className="rounded-full bg-primary-light px-2 py-0.5 text-caption font-medium text-primary">
                {toPersianDigits(enteredCount)} قلم
              </span>
            ) : null}
            <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
          </button>
          {!isExpanded ? null : (
          <div className={cn("flex flex-col divide-y divide-divider border-t", color.border)}>
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
                  // 8rem (not 6rem) fixed columns at sm+: each NumberInput
                  // carries two 3rem steppers, so 6rem left literally zero
                  // width for typing into the field between them.
                  className="grid grid-cols-[auto_1fr_1fr] items-end gap-2 px-3 py-2 sm:grid-cols-[auto_8rem_8rem_1fr]"
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
          )}
        </div>
        );
      })}
    </div>
  );
}
