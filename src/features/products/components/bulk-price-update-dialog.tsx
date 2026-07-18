"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FormField, Input, NumberInput } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { applyPriceAdjustment, type PriceAdjustment } from "@/lib/product/price-rounding";
import { formatToman } from "@/lib/format/currency";
import { bulkUpdatePricesAction } from "@/features/products/actions";

export interface BulkPriceUpdateTarget {
  productPieceSizeId: string;
  label: string;
  currentPrice: number;
}

const ADJUSTMENT_TYPE_OPTIONS = [
  { value: "percentage_increase", label: "افزایش درصدی" },
  { value: "percentage_decrease", label: "کاهش درصدی" },
  { value: "fixed_increase", label: "افزایش مبلغ ثابت" },
  { value: "fixed_decrease", label: "کاهش مبلغ ثابت" },
];

const ROUND_TO_OPTIONS = [
  { value: "0", label: "بدون گرد کردن" },
  { value: "1000", label: "نزدیک‌ترین ۱,۰۰۰" },
  { value: "5000", label: "نزدیک‌ترین ۵,۰۰۰" },
  { value: "10000", label: "نزدیک‌ترین ۱۰,۰۰۰" },
];

export function BulkPriceUpdateDialog({
  open,
  onOpenChange,
  targets,
  onApplied,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: BulkPriceUpdateTarget[];
  onApplied: () => void;
}) {
  const [adjustmentType, setAdjustmentType] = useState<PriceAdjustment["type"]>("percentage_increase");
  const [value, setValue] = useState<number | "">("");
  const [roundTo, setRoundTo] = useState("0");
  const [customRoundTo, setCustomRoundTo] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Defaults to "everything selected" whenever the dialog transitions from
  // closed to open, rather than requiring the user to manually select
  // before seeing any preview. Adjusted during render (React's documented
  // pattern for "reset state when a prop changes"), not inside a
  // `useEffect` — a `setState` there would fire after the closed-dialog
  // paint and cause a visible, avoidable extra render.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSelectedIds(new Set(targets.map((target) => target.productPieceSizeId)));
  }

  const effectiveRoundTo = roundTo === "custom" ? (customRoundTo === "" ? 0 : customRoundTo) : Number(roundTo);
  const selectedTargets = targets.filter((target) => selectedIds.has(target.productPieceSizeId));

  const preview =
    value === ""
      ? []
      : selectedTargets.map((target) => ({
          ...target,
          newPrice: applyPriceAdjustment(target.currentPrice, { type: adjustmentType, value }, effectiveRoundTo),
        }));

  function toggleTarget(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleApply() {
    if (value === "" || value <= 0) {
      toast.error("مقدار تغییر قیمت را وارد کنید");
      return;
    }
    if (selectedTargets.length === 0) {
      toast.error("حداقل یک مورد را انتخاب کنید");
      return;
    }

    setIsSubmitting(true);
    const result = await bulkUpdatePricesAction({
      productPieceSizeIds: selectedTargets.map((target) => target.productPieceSizeId),
      adjustmentType,
      value,
      roundTo: effectiveRoundTo,
      reason,
    });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(`قیمت ${result.data.updatedCount.toLocaleString("fa-IR")} مورد بروزرسانی شد`);
    onApplied();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>بروزرسانی گروهی قیمت — {selectedTargets.length.toLocaleString("fa-IR")} از {targets.length.toLocaleString("fa-IR")} مورد</DialogTitle>

        <div className="mt-4 flex flex-col gap-4">
          <div className="max-h-40 overflow-y-auto rounded-medium border border-border p-2">
            {targets.map((target) => (
              <div key={target.productPieceSizeId} className="py-1">
                <Checkbox
                  label={`${target.label} — ${formatToman(target.currentPrice)}`}
                  checked={selectedIds.has(target.productPieceSizeId)}
                  onCheckedChange={(checked) => toggleTarget(target.productPieceSizeId, Boolean(checked))}
                />
              </div>
            ))}
          </div>

          <FormField label="نوع تغییر" htmlFor="adjustment-type">
            <RadioGroup
              value={adjustmentType}
              onValueChange={(next) => setAdjustmentType(next as PriceAdjustment["type"])}
              options={ADJUSTMENT_TYPE_OPTIONS}
              orientation="vertical"
            />
          </FormField>

          <FormField label={adjustmentType.startsWith("percentage") ? "درصد تغییر" : "مبلغ تغییر (تومان)"} htmlFor="value">
            <NumberInput id="value" value={value} onChange={setValue} min={1} />
          </FormField>

          <FormField label="گرد کردن قیمت" htmlFor="round-to">
            <Select options={[...ROUND_TO_OPTIONS, { value: "custom", label: "مقدار دلخواه" }]} value={roundTo} onValueChange={setRoundTo} />
          </FormField>

          {roundTo === "custom" ? (
            <FormField label="مقدار گرد کردن (تومان)" htmlFor="custom-round-to">
              <NumberInput id="custom-round-to" value={customRoundTo} onChange={setCustomRoundTo} min={1} />
            </FormField>
          ) : null}

          <FormField label="دلیل تغییر (اختیاری)" htmlFor="reason">
            <Input id="reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          </FormField>

          {preview.length > 0 ? (
            <div className="max-h-56 overflow-y-auto rounded-medium border border-border">
              <table className="w-full border-collapse text-body-small">
                <thead>
                  <tr className="border-b border-border text-foreground-secondary">
                    <th className="h-9 px-2 text-start font-medium">مورد</th>
                    <th className="h-9 px-2 text-start font-medium">قیمت فعلی</th>
                    <th className="h-9 px-2 text-start font-medium">قیمت جدید</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr key={row.productPieceSizeId} className="border-b border-divider last:border-0">
                      <td className="px-2 py-1.5 text-foreground">{row.label}</td>
                      <td className="px-2 py-1.5 text-foreground-secondary">{formatToman(row.currentPrice)}</td>
                      <td className="px-2 py-1.5 font-medium text-primary">{formatToman(row.newPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-2 flex flex-row-reverse gap-3">
            <Button type="button" loading={isSubmitting} onClick={handleApply}>
              اعمال تغییرات
            </Button>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
