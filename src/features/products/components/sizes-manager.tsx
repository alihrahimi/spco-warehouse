"use client";

import type { Size } from "@prisma/client";
import { ChevronDown, ChevronUp, Plus, Ruler } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/shared/empty-state";
import { createSizeAction, renameSizeAction, reorderSizesAction } from "@/features/products/actions";

/**
 * The global Sizes admin screen (final-revision requirement #6): create,
 * rename, and reorder — the fix for the piece editor's former dead end,
 * where an empty size list left the admin with no way forward except
 * editing the database directly. No delete: see `reorderSizes`'s comment
 * in services.ts for why this small, rarely-changing list only supports
 * rename/reorder.
 */
export function SizesManager({ initialSizes }: { initialSizes: Size[] }) {
  const router = useRouter();
  const [sizes, setSizes] = useState(initialSizes);
  const [syncedInitialSizes, setSyncedInitialSizes] = useState(initialSizes);

  // `router.refresh()` re-runs the server component and passes a new
  // `initialSizes` array, but `useState`'s initial value only applies on
  // first mount — without this, a create/rename by another session (or
  // this one, before the refresh lands) would never appear until a full
  // page reload. Adjusted during render, not an effect, same pattern used
  // for seeding `ProductQuantityDialog`/`BulkPriceUpdateDialog`.
  if (initialSizes !== syncedInitialSizes) {
    setSyncedInitialSizes(initialSizes);
    setSizes(initialSizes);
  }
  const [newLabel, setNewLabel] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate() {
    if (newLabel.trim() === "") {
      toast.error("برچسب سایز را وارد کنید");
      return;
    }
    setIsCreating(true);
    const result = await createSizeAction(newLabel);
    setIsCreating(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("سایز اضافه شد");
    setNewLabel("");
    router.refresh();
  }

  async function handleRename(sizeId: string, label: string) {
    const current = sizes.find((size) => size.id === sizeId);
    if (!current || current.label === label.trim() || label.trim() === "") return;

    const result = await renameSizeAction(sizeId, label);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleMove(sizeId: string, direction: -1 | 1) {
    const index = sizes.findIndex((size) => size.id === sizeId);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sizes.length) return;

    const reordered = [...sizes];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);
    setSizes(reordered);

    const result = await reorderSizesAction(reordered.map((size) => size.id));
    if (!result.success) {
      toast.error(result.error);
      setSizes(sizes);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-body-small text-foreground-secondary">
        سایزها یک‌بار برای کل سیستم تعریف می‌شوند و هر محصول از همین فهرست استفاده می‌کند — نیازی به تعریف سایز جداگانه برای هر
        محصول نیست.
      </p>

      <Card className="flex items-end gap-3">
        <FormField label="افزودن سایز جدید" htmlFor="new-size-label" className="max-w-xs flex-1">
          <Input
            id="new-size-label"
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder="مثال: ۰ یا آزاد"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleCreate();
              }
            }}
          />
        </FormField>
        <Button type="button" loading={isCreating} onClick={handleCreate}>
          <Plus className="size-4" />
          افزودن سایز
        </Button>
      </Card>

      <Card>
        {sizes.length === 0 ? (
          <EmptyState icon={Ruler} title="هنوز سایزی تعریف نشده" description="اولین سایز را با فرم بالا اضافه کنید — مثال: ۰، ۱، ۲، ۳، آزاد." />
        ) : (
          <div className="flex flex-col divide-y divide-divider">
            {sizes.map((size, index) => (
              <div key={size.id} className="flex items-center gap-3 py-2.5">
                <Input
                  defaultValue={size.label}
                  className="max-w-40"
                  onBlur={(event) => handleRename(size.id, event.target.value)}
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="جابجایی به بالا"
                    disabled={index === 0}
                    onClick={() => handleMove(size.id, -1)}
                    className="flex size-8 items-center justify-center rounded-small text-foreground-secondary hover:bg-hover disabled:opacity-30"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="جابجایی به پایین"
                    disabled={index === sizes.length - 1}
                    onClick={() => handleMove(size.id, 1)}
                    className="flex size-8 items-center justify-center rounded-small text-foreground-secondary hover:bg-hover disabled:opacity-30"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
