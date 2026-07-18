"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/providers/confirm-dialog-provider";
import { deleteProductAction } from "@/features/products/actions";

/**
 * Real delete, alongside the existing deactivate toggle — mirrors
 * `PieceEditor`'s delete confirmation exactly. A product with order
 * history is soft-deleted (historical `OrderItem` snapshots stay intact);
 * one with none is fully removed. Either way it disappears from
 * `/products`, so this always navigates back there on success.
 */
export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = await confirm({
      title: `محصول «${productName}» حذف شود؟`,
      description: "اگر این محصول در سفارش‌های قبلی استفاده شده باشد، به‌جای حذف کامل، غیرفعال و مخفی می‌شود.",
      variant: "delete",
      confirmLabel: "حذف",
    });
    if (!confirmed) return;

    setIsDeleting(true);
    const result = await deleteProductAction(productId);
    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("محصول حذف شد");
    router.push("/products");
  }

  return (
    <Button type="button" variant="danger" size="compact" loading={isDeleting} onClick={handleDelete}>
      <Trash2 className="size-4" />
      حذف محصول
    </Button>
  );
}
