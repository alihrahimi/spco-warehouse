"use client";

import { ChevronDown, Copy, CreditCard, FileText, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import type { OrderStatus } from "@/lib/enums";
import { useConfirmDialog } from "@/providers/confirm-dialog-provider";
import {
  changeOrderStatusAction,
  convertDraftToPreInvoiceAction,
  deleteDraftAction,
  duplicateOrderAction,
} from "@/features/orders/actions";
import { PaymentFormDialog } from "@/features/payments/components/payment-form-dialog";

const MANUAL_STATUS_TARGETS: { value: OrderStatus; label: string }[] = [
  { value: "pending_payment", label: "در انتظار پرداخت" },
  { value: "preparing", label: "در حال آماده‌سازی" },
  { value: "ready", label: "آماده ارسال" },
  { value: "completed", label: "تکمیل‌شده" },
  { value: "cancelled", label: "لغو سفارش" },
];

/**
 * The Order Details action row — draft actions (continue/convert/delete)
 * for drafts, and status/payment/invoice/duplicate/edit for generated
 * orders. Status is always a manual staff choice (fixed since Phase 03).
 */
export function OrderActions({
  orderId,
  status,
  remainingAmount,
  canRegisterPayment,
  canEditItems,
  canDeleteDraft,
}: {
  orderId: string;
  status: OrderStatus;
  remainingAmount: number;
  /** `payments:create` — warehouse staff take orders but never register payments (final-revision brief). */
  canRegisterPayment: boolean;
  /** `orders:edit` — full line-item/version editing after pre-invoice generation; warehouse staff only get `orders:status`. */
  canEditItems: boolean;
  /** `orders:delete`. */
  canDeleteDraft: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleStatusChange(target: OrderStatus) {
    const confirmed = await confirm({
      title:
        target === "cancelled"
          ? "این سفارش لغو شود؟"
          : `وضعیت به «${MANUAL_STATUS_TARGETS.find((entry) => entry.value === target)?.label}» تغییر کند؟`,
      variant: target === "cancelled" ? "delete" : "confirmation",
      confirmLabel: "تأیید",
    });
    if (!confirmed) return;

    const result = await changeOrderStatusAction(orderId, target);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("وضعیت سفارش تغییر کرد");
    router.refresh();
  }

  async function handleConvert() {
    const confirmed = await confirm({
      title: "پیش‌فاکتور صادر شود؟",
      description: "پس از صدور، شماره سفارش اختصاص می‌یابد و اطلاعات شرکت روی سند ثابت می‌شود.",
      variant: "confirmation",
      confirmLabel: "صدور پیش‌فاکتور",
    });
    if (!confirmed) return;

    setBusy(true);
    const result = await convertDraftToPreInvoiceAction(orderId);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`پیش‌فاکتور ${result.data.orderNumber} صادر شد`);
    router.refresh();
  }

  async function handleDeleteDraft() {
    const confirmed = await confirm({
      title: "این پیش‌نویس حذف شود؟",
      description: "پیش‌نویس‌ها سند تجاری نیستند و پس از حذف قابل بازیابی نیستند.",
      variant: "delete",
      confirmLabel: "حذف پیش‌نویس",
    });
    if (!confirmed) return;

    const result = await deleteDraftAction(orderId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("پیش‌نویس حذف شد");
    router.push("/orders");
  }

  async function handleDuplicate() {
    setBusy(true);
    const result = await duplicateOrderAction(orderId);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    if (result.data.skippedItems.length > 0) {
      toast.warning("برخی اقلام دیگر فعال نبودند و کپی نشدند", result.data.skippedItems.join("، "));
    }
    toast.success("نسخه جدید به‌صورت پیش‌نویس ایجاد شد");
    router.push(`/orders/new?draft=${result.data.orderId}`);
  }

  if (status === "draft") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="secondary">
          <Link href={`/orders/new?draft=${orderId}`}>
            <Pencil className="size-4" />
            ادامه پیش‌نویس
          </Link>
        </Button>
        <Button type="button" loading={busy} onClick={handleConvert}>
          <FileText className="size-4" />
          صدور پیش‌فاکتور
        </Button>
        {canDeleteDraft ? (
          <Button type="button" variant="danger" onClick={handleDeleteDraft}>
            <Trash2 className="size-4" />
            حذف پیش‌نویس
          </Button>
        ) : null}
      </div>
    );
  }

  const canEdit = canEditItems && (status === "pre_invoice_generated" || status === "pending_payment" || status === "preparing");
  const canPay = canRegisterPayment && status !== "cancelled";
  const canChangeStatus = status !== "cancelled" && status !== "completed";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {canPay ? (
        <Button type="button" onClick={() => setPaymentOpen(true)}>
          <CreditCard className="size-4" />
          افزودن پرداخت
        </Button>
      ) : null}

      <Button asChild variant="secondary">
        <Link href={`/print/invoice/${orderId}`} target="_blank">
          <FileText className="size-4" />
          چاپ / پیش‌فاکتور
        </Link>
      </Button>

      {canEdit ? (
        <Button asChild variant="outline">
          <Link href={`/orders/new?edit=${orderId}`}>
            <Pencil className="size-4" />
            ویرایش (نسخه جدید)
          </Link>
        </Button>
      ) : null}

      <Button type="button" variant="outline" loading={busy} onClick={handleDuplicate}>
        <Copy className="size-4" />
        کپی سفارش
      </Button>

      {canChangeStatus ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              تغییر وضعیت
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {MANUAL_STATUS_TARGETS.filter((entry) => entry.value !== status).map((entry) => (
              <DropdownMenuItem key={entry.value} onSelect={() => handleStatusChange(entry.value)}>
                {entry.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <PaymentFormDialog orderId={orderId} remainingAmount={remainingAmount} open={paymentOpen} onOpenChange={setPaymentOpen} />
    </div>
  );
}
