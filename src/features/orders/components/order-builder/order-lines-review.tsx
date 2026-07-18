"use client";

import { Pencil, Trash2 } from "lucide-react";

import { formatToman } from "@/lib/format/currency";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { useOrderBuilderStore, type BuilderLine } from "@/store/order-builder-store";

/**
 * The running order, grouped product → piece → size (Phase 13's review
 * structure), every line showing pack qty, unit qty, computed units,
 * unit price, and subtotal. Tapping the pencil re-opens that product's
 * quantity dialog (editing any piece/size); the trash removes the whole
 * product; per-line removal is zeroing its quantities in the dialog or
 * the inline trash per line.
 */
export function OrderLinesReview({ onEditProduct }: { onEditProduct: (productId: string) => void }) {
  const lines = useOrderBuilderStore((state) => state.lines);
  const removeLine = useOrderBuilderStore((state) => state.removeLine);
  const removeProduct = useOrderBuilderStore((state) => state.removeProduct);

  const byProduct = new Map<string, BuilderLine[]>();
  for (const line of Object.values(lines)) {
    const group = byProduct.get(line.productId) ?? [];
    group.push(line);
    byProduct.set(line.productId, group);
  }

  if (byProduct.size === 0) {
    return <p className="py-6 text-center text-body text-muted-foreground">هنوز قلمی به سفارش اضافه نشده است.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {[...byProduct.entries()].map(([productId, productLines]) => {
        const first = productLines[0];
        if (!first) return null;
        const productTotal = productLines.reduce(
          (sum, line) => sum + (line.packQuantity * line.packSize + line.unitQuantity) * line.unitPrice,
          0,
        );

        return (
          <div key={productId} className="rounded-large border border-border">
            <div className="flex items-center justify-between border-b border-divider px-4 py-2.5">
              <div>
                <span className="text-body-large font-semibold text-foreground">{first.productName}</span>
                <span dir="ltr" className="ms-2 text-body-small text-muted-foreground">
                  {first.productCode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-body font-medium text-foreground">{formatToman(productTotal)}</span>
                <button
                  type="button"
                  aria-label={`ویرایش ${first.productName}`}
                  onClick={() => onEditProduct(productId)}
                  className="flex size-9 items-center justify-center rounded-small text-foreground-secondary hover:bg-hover"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`حذف ${first.productName} از سفارش`}
                  onClick={() => removeProduct(productId)}
                  className="flex size-9 items-center justify-center rounded-small text-danger hover:bg-danger-light"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-divider">
              {productLines
                .sort((a, b) => a.pieceName.localeCompare(b.pieceName, "fa") || a.sizeLabel.localeCompare(b.sizeLabel, "fa"))
                .map((line) => {
                  const units = line.packQuantity * line.packSize + line.unitQuantity;
                  return (
                    <div key={line.productPieceSizeId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                      <span className="text-body text-foreground">
                        {line.pieceName} — سایز {toPersianDigits(line.sizeLabel)}
                      </span>
                      <span className="flex items-center gap-3 text-body-small text-foreground-secondary">
                        {line.packQuantity > 0 ? (
                          <span>
                            {toPersianDigits(line.packQuantity)} بسته ×{toPersianDigits(line.packSize)}
                          </span>
                        ) : null}
                        {line.unitQuantity > 0 ? <span>{toPersianDigits(line.unitQuantity)} عدد</span> : null}
                        <span className="font-medium text-foreground">= {toPersianDigits(units)} عدد</span>
                        <span>{formatToman(units * line.unitPrice)}</span>
                        <button
                          type="button"
                          aria-label="حذف این قلم"
                          onClick={() => removeLine(line.productPieceSizeId)}
                          className="flex size-8 items-center justify-center rounded-small text-danger hover:bg-danger-light"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
