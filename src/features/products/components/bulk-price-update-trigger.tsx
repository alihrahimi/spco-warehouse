"use client";

import { Percent } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BulkPriceUpdateDialog, type BulkPriceUpdateTarget } from "@/features/products/components/bulk-price-update-dialog";

export function BulkPriceUpdateTrigger({ targets }: { targets: BulkPriceUpdateTarget[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (targets.length === 0) return null;

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Percent className="size-4" />
        بروزرسانی گروهی قیمت
      </Button>
      <BulkPriceUpdateDialog open={open} onOpenChange={setOpen} targets={targets} onApplied={() => router.refresh()} />
    </>
  );
}
