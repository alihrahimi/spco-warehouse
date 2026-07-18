"use client";

import { History } from "lucide-react";
import { useState } from "react";

import { NumberInput } from "@/components/ui/input";
import { formatToman } from "@/lib/format/currency";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { toast } from "@/components/ui/toast";
import { upsertPieceSizeAction } from "@/features/products/actions";
import { PriceHistoryDialog } from "@/features/products/components/price-history-dialog";

export interface SizePriceRowData {
  sizeId: string;
  sizeLabel: string;
  productPieceSizeId: string | null;
  unitPrice: number | null;
  defaultPackSize: number | null;
}

export function SizePriceRow({
  pieceId,
  productId,
  data,
  fallbackPackSize = 6,
}: {
  pieceId: string;
  productId: string;
  data: SizePriceRowData;
  /** Unpriced sizes start from the admin-configurable system default (Phase 14) instead of a hardcoded 6. */
  fallbackPackSize?: number;
}) {
  const [price, setPrice] = useState<number | "">(data.unitPrice ?? "");
  const [packSize, setPackSize] = useState<number | "">(data.defaultPackSize ?? fallbackPackSize);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasValue = data.productPieceSizeId !== null;

  async function handleBlurSave() {
    if (price === "" || packSize === "") return;
    if (price === data.unitPrice && packSize === data.defaultPackSize) return;

    setIsSaving(true);
    const result = await upsertPieceSizeAction(pieceId, productId, {
      sizeId: data.sizeId,
      unitPrice: price,
      defaultPackSize: packSize,
    });
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`سایز ${data.sizeLabel} ذخیره شد`);
  }

  return (
    <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-3 border-b border-divider py-2 last:border-0">
      <span className="w-10 text-body font-medium text-foreground">سایز {toPersianDigits(data.sizeLabel)}</span>
      <NumberInput
        aria-label={`قیمت سایز ${data.sizeLabel}`}
        value={price}
        onChange={setPrice}
        onBlur={handleBlurSave}
        min={1}
        step={1000}
      />
      <NumberInput
        aria-label={`سایز بسته سایز ${data.sizeLabel}`}
        value={packSize}
        onChange={setPackSize}
        onBlur={handleBlurSave}
        min={1}
      />
      <div className="flex items-center gap-2">
        {hasValue ? (
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            aria-label="تاریخچه قیمت"
            className="flex size-9 items-center justify-center rounded-small text-foreground-secondary hover:bg-hover"
          >
            <History className="size-4" />
          </button>
        ) : null}
        {isSaving ? <span className="text-caption text-muted-foreground">در حال ذخیره...</span> : null}
      </div>

      {hasValue && data.unitPrice !== null ? (
        <p className="col-span-4 -mt-1 text-caption text-muted-foreground">{formatToman(data.unitPrice)}</p>
      ) : null}

      {data.productPieceSizeId ? (
        <PriceHistoryDialog
          productPieceSizeId={data.productPieceSizeId}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          sizeLabel={data.sizeLabel}
        />
      ) : null}
    </div>
  );
}
