"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { toggleFavoriteCustomerAction } from "@/features/customers/actions";

export function FavoriteToggleButton({ customerId, isFavorite }: { customerId: string; isFavorite: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await toggleFavoriteCustomerAction(customerId, !isFavorite);
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
