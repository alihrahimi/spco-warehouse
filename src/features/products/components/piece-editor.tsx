"use client";

import { AlertTriangle, ChevronDown, ChevronUp, GripVertical, Plus, Ruler, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { getPieceColor } from "@/lib/product/piece-colors";
import type { PieceWithSizes } from "@/features/products/services";

export type { PieceWithSizes };

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
  canEdit = true,
}: {
  productId: string;
  pieces: PieceWithSizes[];
  allSizes: AllSize[];
  defaultPackSize?: number;
  /** `products:edit` — Warehouse Staff (view-only) still sees every piece/size/price for reference during order-taking, just none of the add/rename/reorder/delete/price controls. */
  canEdit?: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  // Collapsed by default and single-expand, matching every other piece
  // accordion in the app (Order Creation, Accounting Helper) — with 100+
  // pieces, auto-opening the first one just pushed the rest off screen.
  const [expandedPieceId, setExpandedPieceId] = useState<string | null>(null);
  const [newPieceName, setNewPieceName] = useState("");
  const [isAddingPiece, setIsAddingPiece] = useState(false);
  const [draggedPieceId, setDraggedPieceId] = useState<string | null>(null);
  const [dropTargetPieceId, setDropTargetPieceId] = useState<string | null>(null);

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

  async function persistOrder(orderedIds: string[]) {
    const result = await reorderPiecesAction(productId, orderedIds);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
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
    await persistOrder(reordered.map((piece) => piece.id));
  }

  /** Drop `draggedPieceId` into the dragged-over piece's slot — same `reorderPiecesAction` the Move Up/Down buttons use, so both paths share one persistence story. Native HTML5 DnD (no library): mouse-only, which is fine because the up/down buttons remain the touch-device path. */
  async function handleDrop(targetPieceId: string) {
    const sourceId = draggedPieceId;
    setDraggedPieceId(null);
    setDropTargetPieceId(null);
    if (!sourceId || sourceId === targetPieceId) return;

    const sourceIndex = pieces.findIndex((piece) => piece.id === sourceId);
    const targetIndex = pieces.findIndex((piece) => piece.id === targetPieceId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reordered = [...pieces];
    const [moved] = reordered.splice(sourceIndex, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);
    await persistOrder(reordered.map((piece) => piece.id));
  }

  return (
    <div className="flex flex-col gap-4">
      {canEdit ? (
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
      ) : null}

      {pieces.length === 0 ? (
        <p className="text-body text-muted-foreground">هنوز قطعه‌ای برای این محصول ثبت نشده است.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {pieces.map((piece, index) => {
            const isExpanded = expandedPieceId === piece.id;
            const missingPrice = piece.sizes.some((size) => size.productPieceSizeId === null);
            const color = getPieceColor(piece.name);

            return (
              <div
                key={piece.id}
                className={cn(
                  "rounded-large border",
                  color.border,
                  draggedPieceId === piece.id && "opacity-50",
                  dropTargetPieceId === piece.id && draggedPieceId !== piece.id && "ring-2 ring-primary",
                )}
                // Native HTML5 drag & drop for reordering (desktop mice; touch
                // devices use the Move Up/Down buttons — HTML5 DnD has no
                // touch events). The whole card is the drop target so aim
                // doesn't need to be precise.
                draggable={canEdit}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  setDraggedPieceId(piece.id);
                }}
                onDragEnd={() => {
                  setDraggedPieceId(null);
                  setDropTargetPieceId(null);
                }}
                onDragOver={(event) => {
                  if (!draggedPieceId || draggedPieceId === piece.id) return;
                  event.preventDefault(); // required, or the browser refuses the drop
                  event.dataTransfer.dropEffect = "move";
                  setDropTargetPieceId(piece.id);
                }}
                onDragLeave={() => {
                  if (dropTargetPieceId === piece.id) setDropTargetPieceId(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  void handleDrop(piece.id);
                }}
              >
                <div className={cn("flex items-center gap-2 rounded-t-large px-4 py-3", color.bg, !isExpanded && "rounded-b-large")}>
                  {canEdit ? (
                    <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden="true" />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setExpandedPieceId(isExpanded ? null : piece.id)}
                    aria-expanded={isExpanded}
                    className="flex flex-1 items-center gap-2 text-start"
                  >
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                    {/* Same color-per-piece-name mapping as Order Creation and Accounting Helper — fast recognition works because it's consistent everywhere, not just within one screen. */}
                    <span className={`size-2.5 shrink-0 rounded-full ${color.dot}`} aria-hidden="true" />
                    <span className={`text-body-large font-semibold ${color.text}`}>{piece.name}</span>
                    <span className="text-caption text-muted-foreground">({toPersianDigits(piece.sizes.length)} سایز)</span>
                    {missingPrice ? (
                      <span className="flex items-center gap-1 text-body-small text-warning">
                        <AlertTriangle className="size-3.5" />
                        قیمتی تعریف نشده
                      </span>
                    ) : null}
                  </button>
                  {canEdit ? (
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
                  ) : null}
                </div>

                {isExpanded ? (
                  <div className="border-t border-divider px-4 py-3">
                    {canEdit ? (
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
                    ) : null}

                    <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 px-0 pb-1 text-body-small text-foreground-secondary sm:grid-cols-[auto_1fr_1fr_1fr_auto]">
                      <span className="w-10">سایز</span>
                      <span>قیمت (تومان)</span>
                      <span>سایز بسته</span>
                      <span className="hidden sm:inline">کد حسابداری</span>
                      <span />
                    </div>
                    {piece.sizes.map((size) => (
                      <SizePriceRow
                        key={size.sizeId}
                        pieceId={piece.id}
                        productId={productId}
                        data={size}
                        fallbackPackSize={defaultPackSize}
                        canEdit={canEdit}
                      />
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
          {canEdit ? (
            <Button asChild size="compact" variant="danger">
              <Link href="/products/sizes">
                <Ruler className="size-4" />
                تعریف سایزها
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
