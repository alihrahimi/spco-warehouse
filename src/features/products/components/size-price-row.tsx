"use client";

import { History } from "lucide-react";
import { useState } from "react";

import { Input, NumberInput } from "@/components/ui/input";
import { formatToman } from "@/lib/format/currency";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { toast } from "@/components/ui/toast";
import { updateAccountingCodeAction, upsertPieceSizeAction } from "@/features/products/actions";
import { PriceHistoryDialog } from "@/features/products/components/price-history-dialog";

export interface SizePriceRowData {
  sizeId: string;
  sizeLabel: string;
  productPieceSizeId: string | null;
  unitPrice: number | null;
  defaultPackSize: number | null;
  accountingCode: string | null;
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
  const [accountingCode, setAccountingCode] = useState(data.accountingCode ?? "");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCode, setIsSavingCode] = useState(false);

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

  /** "Click the field, type the code, press Enter and it should save immediately" — Enter blurs, which triggers the same save as tabbing/clicking away. */
  async function handleSaveCode() {
    if (!data.productPieceSizeId) return;
    const trimmed = accountingCode.trim();
    if (trimmed === (data.accountingCode ?? "")) return;

    setIsSavingCode(true);
    const result = await updateAccountingCodeAction(data.productPieceSizeId, productId, { code: trimmed });
    setIsSavingCode(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`کد حسابداری سایز ${data.sizeLabel} ذخیره شد`);
  }

  const codeField = (
    <Input
      aria-label={`کد حسابداری سایز ${data.sizeLabel}`}
      value={accountingCode}
      onChange={(event) => setAccountingCode(event.target.value)}
      onBlur={handleSaveCode}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      disabled={!hasValue}
      placeholder={hasValue ? "مثال: 1605" : "ابتدا قیمت را ثبت کنید"}
      dir="ltr"
      className="h-[52px] text-center"
    />
  );

  return (
    <div className="flex flex-col gap-2 border-b border-divider py-2 last:border-0">
      {/*
       * Below `sm`, a 5th equal-width column left each NumberInput's own
       * pair of steppers with negative space for the number between them
       * (illegible, clipped digits) — the accounting-code field moves to
       * its own full-width row on narrow screens instead of fighting price
       * and pack-size for the same cramped column.
       */}
      <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-3 sm:grid-cols-[auto_1fr_1fr_1fr_auto]">
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
        <div className="hidden sm:block">{codeField}</div>
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
          {isSaving || isSavingCode ? <span className="text-caption text-muted-foreground">در حال ذخیره...</span> : null}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:hidden">
        <span className="w-10 shrink-0 text-body-small text-foreground-secondary">کد حسابداری</span>
        {codeField}
      </div>

      {hasValue && data.unitPrice !== null ? <p className="-mt-1 text-caption text-muted-foreground">{formatToman(data.unitPrice)}</p> : null}

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
