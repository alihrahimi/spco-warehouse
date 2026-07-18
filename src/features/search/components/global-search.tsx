"use client";

import { useQuery } from "@tanstack/react-query";
import { Command as CommandPrimitive } from "cmdk";
import { ClipboardList, CreditCard, Package, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { formatToman } from "@/lib/format/currency";
import { globalSearchAction } from "@/features/search/actions";

/**
 * Global search (Phase 14): a cmdk palette in the TopNav, opened by tap or
 * Ctrl/⌘+K, searching customers/products/orders(=invoices)/payments and
 * navigating straight to the hit. Results render grouped with Persian
 * headings; selection is fully keyboard-driven (cmdk's arrow/Enter
 * handling), satisfying the keyboard-navigation accessibility requirement
 * for the desktop secondary target.
 */
export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: () => globalSearchAction(debouncedQuery),
    enabled: open && debouncedQuery.trim().length >= 2,
  });

  function go(path: string) {
    setOpen(false);
    setQuery("");
    router.push(path as Route);
  }

  const hasResults =
    data && (data.customers.length > 0 || data.products.length > 0 || data.orders.length > 0 || data.payments.length > 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="جستجوی کلی"
        className="flex h-11 items-center gap-2 rounded-medium border border-border bg-surface px-3 text-body-small text-muted-foreground hover:bg-hover"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">جستجو...</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[20%] translate-y-0 p-0">
          <DialogTitle className="sr-only">جستجوی کلی</DialogTitle>
          <CommandPrimitive shouldFilter={false} className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <CommandPrimitive.Input
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder="جستجوی مشتری، محصول، سفارش یا شماره چک..."
                className="h-14 w-full bg-transparent text-body-large text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
              />
            </div>
            <CommandPrimitive.List className="max-h-96 overflow-y-auto p-2">
              {debouncedQuery.trim().length < 2 ? (
                <p className="px-3 py-8 text-center text-body-small text-muted-foreground">حداقل دو حرف تایپ کنید.</p>
              ) : isFetching ? (
                <p className="px-3 py-8 text-center text-body-small text-muted-foreground">در حال جستجو...</p>
              ) : !hasResults ? (
                <p className="px-3 py-8 text-center text-body-small text-muted-foreground">نتیجه‌ای یافت نشد.</p>
              ) : (
                <>
                  {data.customers.length > 0 ? (
                    <CommandPrimitive.Group heading="مشتریان" className="mb-2 text-body-small text-foreground-secondary [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium">
                      {data.customers.map((customer) => (
                        <CommandPrimitive.Item
                          key={customer.id}
                          value={`customer-${customer.id}`}
                          onSelect={() => go(`/customers/${customer.id}`)}
                          className="flex cursor-pointer items-center gap-2 rounded-small px-3 py-2.5 text-body text-foreground data-[selected=true]:bg-hover"
                        >
                          <Users className="size-4 shrink-0 text-muted-foreground" />
                          {customer.name}
                          <span dir="ltr" className="ms-auto text-caption text-muted-foreground">
                            {toPersianDigits(customer.mobile)} · {customer.customerCode}
                          </span>
                        </CommandPrimitive.Item>
                      ))}
                    </CommandPrimitive.Group>
                  ) : null}

                  {data.products.length > 0 ? (
                    <CommandPrimitive.Group heading="محصولات" className="mb-2 text-body-small text-foreground-secondary [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium">
                      {data.products.map((product) => (
                        <CommandPrimitive.Item
                          key={product.id}
                          value={`product-${product.id}`}
                          onSelect={() => go(`/products/${product.id}`)}
                          className="flex cursor-pointer items-center gap-2 rounded-small px-3 py-2.5 text-body text-foreground data-[selected=true]:bg-hover"
                        >
                          <Package className="size-4 shrink-0 text-muted-foreground" />
                          {product.name}
                          <span dir="ltr" className="ms-auto text-caption text-muted-foreground">
                            {product.productCode}
                          </span>
                        </CommandPrimitive.Item>
                      ))}
                    </CommandPrimitive.Group>
                  ) : null}

                  {data.orders.length > 0 ? (
                    <CommandPrimitive.Group heading="سفارش‌ها و پیش‌فاکتورها" className="mb-2 text-body-small text-foreground-secondary [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium">
                      {data.orders.map((order) => (
                        <CommandPrimitive.Item
                          key={order.id}
                          value={`order-${order.id}`}
                          onSelect={() => go(`/orders/${order.id}`)}
                          className="flex cursor-pointer items-center gap-2 rounded-small px-3 py-2.5 text-body text-foreground data-[selected=true]:bg-hover"
                        >
                          <ClipboardList className="size-4 shrink-0 text-muted-foreground" />
                          <span dir="ltr">{order.orderNumber ?? "پیش‌نویس"}</span>
                          <span className="ms-auto text-caption text-muted-foreground">{order.customerName}</span>
                        </CommandPrimitive.Item>
                      ))}
                    </CommandPrimitive.Group>
                  ) : null}

                  {data.payments.length > 0 ? (
                    <CommandPrimitive.Group heading="پرداخت‌ها (شماره چک)" className="text-body-small text-foreground-secondary [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium">
                      {data.payments.map((payment) => (
                        <CommandPrimitive.Item
                          key={payment.id}
                          value={`payment-${payment.id}`}
                          onSelect={() => go(`/orders/${payment.orderId}`)}
                          className="flex cursor-pointer items-center gap-2 rounded-small px-3 py-2.5 text-body text-foreground data-[selected=true]:bg-hover"
                        >
                          <CreditCard className="size-4 shrink-0 text-muted-foreground" />
                          <span dir="ltr">چک {payment.chequeNumber}</span>
                          <span className="ms-auto text-caption text-muted-foreground">
                            {formatToman(BigInt(payment.amount))} · {payment.orderNumber ?? "—"}
                          </span>
                        </CommandPrimitive.Item>
                      ))}
                    </CommandPrimitive.Group>
                  ) : null}
                </>
              )}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </DialogContent>
      </Dialog>
    </>
  );
}
