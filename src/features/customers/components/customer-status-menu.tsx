"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { changeCustomerStatusAction } from "@/features/customers/actions";
import type { CustomerStatus } from "@/lib/enums";
import { useConfirmDialog } from "@/providers/confirm-dialog-provider";

const STATUS_OPTIONS: { value: CustomerStatus; label: string }[] = [
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
  { value: "blocked", label: "مسدود" },
];

/**
 * "Delete Customer" in this app is this menu, not a destructive action —
 * Phase 11: soft delete means setting `status = inactive`, the row and
 * every historical order stay exactly as they were.
 */
export function CustomerStatusMenu({ customerId, currentStatus }: { customerId: string; currentStatus: CustomerStatus }) {
  const router = useRouter();
  const confirm = useConfirmDialog();

  async function handleSelect(status: CustomerStatus) {
    if (status === currentStatus) return;

    const confirmed = await confirm({
      title: status === "blocked" ? "این مشتری مسدود شود؟" : status === "inactive" ? "این مشتری غیرفعال شود؟" : "این مشتری فعال شود؟",
      description:
        status === "blocked"
          ? "مشتری مسدود‌شده نمی‌تواند سفارش جدیدی ثبت کند."
          : status === "inactive"
            ? "این مشتری از لیست جستجوی سفارش‌ها حذف می‌شود، اما سوابق قبلی او دست‌نخورده باقی می‌ماند."
            : undefined,
      variant: status === "active" ? "confirmation" : "warning",
      confirmLabel: "تأیید",
    });
    if (!confirmed) return;

    const result = await changeCustomerStatusAction(customerId, status);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("وضعیت مشتری تغییر کرد");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="compact">
          تغییر وضعیت
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem key={option.value} onSelect={() => handleSelect(option.value)}>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
