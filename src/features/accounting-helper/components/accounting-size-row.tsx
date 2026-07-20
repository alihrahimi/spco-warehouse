"use client";

import { useState } from "react";

import { Input, NumberInput } from "@/components/ui/input";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { toast } from "@/components/ui/toast";
import { updateAccountingCodeAction, upsertPieceSizeAction } from "@/features/products";

export interface AccountingSizeRowData {
  sizeId: string;
  sizeLabel: string;
  productPieceSizeId: string | null;
  unitPrice: number | null;
  defaultPackSize: number | null;
  accountingCode: string | null;
}

/**
 * One Piece×Size row inside Accounting Helper's product grid — the same
 * price/pack-size/accounting-code fields as `SizePriceRow` on the Product
 * Details page (same actions, same blur-to-save behavior), plus a
 * Quantity column specific to this tool. Kept as its own component rather
 * than extending `SizePriceRow`: the two rows' column sets genuinely
 * differ (Product Details never shows Quantity; here it's always present),
 * and forcing one grid template to cover both would need two full
 * literal Tailwind class strings selected by a flag anyway — no simpler
 * than two small components.
 */
export function AccountingSizeRow({
  pieceId,
  productId,
  data,
  fallbackPackSize,
  quantity,
  onQuantityChange,
  onSaved,
}: {
  pieceId: string;
  productId: string;
  data: AccountingSizeRowData;
  fallbackPackSize: number;
  /** Local-only, per this accounting sheet — never persisted to the product's own data. */
  quantity: number | "";
  onQuantityChange: (quantity: number | "") => void;
  /** Fires after any successful price/pack-size/code save so the parent can refetch — a first-time price save creates a brand-new `productPieceSizeId` server-side that this row doesn't know until then. */
  onSaved: () => void;
}) {
  const [price, setPrice] = useState<number | "">(data.unitPrice ?? "");
  const [packSize, setPackSize] = useState<number | "">(data.defaultPackSize ?? fallbackPackSize);
  const [accountingCode, setAccountingCode] = useState(data.accountingCode ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCode, setIsSavingCode] = useState(false);

  const hasValue = data.productPieceSizeId !== null;
  const hasCode = accountingCode.trim() !== "";

  async function handleBlurSave() {
    if (price === "" || packSize === "") return;
    if (price === data.unitPrice && packSize === data.defaultPackSize) return;

    setIsSaving(true);
    const result = await upsertPieceSizeAction(pieceId, productId, { sizeId: data.sizeId, unitPrice: price, defaultPackSize: packSize });
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`سایز ${data.sizeLabel} ذخیره شد`);
    onSaved();
  }

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
    onSaved();
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-b border-divider px-3 py-3 last:border-0 sm:grid-cols-[3.5rem_1fr_1fr_1fr_1fr] sm:items-center">
      <span className="col-span-2 text-body font-medium text-foreground sm:col-span-1">سایز {toPersianDigits(data.sizeLabel)}</span>

      <div>
        <p className="mb-1 text-caption text-foreground-secondary sm:hidden">قیمت</p>
        <NumberInput aria-label={`قیمت سایز ${data.sizeLabel}`} value={price} onChange={setPrice} onBlur={handleBlurSave} min={1} step={1000} />
      </div>

      <div>
        <p className="mb-1 text-caption text-foreground-secondary sm:hidden">سایز بسته</p>
        <NumberInput aria-label={`سایز بسته سایز ${data.sizeLabel}`} value={packSize} onChange={setPackSize} onBlur={handleBlurSave} min={1} />
      </div>

      <div>
        <p className="mb-1 text-caption text-foreground-secondary sm:hidden">کد حسابداری</p>
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
      </div>

      <div>
        <p className="mb-1 text-caption text-foreground-secondary sm:hidden">تعداد (این فاکتور)</p>
        <NumberInput
          aria-label={`تعداد سایز ${data.sizeLabel} برای این فاکتور`}
          value={quantity}
          onChange={onQuantityChange}
          min={0}
          disabled={!hasValue || !hasCode}
        />
      </div>

      {(isSaving || isSavingCode) && (
        <p className="col-span-2 -mt-1 text-caption text-muted-foreground sm:col-span-5">در حال ذخیره...</p>
      )}
    </div>
  );
}
