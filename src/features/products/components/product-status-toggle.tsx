"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/providers/confirm-dialog-provider";
import { changeProductStatusAction } from "@/features/products/actions";

export function ProductStatusToggle({ productId, isActive }: { productId: string; isActive: boolean }) {
  const router = useRouter();
  const confirm = useConfirmDialog();

  async function handleToggle() {
    const confirmed = await confirm({
      title: isActive ? "این محصول غیرفعال شود؟" : "این محصول فعال شود؟",
      description: isActive ? "محصول غیرفعال دیگر در ثبت سفارش جدید قابل انتخاب نیست." : undefined,
      variant: isActive ? "warning" : "confirmation",
      confirmLabel: "تأیید",
    });
    if (!confirmed) return;

    const result = await changeProductStatusAction(productId, !isActive);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("وضعیت محصول تغییر کرد");
    router.refresh();
  }

  return (
    <Button type="button" variant="secondary" size="compact" onClick={handleToggle}>
      {isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
    </Button>
  );
}
