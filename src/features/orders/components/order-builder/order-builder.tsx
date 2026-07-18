"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/providers/confirm-dialog-provider";
import { CustomerPicker, type CustomerPickerOption } from "@/features/customers";
import { convertDraftToPreInvoiceAction, saveDraftAction, updateOrderAction } from "@/features/orders/actions";
import { LiveSummaryBar } from "@/features/orders/components/order-builder/live-summary-bar";
import { OrderLinesReview } from "@/features/orders/components/order-builder/order-lines-review";
import { OrderProductGrid } from "@/features/orders/components/order-builder/order-product-grid";
import { computeTotals, useOrderBuilderStore, type BuilderLine } from "@/store/order-builder-store";

const AUTOSAVE_INTERVAL_MS = 4000;

export interface OrderBuilderInitialState {
  orderId: string;
  mode: "draft" | "versioned_edit";
  customer: { id: string; customerCode: string; name: string; mobile: string };
  lines: BuilderLine[];
  notes: string;
  customerNotes: string;
}

/**
 * The New Order orchestrator (SCREEN-SPECS.md §11): customer → product
 * grid → per-product quantity dialog → running review, with the live
 * summary and primary action in a sticky footer.
 *
 * Auto-save (draft mode only): a 4s interval persists the store whenever
 * it's dirty, so unexpected closure loses seconds, not the order — the
 * draft reappears in the order list. Versioned-edit mode (editing an
 * order that already has a pre-invoice) never auto-saves: each save there
 * creates a formal version, which must stay a deliberate act.
 */
export function OrderBuilder({
  initialState,
  canCreateCustomer = true,
}: {
  initialState: OrderBuilderInitialState | null;
  /** `customers:edit` — hides the picker's "quick create customer" affordance for roles restricted to the closed order-entry permission set (final-revision brief). */
  canCreateCustomer?: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const store = useOrderBuilderStore();
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [changeReason, setChangeReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hydrate the (external, non-React) store on mount: `initialState` comes
  // from the Server Component and is referentially stable for the life of
  // this page instance, so this effect runs exactly once per navigation.
  useEffect(() => {
    if (initialState) store.loadExisting(initialState);
    else store.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- store methods are stable zustand references
  }, [initialState]);

  const { mode, customer, notes, customerNotes, dirty } = store;

  // Auto-save loop — draft mode only (see component comment).
  useEffect(() => {
    if (mode !== "draft") return;
    const interval = setInterval(() => {
      const state = useOrderBuilderStore.getState();
      if (!state.dirty || state.saving || !state.customer) return;

      state.setSaving(true);
      void saveDraftAction({
        orderId: state.orderId,
        customerId: state.customer.id,
        items: Object.values(state.lines).map((line) => ({
          productPieceSizeId: line.productPieceSizeId,
          packQuantity: line.packQuantity,
          unitQuantity: line.unitQuantity,
        })),
        notes: state.notes,
        customerNotes: state.customerNotes,
      }).then((result) => {
        if (result.success) state.markSaved(result.data.orderId);
        else {
          state.setSaving(false);
          console.error("Auto-save failed:", result.error);
        }
      });
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [mode]);

  function handleCustomerSelected(option: CustomerPickerOption) {
    store.setCustomer({ id: option.id, customerCode: option.customerCode, name: option.name, mobile: option.mobile });
  }

  async function handleGeneratePreInvoice() {
    const state = useOrderBuilderStore.getState();
    if (!state.customer) {
      toast.error("ابتدا مشتری را انتخاب کنید");
      return;
    }
    const totals = computeTotals(state.lines);
    if (totals.totalUnits === 0) {
      toast.error("سفارش خالی است — حداقل یک قلم با تعداد اضافه کنید");
      return;
    }

    const confirmed = await confirm({
      title: "پیش‌فاکتور صادر شود؟",
      description: "پس از صدور، شماره سفارش اختصاص می‌یابد و هر تغییر بعدی نسخه جدیدی ثبت می‌کند.",
      variant: "confirmation",
      confirmLabel: "صدور پیش‌فاکتور",
    });
    if (!confirmed) return;

    setIsSubmitting(true);

    // Persist the latest state first, then convert.
    const saveResult = await saveDraftAction({
      orderId: state.orderId,
      customerId: state.customer.id,
      items: Object.values(state.lines).map((line) => ({
        productPieceSizeId: line.productPieceSizeId,
        packQuantity: line.packQuantity,
        unitQuantity: line.unitQuantity,
      })),
      notes: state.notes,
      customerNotes: state.customerNotes,
    });
    if (!saveResult.success) {
      setIsSubmitting(false);
      toast.error(saveResult.error);
      return;
    }

    const convertResult = await convertDraftToPreInvoiceAction(saveResult.data.orderId);
    setIsSubmitting(false);

    if (!convertResult.success) {
      toast.error(convertResult.error);
      return;
    }

    toast.success(`پیش‌فاکتور ${convertResult.data.orderNumber} صادر شد`);
    store.reset();
    router.push(`/orders/${saveResult.data.orderId}`);
  }

  async function handleVersionedSave() {
    const state = useOrderBuilderStore.getState();
    if (!state.orderId) return;

    setIsSubmitting(true);
    const result = await updateOrderAction({
      orderId: state.orderId,
      items: Object.values(state.lines).map((line) => ({
        productPieceSizeId: line.productPieceSizeId,
        packQuantity: line.packQuantity,
        unitQuantity: line.unitQuantity,
      })),
      notes: state.notes,
      customerNotes: state.customerNotes,
      changeReason,
    });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("سفارش ویرایش شد و نسخه قبلی در تاریخچه ثبت شد");
    const savedOrderId = state.orderId;
    store.reset();
    router.push(`/orders/${savedOrderId}`);
  }

  return (
    <div className="flex flex-col gap-6 pb-28">
      <Card>
        <h2 className="mb-3 text-h4 font-semibold text-foreground">مشتری</h2>
        {mode === "versioned_edit" && customer ? (
          <p className="text-body-large text-foreground">
            {customer.name}
            <span dir="ltr" className="ms-2 text-body-small text-muted-foreground">
              {customer.customerCode}
            </span>
          </p>
        ) : (
          <CustomerPicker
            value={customer ? { id: customer.id, customerCode: customer.customerCode, name: customer.name, mobile: customer.mobile } : null}
            onChange={handleCustomerSelected}
            canCreateCustomer={canCreateCustomer}
          />
        )}
      </Card>

      {customer ? (
        <>
          <Card>
            <h2 className="mb-3 text-h4 font-semibold text-foreground">محصولات — برای نمایش قطعه‌ها و سایزها لمس کنید</h2>
            <OrderProductGrid expandedProductId={expandedProductId} onExpandedChange={setExpandedProductId} />
          </Card>

          <Card>
            <h2 className="mb-3 text-h4 font-semibold text-foreground">اقلام سفارش</h2>
            <OrderLinesReview onEditProduct={(productId) => setExpandedProductId(productId)} />
          </Card>

          <Card className="grid gap-4 sm:grid-cols-2">
            <FormField label="یادداشت داخلی (فقط برای کارکنان)" htmlFor="notes">
              <Textarea id="notes" value={notes} onChange={(event) => store.setNotes(event.target.value)} />
            </FormField>
            <FormField label="یادداشت مشتری (روی پیش‌فاکتور چاپ می‌شود)" htmlFor="customerNotes">
              <Textarea id="customerNotes" value={customerNotes} onChange={(event) => store.setCustomerNotes(event.target.value)} />
            </FormField>
            {mode === "versioned_edit" ? (
              <FormField label="دلیل تغییر (اختیاری — در تاریخچه نسخه‌ها ثبت می‌شود)" htmlFor="changeReason" className="sm:col-span-2">
                <Textarea id="changeReason" value={changeReason} onChange={(event) => setChangeReason(event.target.value)} />
              </FormField>
            ) : null}
          </Card>
        </>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-6 py-3 shadow-[var(--shadow-elevation-3)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <LiveSummaryBar />
          {mode === "versioned_edit" ? (
            <Button type="button" loading={isSubmitting} disabled={!dirty && changeReason === ""} onClick={handleVersionedSave}>
              ذخیره تغییرات (نسخه جدید)
            </Button>
          ) : (
            <Button type="button" loading={isSubmitting} disabled={!customer} onClick={handleGeneratePreInvoice}>
              صدور پیش‌فاکتور
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
