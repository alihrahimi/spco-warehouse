"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/providers/confirm-dialog-provider";
import { CurrencyInput } from "@/components/form/currency-input";
import { formatToman } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import { registerPaymentAction } from "@/features/payments/actions";
import type { PaymentInput } from "@/features/payments/schemas/payment.schema";

/**
 * SCREEN-SPECS.md §13 realized: big Cash/Cheque segment, the three cash
 * sub-type shortcut buttons that pre-fill the amount (تسویه کامل fills the
 * exact remaining balance), cheque's full record fields with Jalali
 * pickers, and the deliberate non-blocking overpayment confirm.
 */
export function PaymentFormDialog({
  orderId,
  remainingAmount,
  open,
  onOpenChange,
}: {
  orderId: string;
  remainingAmount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [method, setMethod] = useState<"cash" | "cheque">("cash");
  const [cashType, setCashType] = useState<PaymentInput["cashPaymentType"]>();
  const [amount, setAmount] = useState(0);
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeBankName, setChequeBankName] = useState("");
  const [chequeIssueDate, setChequeIssueDate] = useState<Date | null>(null);
  const [chequeDueDate, setChequeDueDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function selectCashType(type: NonNullable<PaymentInput["cashPaymentType"]>) {
    setCashType(type);
    if (type === "full_payment" || type === "remaining_balance") setAmount(Math.max(remainingAmount, 0));
  }

  async function handleSubmit() {
    setFieldErrors({});
    if (amount <= 0) {
      setFieldErrors({ amount: "مبلغ باید بیشتر از صفر باشد" });
      return;
    }

    if (amount > remainingAmount && remainingAmount > 0) {
      const confirmed = await confirm({
        title: "مبلغ وارد شده بیشتر از مانده است. ادامه می‌دهید؟",
        description: `مانده فعلی ${formatToman(remainingAmount)} است.`,
        variant: "warning",
        confirmLabel: "ادامه",
      });
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    const result = await registerPaymentAction(orderId, {
      paymentMethod: method,
      cashPaymentType: method === "cash" ? cashType : undefined,
      amount,
      chequeNumber,
      chequeBankName,
      chequeIssueDate: chequeIssueDate?.toISOString(),
      chequeDueDate: chequeDueDate?.toISOString(),
      notes,
    });
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      toast.error(result.error);
      return;
    }

    toast.success("پرداخت ثبت شد");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle>ثبت پرداخت</DialogTitle>
        <p className="mt-1 text-body text-foreground-secondary">مانده فعلی: {formatToman(remainingAmount)}</p>

        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 overflow-hidden rounded-medium border border-border">
            {(["cash", "cheque"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMethod(option)}
                className={cn(
                  "h-[52px] text-body-large font-medium transition-colors",
                  method === option ? "bg-primary text-primary-foreground" : "bg-surface text-foreground hover:bg-hover",
                )}
              >
                {option === "cash" ? "نقدی" : "چک"}
              </button>
            ))}
          </div>

          {method === "cash" ? (
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant={cashType === "deposit" ? "primary" : "secondary"} onClick={() => selectCashType("deposit")}>
                پیش‌پرداخت
              </Button>
              <Button
                type="button"
                variant={cashType === "remaining_balance" ? "primary" : "secondary"}
                onClick={() => selectCashType("remaining_balance")}
              >
                تسویه باقیمانده
              </Button>
              <Button
                type="button"
                variant={cashType === "full_payment" ? "success" : "secondary"}
                onClick={() => selectCashType("full_payment")}
              >
                تسویه کامل
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="شماره چک" htmlFor="chequeNumber" required error={fieldErrors.chequeNumber}>
                <Input
                  id="chequeNumber"
                  dir="ltr"
                  value={chequeNumber}
                  invalid={Boolean(fieldErrors.chequeNumber)}
                  onChange={(event) => setChequeNumber(event.target.value)}
                />
              </FormField>
              <FormField label="نام بانک" htmlFor="chequeBankName" required error={fieldErrors.chequeBankName}>
                <Input
                  id="chequeBankName"
                  value={chequeBankName}
                  invalid={Boolean(fieldErrors.chequeBankName)}
                  onChange={(event) => setChequeBankName(event.target.value)}
                />
              </FormField>
              <FormField label="تاریخ صدور" htmlFor="chequeIssueDate" error={fieldErrors.chequeIssueDate}>
                <DatePicker id="chequeIssueDate" value={chequeIssueDate} onChange={setChequeIssueDate} />
              </FormField>
              <FormField label="تاریخ سررسید" htmlFor="chequeDueDate" required error={fieldErrors.chequeDueDate}>
                <DatePicker id="chequeDueDate" value={chequeDueDate} onChange={setChequeDueDate} invalid={Boolean(fieldErrors.chequeDueDate)} />
              </FormField>
            </div>
          )}

          <FormField label="مبلغ" htmlFor="amount" required error={fieldErrors.amount}>
            <CurrencyInput id="amount" value={amount} onChange={setAmount} invalid={Boolean(fieldErrors.amount)} />
          </FormField>

          <FormField label="توضیحات (اختیاری)" htmlFor="paymentNotes">
            <Textarea id="paymentNotes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </FormField>

          <div className="flex flex-row-reverse gap-3">
            <Button type="button" loading={isSubmitting} onClick={handleSubmit}>
              ثبت پرداخت
            </Button>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
