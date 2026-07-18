"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useQuery } from "@tanstack/react-query";
import { Command as CommandPrimitive } from "cmdk";
import { ChevronDown, Plus, Search } from "lucide-react";
import { useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { createCustomerAction, getRecentCustomersAction, searchCustomersForPickerAction } from "@/features/customers/actions";
import { CustomerForm } from "@/features/customers/components/customer-form";
import type { CustomerPickerOption } from "@/features/customers/services";

export interface CustomerPickerProps {
  value: CustomerPickerOption | null;
  onChange: (customer: CustomerPickerOption) => void;
  disabled?: boolean;
  className?: string;
  /** `customers:edit` — warehouse staff may only search/select existing customers, never create new ones (final-revision brief's closed permission list). Defaults true so every other, pre-existing call site keeps working unmodified. */
  canCreateCustomer?: boolean;
}

/**
 * The customer-selection step of Order Creation (UX-FLOW.md), built now
 * as a standalone, reusable component ahead of Phase 13 so that phase has
 * a working picker to drop in rather than designing one under time
 * pressure. Recently-ordered/favorite customers show first with no query
 * typed (`getRecentCustomersAction`); typing searches name/mobile/code
 * (`searchCustomersForPickerAction`). "مشتری جدید" opens the exact
 * Quick Create overlay UX-FLOW.md specifies: `CustomerForm` in a `Dialog`,
 * closing and selecting the new customer on save — the order-building
 * screen that will eventually host this component is never navigated
 * away from.
 */
export function CustomerPicker({ value, onChange, disabled, className, canCreateCustomer = true }: CustomerPickerProps) {
  const [open, setOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);

  const { data: recentCustomers } = useQuery({
    queryKey: ["customers", "recent"],
    queryFn: async () => {
      const result = await getRecentCustomersAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: open && debouncedSearch === "",
  });

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ["customers", "picker-search", debouncedSearch],
    queryFn: async () => {
      const result = await searchCustomersForPickerAction(debouncedSearch);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: open && debouncedSearch !== "",
  });

  const options = debouncedSearch !== "" ? (searchResults ?? []) : (recentCustomers ?? []);

  function selectCustomer(customer: CustomerPickerOption) {
    onChange(customer);
    setOpen(false);
    setSearch("");
  }

  return (
    <>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-[52px] w-full items-center justify-between rounded-medium border border-border bg-surface px-4 text-body-large text-foreground disabled:bg-disabled",
              !value && "text-muted-foreground",
              className,
            )}
          >
            <span className="truncate">{value ? `${value.name} — ${toPersianDigits(value.mobile)}` : "انتخاب مشتری"}</span>
            <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-medium border border-border bg-surface shadow-[var(--shadow-elevation-3)]"
          >
            <CommandPrimitive shouldFilter={false} className="flex flex-col">
              <div className="flex items-center gap-2 border-b border-border px-3">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <CommandPrimitive.Input
                  autoFocus
                  value={search}
                  onValueChange={setSearch}
                  placeholder="جستجوی نام، موبایل یا کد مشتری..."
                  className="h-11 w-full bg-transparent text-body-large text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
                />
              </div>
              {canCreateCustomer ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setQuickCreateOpen(true);
                  }}
                  className="flex h-11 items-center gap-2 border-b border-border px-3 text-body-large font-medium text-primary hover:bg-primary-light"
                >
                  <Plus className="size-4" />
                  مشتری جدید
                </button>
              ) : null}
              <CommandPrimitive.List className="max-h-72 overflow-y-auto p-1">
                {isFetching ? (
                  <p className="px-3 py-6 text-center text-body text-muted-foreground">در حال جستجو...</p>
                ) : options.length === 0 ? (
                  <p className="px-3 py-6 text-center text-body text-muted-foreground">مشتری‌ای یافت نشد</p>
                ) : (
                  options.map((customer) => (
                    <CommandPrimitive.Item
                      key={customer.id}
                      value={customer.id}
                      onSelect={() => selectCustomer(customer)}
                      className="flex cursor-pointer items-center justify-between rounded-small px-3 py-2 text-body-large text-foreground data-[selected=true]:bg-hover"
                    >
                      <span className="flex flex-col">
                        <span>{customer.name}</span>
                        <span dir="ltr" className="text-body-small text-muted-foreground">
                          {toPersianDigits(customer.mobile)} · {customer.customerCode}
                        </span>
                      </span>
                    </CommandPrimitive.Item>
                  ))
                )}
              </CommandPrimitive.List>
            </CommandPrimitive>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      <Dialog open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
        <DialogContent>
          <DialogTitle>ثبت مشتری جدید</DialogTitle>
          <div className="mt-4">
            <CustomerForm
              submitLabel="ذخیره و انتخاب"
              onCancel={() => setQuickCreateOpen(false)}
              onSubmit={async (values) => {
                const result = await createCustomerAction(values);
                if (!result.success) return result;
                setQuickCreateOpen(false);
                toast.success("مشتری ثبت شد");
                onChange(result.data);
                return { success: true };
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
