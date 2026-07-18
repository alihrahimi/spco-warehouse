"use client";

import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/providers/confirm-dialog-provider";
import { duplicateProductAction } from "@/features/products/actions";

export function DuplicateProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [isDuplicating, setIsDuplicating] = useState(false);

  async function handleDuplicate() {
    const confirmed = await confirm({
      title: `از «${productName}» یک نسخه جدید ساخته شود؟`,
      description: "قطعه‌ها، سایزها، سایز بسته و قیمت‌ها کپی می‌شوند. تصویر محصول کپی نمی‌شود.",
      variant: "confirmation",
      confirmLabel: "ایجاد نسخه جدید",
    });
    if (!confirmed) return;

    setIsDuplicating(true);
    const result = await duplicateProductAction(productId);
    setIsDuplicating(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("نسخه جدید ایجاد شد");
    router.push(`/products/${result.data.id}`);
  }

  return (
    <Button type="button" variant="outline" loading={isDuplicating} onClick={handleDuplicate}>
      <Copy className="size-4" />
      کپی محصول
    </Button>
  );
}
