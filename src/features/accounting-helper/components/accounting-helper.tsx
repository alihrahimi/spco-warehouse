"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileDown,
  Image as ImageIcon,
  Package,
  Printer,
  Trash2,
} from "lucide-react";
import NextImage from "next/image";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import { toast } from "@/components/ui/toast";
import { formatJalaliLong } from "@/lib/format/date";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { getPieceColor } from "@/lib/product/piece-colors";
import { getProductForAccountingAction, searchProductsForAccountingAction } from "@/features/products";
import { AccountingSizeRow } from "@/features/accounting-helper/components/accounting-size-row";

interface LineItemEntry {
  accountingCode: string;
  quantity: number;
  productName: string;
  pieceName: string;
  sizeLabel: string;
}

/**
 * Fully client-side by design (Accounting Helper brief: "completely
 * independent from Orders, Pre-Invoices and Warehouse operations", no
 * mention of saving/listing past sheets). Only the price/pack-size/
 * accounting-code edits are persisted (through the same Products actions
 * Product Details uses); the invoice header and quantities exist only in
 * this page's state until exported. Reads flow through the Products
 * module (single source of truth); nothing about Orders is touched.
 *
 * Redesigned flow: pick ONE product, see every piece and every size for
 * it at once (matching the Product Details pricing screen exactly — same
 * data, same `upsertPieceSizeAction`/`updateAccountingCodeAction`), edit
 * Accounting Code / Package Size / Unit Price and type a Quantity directly
 * in the grid — no more cascading Design→Piece→Size dropdowns repeated
 * per row. The selected product stays selected across every save; only
 * picking a different product in the Autocomplete changes it. Quantities
 * accumulate in a cross-product map, so switching products to work on a
 * second item never loses what was already entered for the first.
 */
export function AccountingHelper() {
  const queryClient = useQueryClient();

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(new Date());
  const [description, setDescription] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [collapsedPieceIds, setCollapsedPieceIds] = useState<Set<string>>(new Set());

  /** Keyed by `productPieceSizeId` — survives switching products, so "repeat until the invoice is complete" works across many products, not just the one currently open. */
  const [lineItems, setLineItems] = useState<Record<string, LineItemEntry>>({});

  const sheetRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Loaded once, unfiltered — the Autocomplete below does its own
  // client-side fuzzy search over this list (see the service function's
  // comment for why that beats a per-keystroke server round-trip here).
  const { data: productOptions } = useQuery({
    queryKey: ["accounting-helper", "product-list"],
    queryFn: async () => {
      const result = await searchProductsForAccountingAction("");
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60_000,
  });

  const productQueryKey = ["accounting-helper", "product-detail", selectedProductId] as const;
  const {
    data: product,
    isFetching: isLoadingProduct,
    isError: productLoadFailed,
  } = useQuery({
    queryKey: productQueryKey,
    queryFn: async () => {
      const result = await getProductForAccountingAction(selectedProductId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: selectedProductId !== "",
  });

  function handleSelectProduct(productId: string) {
    setSelectedProductId(productId);
    setCollapsedPieceIds(new Set()); // every piece starts expanded for a newly opened product
  }

  /** After any successful price/pack-size/code save — a first-time price save creates a brand-new `productPieceSizeId` server-side that the row can't know until this refetch lands. No manual refresh needed: React Query swaps the fresh data in as soon as it arrives. */
  function refetchProduct() {
    queryClient.invalidateQueries({ queryKey: productQueryKey });
  }

  function togglePieceCollapsed(pieceId: string) {
    setCollapsedPieceIds((current) => {
      const next = new Set(current);
      if (next.has(pieceId)) next.delete(pieceId);
      else next.add(pieceId);
      return next;
    });
  }

  function handleQuantityChange(pieceName: string, sizeLabel: string, productPieceSizeId: string, accountingCode: string | null, quantity: number | "") {
    const qty = quantity === "" ? 0 : quantity;

    setLineItems((current) => {
      const next = { ...current };
      if (qty <= 0) {
        delete next[productPieceSizeId];
        return next;
      }
      if (!accountingCode || !product) return current;
      next[productPieceSizeId] = { accountingCode, quantity: qty, productName: product.name, pieceName, sizeLabel };
      return next;
    });
  }

  function handleRemoveLineItem(productPieceSizeId: string) {
    setLineItems((current) => {
      const next = { ...current };
      delete next[productPieceSizeId];
      return next;
    });
  }

  const lineItemEntries = useMemo(() => Object.entries(lineItems), [lineItems]);

  /** The actual "Accounting Entry Sheet" content — grouped by code so a code reused across two variants becomes one summed row, matching what an external accounting system expects to receive per code. */
  const codeRows = useMemo(() => {
    const totals = new Map<string, number>();
    for (const [, item] of lineItemEntries) {
      totals.set(item.accountingCode, (totals.get(item.accountingCode) ?? 0) + item.quantity);
    }
    return Array.from(totals.entries()).map(([accountingCode, totalQuantity]) => ({ accountingCode, totalQuantity }));
  }, [lineItemEntries]);

  function validateBeforeExport(): boolean {
    if (lineItemEntries.length === 0) {
      toast.error("حداقل یک قلم اضافه کنید");
      return false;
    }
    if (invoiceNumber.trim() === "") {
      toast.error("شماره فاکتور را وارد کنید");
      return false;
    }
    if (customerName.trim() === "") {
      toast.error("نام مشتری را وارد کنید");
      return false;
    }
    return true;
  }

  async function exportAsPng() {
    if (!validateBeforeExport() || !sheetRef.current) return;
    setIsExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(sheetRef.current, { scale: 3, backgroundColor: "#ffffff" });
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("تولید تصویر ناموفق بود");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `accounting-${invoiceNumber.trim() || "sheet"}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("تولید تصویر با خطا مواجه شد");
    } finally {
      setIsExporting(false);
    }
  }

  async function exportAsPdf() {
    if (!validateBeforeExport() || !sheetRef.current) return;
    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      // scale: 2 (not the PNG export's 3) — still sharp at A4 print size,
      // but keeps the embedded raster (and therefore the .pdf file) far
      // smaller, since this is meant to be emailed/shared. Stays PNG
      // (lossless): JPEG's compression artifacts show up as fuzzy edges on
      // exactly the kind of sharp black-on-white text/lines this sheet is.
      const canvas = await html2canvas(sheetRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imageData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const imageWidthMm = pageWidth - margin * 2;
      const imageHeightMm = (canvas.height / canvas.width) * imageWidthMm;

      pdf.addImage(imageData, "PNG", margin, margin, imageWidthMm, imageHeightMm);
      pdf.save(`accounting-${invoiceNumber.trim() || "sheet"}.pdf`);
    } catch {
      toast.error("تولید PDF با خطا مواجه شد");
    } finally {
      setIsExporting(false);
    }
  }

  function handlePrint() {
    if (!validateBeforeExport()) return;
    window.print();
  }

  const productSelectOptions = (productOptions ?? []).map((p) => ({ value: p.id, label: p.name, description: p.productCode }));

  return (
    <div className="flex flex-col gap-6">
      {/* Everything except the final sheet is app chrome for BUILDING the entry — never printed (dashboard shell already hides TopNav on print; this hides the forms/table too, per Tailwind's print: variant, the same pattern used throughout the app). */}
      <div className="flex flex-col gap-6 print:hidden">
        <Card>
          <h2 className="mb-4 text-h4 font-semibold text-foreground">اطلاعات فاکتور</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="شماره فاکتور" htmlFor="invoice-number">
              <Input id="invoice-number" value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder="مثال: 2548" />
            </FormField>
            <FormField label="نام مشتری" htmlFor="customer-name">
              <Input id="customer-name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="نام مشتری یا فروشگاه" />
            </FormField>
            <FormField label="تاریخ فاکتور" htmlFor="invoice-date">
              <DatePicker id="invoice-date" value={invoiceDate} onChange={setInvoiceDate} />
            </FormField>
            <FormField label="توضیحات (اختیاری)" htmlFor="description">
              <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} rows={1} />
            </FormField>
          </div>
        </Card>

        <Card>
          <FormField label="طرح" htmlFor="design-select">
            <Autocomplete
              id="design-select"
              options={productSelectOptions}
              value={selectedProductId}
              onValueChange={handleSelectProduct}
              placeholder="جستجوی طرح..."
              searchPlaceholder="نام یا کد طرح..."
              className="max-w-md"
            />
          </FormField>

          {selectedProductId === "" ? (
            <EmptyState
              icon={Package}
              title="ابتدا یک طرح انتخاب کنید"
              description="پس از انتخاب، همه قطعه‌ها و سایزهای آن طرح یکجا نمایش داده می‌شود."
              className="py-10"
            />
          ) : isLoadingProduct && !product ? (
            <p className="py-10 text-center text-body text-muted-foreground">در حال بارگذاری...</p>
          ) : productLoadFailed || !product ? (
            <EmptyState icon={Package} title="این طرح یافت نشد" description="ممکن است حذف شده باشد. طرح دیگری انتخاب کنید." className="py-10" />
          ) : (
            <div className="mt-4 rounded-large border border-border">
              {/*
               * No `overflow-hidden` on this wrapper: it would clip the
               * sticky positioning context for the strip/headers below,
               * silently turning "sticky" into "just scrolls away" — the
               * one thing this whole section exists to avoid. Square
               * corners here are the trade-off; rounding is kept on the
               * wrapper's border instead via each end's own rounding below.
               */}
              {/* Always-visible "current product" strip — stays pinned above every piece's own sticky header, so scrolling through a large product never loses track of which design is open. */}
              <div className="sticky top-0 z-20 flex h-10 items-center gap-2 rounded-t-large border-b border-border bg-surface px-3 text-body-small font-medium text-foreground">
                <div className="relative size-7 shrink-0 overflow-hidden rounded-full border border-border bg-disabled">
                  {product.imageFilePath ? (
                    // unoptimized: /uploads/* is auth-protected, which breaks the
                    // cookie-less /_next/image optimizer fetch — see invoice-view.tsx.
                    <NextImage src={product.imageFilePath} alt="" fill sizes="28px" unoptimized className="object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Package className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <span className="truncate">{product.name}</span>
                <span dir="ltr" className="text-caption text-muted-foreground">
                  {product.productCode}
                </span>
              </div>

              {product.pieces.length === 0 ? (
                <p className="p-6 text-center text-body text-muted-foreground">این محصول هنوز قطعه‌ای ندارد.</p>
              ) : (
                product.pieces.map((piece) => {
                  const color = getPieceColor(piece.name);
                  const isCollapsed = collapsedPieceIds.has(piece.id);
                  const missingCount = piece.sizes.filter((size) => !size.accountingCode).length;

                  return (
                    <div key={piece.id}>
                      {/* Sticky piece header — pinned at top-10 (right below the product strip) while its sizes scroll past; the next piece's header takes over automatically once its section reaches that same offset, per normal CSS sticky stacking. */}
                      <button
                        type="button"
                        onClick={() => togglePieceCollapsed(piece.id)}
                        className={`sticky top-10 z-10 flex w-full items-center gap-2 border-b border-t px-3 py-2.5 text-start ${color.bg} ${color.border}`}
                      >
                        <span className={`size-2.5 shrink-0 rounded-full ${color.dot}`} aria-hidden="true" />
                        <span className={`text-body-large font-semibold ${color.text}`}>{piece.name}</span>
                        <span className="text-caption text-muted-foreground">({toPersianDigits(piece.sizes.length)} سایز)</span>
                        {missingCount > 0 ? (
                          <span className="text-caption text-warning">{toPersianDigits(missingCount)} بدون کد</span>
                        ) : null}
                        <span className="flex-1" />
                        {isCollapsed ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronUp className="size-4 text-muted-foreground" />}
                      </button>

                      {isCollapsed ? null : (
                        <div className="divide-y divide-divider bg-surface">
                          {/* Column labels — desktop only; each row repeats its own labels below `sm` (AccountingSizeRow), same split as SizePriceRow. */}
                          <div className="hidden gap-x-3 border-b border-divider px-3 py-2 text-body-small text-foreground-secondary sm:grid sm:grid-cols-[3.5rem_1fr_1fr_1fr_1fr]">
                            <span>سایز</span>
                            <span>قیمت (تومان)</span>
                            <span>سایز بسته</span>
                            <span>کد حسابداری</span>
                            <span>تعداد (این فاکتور)</span>
                          </div>
                          {piece.sizes.map((size) => (
                            <AccountingSizeRow
                              key={size.sizeId}
                              pieceId={piece.id}
                              productId={product.id}
                              data={size}
                              fallbackPackSize={6}
                              quantity={size.productPieceSizeId ? (lineItems[size.productPieceSizeId]?.quantity ?? "") : ""}
                              onQuantityChange={(value) =>
                                size.productPieceSizeId &&
                                handleQuantityChange(piece.name, size.sizeLabel, size.productPieceSizeId, size.accountingCode, value)
                              }
                              onSaved={refetchProduct}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-h4 font-semibold text-foreground">اقلام فاکتور</h2>
          {lineItemEntries.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="هنوز قلمی اضافه نشده"
              description="در جدول بالا، برای هر سایز موردنظر یک تعداد وارد کنید — بدون نیاز به دکمه جداگانه."
            />
          ) : (
            <div className="flex flex-col divide-y divide-divider">
              {lineItemEntries.map(([productPieceSizeId, item]) => (
                <div key={productPieceSizeId} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-body font-medium text-foreground">
                      {item.productName} — {item.pieceName} — سایز {toPersianDigits(item.sizeLabel)}
                    </p>
                    <p dir="ltr" className="text-body-small text-muted-foreground">
                      کد: {item.accountingCode} · تعداد: {toPersianDigits(item.quantity)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="حذف قلم"
                    onClick={() => handleRemoveLineItem(productPieceSizeId)}
                    className="flex size-9 shrink-0 items-center justify-center rounded-small text-danger hover:bg-danger-light"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="outline" loading={isExporting} onClick={exportAsPng}>
            <ImageIcon className="size-4" />
            دانلود PNG
          </Button>
          <Button type="button" variant="outline" loading={isExporting} onClick={exportAsPdf}>
            <FileDown className="size-4" />
            دانلود PDF
          </Button>
          <Button type="button" onClick={handlePrint}>
            <Printer className="size-4" />
            چاپ
          </Button>
        </Card>
      </div>

      {/* The clean, exportable entry sheet — the ONLY thing print/PNG/PDF ever show. Live preview: always rendered, updates as items are added. */}
      <style>{"@media print { @page { size: A4; margin: 15mm; } }"}</style>
      <div
        ref={sheetRef}
        className="mx-auto w-full max-w-2xl rounded-large border border-border bg-white p-10 text-[#1f2328] print:max-w-none print:rounded-none print:border-0 print:p-0"
      >
        <h1 className="text-h2 font-bold">فاکتور شماره {invoiceNumber ? toPersianDigits(invoiceNumber) : "—"}</h1>
        <div className="mt-4 flex flex-col gap-1 text-body-large">
          <p>
            <span className="font-semibold">مشتری:</span> {customerName || "—"}
          </p>
          <p>
            <span className="font-semibold">تاریخ:</span> {invoiceDate ? formatJalaliLong(invoiceDate) : "—"}
          </p>
          {description ? (
            <p>
              <span className="font-semibold">توضیحات:</span> {description}
            </p>
          ) : null}
        </div>

        <div className="mt-6 border-t-2 border-[#1f2328] pt-4">
          {codeRows.length === 0 ? (
            <p className="text-body-large text-muted-foreground">هنوز قلمی اضافه نشده است.</p>
          ) : (
            // Two equal `flex-1` columns both right-aligned their own
            // content to their own box edge, which for the LEFT box is the
            // shared boundary in the row's MIDDLE — the two values ended up
            // glued together instead of spread across the row. `justify-
            // between` with no fixed widths (the same pattern InvoiceView
            // already uses for its totals rows) anchors the first child to
            // the row's outer start edge and the second to its outer end
            // edge directly, regardless of content width.
            <div className="text-h4">
              <div className="flex justify-between border-b-2 border-[#1f2328] pb-2 font-bold">
                <span>کد حسابداری</span>
                <span>تعداد</span>
              </div>
              {codeRows.map((row) => (
                <div key={row.accountingCode} className="flex justify-between border-b border-[#c9c9c9] py-2">
                  <span className="font-semibold">{row.accountingCode}</span>
                  <span>{toPersianDigits(row.totalQuantity)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
