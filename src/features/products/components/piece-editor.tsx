"use client";

import { AlertTriangle, ChevronDown, ChevronUp, Plus, Ruler, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/providers/confirm-dialog-provider";
import {
  createPieceAction,
  deletePieceAction,
  reorderPiecesAction,
  updatePieceAction,
} from "@/features/products/actions";
import { SizePriceRow } from "@/features/products/components/size-price-row";

export interface PieceWithSizes {
  id: string;
  name: string;
  sortOrder: number;
  sizes: {
    sizeId: string;
    sizeLabel: string;
    productPieceSizeId: string | null;
    unitPrice: number | null;
    defaultPackSize: number | null;
  }[];
}

export interface AllSize {
  id: string;
  label: string;
}

/**
 * SCREEN-SPECS.md §9: "Display ALL pieces belonging to that product on a
 * single screen" — an accordion, not a separate page per piece. Reorder
 * is up/down buttons rather than drag-and-drop: no drag library is part
 * of the approved stack, and up/down fully satisfies "Support: ... Reorder"
 * without adding a new dependency for it.
 */
export function PieceEditor({
  productId,
  pieces,
  allSizes,
  defaultPackSize = 6,
}: {
  productId: string;
  pieces: PieceWithSizes[];
  allSizes: AllSize[];
  defaultPackSize?: number;
}) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [expandedPieceId, setExpandedPieceId] = useState<string | null>(pieces[0]?.id ?? null);
  const [newPieceName, setNewPieceName] = useState("");
  const [isAddingPiece, setIsAddingPiece] = useState(false);

  async function handleAddPiece() {
    if (newPieceName.trim().length === 0) {
      toast.error("نام قطعه را وارد کنید");
      return;
    }
    setIsAddingPiece(true);
    const result = await createPieceAction(productId, { name: newPieceName });
    setIsAddingPiece(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("قطعه اضافه شد");
    setNewPieceName("");
    router.refresh();
  }

  async function handleRenamePiece(pieceId: string, name: string) {
    const result = await updatePieceAction(pieceId, { name });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDeletePiece(piece: PieceWithSizes) {
    const confirmed = await confirm({
      title: `قطعه «${piece.name}» حذف شود؟`,
      description: "اگر این قطعه در سفارش‌های قبلی استفاده شده باشد، به‌جای حذف کامل، غیرفعال می‌شود.",
      variant: "delete",
      confirmLabel: "حذف",
    });
    if (!confirmed) return;

    const result = await deletePieceAction(piece.id, productId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("قطعه حذف شد");
    router.refresh();
  }

  async function handleMove(pieceId: string, direction: -1 | 1) {
    const index = pieces.findIndex((piece) => piece.id === pieceId);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= pieces.length) return;

    const reordered = [...pieces];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    const result = await reorderPiecesAction(productId, reordered.map((piece) => piece.id));
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <FormField label="افزودن قطعه جدید" htmlFor="new-piece-name" className="flex-1">
          <Input
            id="new-piece-name"
            value={newPieceName}
            onChange={(event) => setNewPieceName(event.target.value)}
            placeholder="مثال: کلاه"
          />
        </FormField>
        <Button type="button" loading={isAddingPiece} onClick={handleAddPiece}>
          <Plus className="size-4" />
          افزودن قطعه
        </Button>
      </div>

      {pieces.length === 0 ? (
        <p className="text-body text-muted-foreground">هنوز قطعه‌ای برای این محصول ثبت نشده است.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {pieces.map((piece, index) => {
            const isExpanded = expandedPieceId === piece.id;
            const missingPrice = piece.sizes.some((size) => size.productPieceSizeId === null);

            return (
              <div key={piece.id} className="rounded-large border border-border">
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setExpandedPieceId(isExpanded ? null : piece.id)}
                    className="flex flex-1 items-center gap-2 text-start"
                  >
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                    <span className="text-body-large font-medium text-foreground">{piece.name}</span>
                    {missingPrice ? (
                      <span className="flex items-center gap-1 text-body-small text-warning">
                        <AlertTriangle className="size-3.5" />
                        قیمتی تعریف نشده
                      </span>
                    ) : null}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="جابجایی به بالا"
                      disabled={index === 0}
                      onClick={() => handleMove(piece.id, -1)}
                      className="flex size-8 items-center justify-center rounded-small text-foreground-secondary hover:bg-hover disabled:opacity-30"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="جابجایی به پایین"
                      disabled={index === pieces.length - 1}
                      onClick={() => handleMove(piece.id, 1)}
                      className="flex size-8 items-center justify-center rounded-small text-foreground-secondary hover:bg-hover disabled:opacity-30"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="حذف قطعه"
                      onClick={() => handleDeletePiece(piece)}
                      className="flex size-8 items-center justify-center rounded-small text-danger hover:bg-danger-light"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="border-t border-divider px-4 py-3">
                    <div className="mb-3 flex items-end gap-3">
                      <FormField label="نام قطعه" htmlFor={`piece-name-${piece.id}`} className="max-w-xs">
                        <Input
                          id={`piece-name-${piece.id}`}
                          defaultValue={piece.name}
                          onBlur={(event) => {
                            if (event.target.value.trim() !== piece.name) {
                              handleRenamePiece(piece.id, event.target.value.trim());
                            }
                          }}
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 px-0 pb-1 text-body-small text-foreground-secondary">
                      <span className="w-10">سایز</span>
                      <span>قیمت (تومان)</span>
                      <span>سایز بسته</span>
                      <span />
                    </div>
                    {piece.sizes.map((size) => (
                      <SizePriceRow key={size.sizeId} pieceId={piece.id} productId={productId} data={size} fallbackPackSize={defaultPackSize} />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {allSizes.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-large border border-danger/30 bg-danger-light px-4 py-3">
          <p className="text-body-small text-danger">
            هیچ سایزی در سیستم تعریف نشده است — بدون سایز، امکان تعیین قیمت برای هیچ قطعه‌ای وجود ندارد.
          </p>
          <Button asChild size="compact" variant="danger">
            <Link href="/products/sizes">
              <Ruler className="size-4" />
              تعریف سایزها
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
