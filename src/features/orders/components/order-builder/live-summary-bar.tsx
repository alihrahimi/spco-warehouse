"use client";

import { formatToman } from "@/lib/format/currency";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { computeTotals, useOrderBuilderStore } from "@/store/order-builder-store";

/**
 * Phase 13's always-visible live summary: products / pieces / packs /
 * units / amount, recomputed from the store on every change. Rendered in
 * the sticky footer alongside the primary action, per UX-FLOW.md's
 * persistent running-summary rule.
 */
export function LiveSummaryBar() {
  const lines = useOrderBuilderStore((state) => state.lines);
  const saving = useOrderBuilderStore((state) => state.saving);
  const lastSavedAt = useOrderBuilderStore((state) => state.lastSavedAt);
  const totals = computeTotals(lines);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-body-small text-foreground-secondary">
      <span>
        محصولات: <b className="text-foreground">{toPersianDigits(totals.productCount)}</b>
      </span>
      <span>
        قطعه‌ها: <b className="text-foreground">{toPersianDigits(totals.pieceCount)}</b>
      </span>
      <span>
        بسته‌ها: <b className="text-foreground">{toPersianDigits(totals.totalPacks)}</b>
      </span>
      <span>
        مجموع عددی: <b className="text-foreground">{toPersianDigits(totals.totalUnits)}</b>
      </span>
      <span className="text-body font-bold text-foreground">{formatToman(totals.totalAmount)}</span>
      {saving ? (
        <span className="text-caption text-muted-foreground">در حال ذخیره...</span>
      ) : lastSavedAt ? (
        <span className="text-caption text-muted-foreground">ذخیره شد</span>
      ) : null}
    </div>
  );
}
