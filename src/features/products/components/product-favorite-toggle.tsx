"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { toggleFavoriteProductAction } from "@/features/products/actions";

/** Same shape as `features/customers/components/favorite-toggle-button.tsx` — kept as its own component rather than shared, since generalizing it now would mean touching Phase 11's completed file for no functional gain. */
export function ProductFavoriteToggle({ productId, isFavorite }: { productId: string; isFavorite: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await toggleFavoriteProductAction(productId, !isFavorite);
    setPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      aria-label={isFavorite ? "حذف از موردعلاقه‌ها" : "افزودن به موردعلاقه‌ها"}
      className="flex size-11 items-center justify-center rounded-medium border border-border bg-surface hover:bg-hover disabled:opacity-50"
    >
      <Star className={cn("size-5", isFavorite ? "fill-warning text-warning" : "text-muted-foreground")} />
    </button>
  );
}
