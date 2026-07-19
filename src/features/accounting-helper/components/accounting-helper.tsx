"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardList, FileDown, Image as ImageIcon, Plus, Printer, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { FormField, Input, NumberInput, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Autocomplete } from "@/components/ui/autocomplete";
import { toast } from "@/components/ui/toast";
import { formatJalaliLong } from "@/lib/format/date";
import { toPersianDigits } from "@/lib/format/persian-digits";
import { getProductForAccountingAction, searchProductsForAccountingAction } from "@/features/products";

interface LineItem {
  /** Doubles as the merge key: adding the same variant twice sums quantity into one line instead of duplicating it. */
  productPieceSizeId: string;
  accountingCode: string;
  quantity: number;
  productName: string;
  pieceName: string;
  sizeLabel: string;
}

/**
 * Fully client-side by design (Accounting Helper brief: "completely
 * independent from Orders, Pre-Invoices and Warehouse operations", no
 * mention of saving/listing past sheets). Nothing here is persisted —
 * the entry sheet exists only in this page's state until exported. Reads
 * flow through the Products module (single source of truth for
 * Design/Piece/Size/Accounting Code); nothing about Orders is touched.
 */
export function AccountingHelper() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(new Date());
  const [description, setDescription] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedPieceId, setSelectedPieceId] = useState("");
  const [selectedPieceSizeId, setSelectedPieceSizeId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");

  const [lineItems, setLineItems] = useState<LineItem[]>([]);

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

  const { data: selectedProduct, isFetching: isLoadingProduct } = useQuery({
    queryKey: ["accounting-helper", "product-detail", selectedProductId],
    queryFn: async () => {
      const result = await getProductForAccountingAction(selectedProductId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: selectedProductId !== "",
  });

  const selectedPiece = selectedProduct?.pieces.find((piece) => piece.id === selectedPieceId) ?? null;
  const selectedSize = selectedPiece?.sizes.find((size) => size.productPieceSizeId === selectedPieceSizeId) ?? null;

  function handleSelectProduct(productId: string) {
    setSelectedProductId(productId);
    setSelectedPieceId("");
    setSelectedPieceSizeId("");
  }

  function handleSelectPiece(pieceId: string) {
    setSelectedPieceId(pieceId);
    setSelectedPieceSizeId("");
  }

  function handleAddItem() {
    if (!selectedProduct || !selectedPiece || !selectedSize) {
      toast.error("طرح، قطعه و سایز را انتخاب کنید");
      return;
    }
    if (quantity === "" || quantity <= 0) {
      toast.error("تعداد را وارد کنید");
      return;
    }
    if (!selectedSize.accountingCode) {
      toast.error("برای این ترکیب هنوز کد حسابداری تعریف نشده — از صفحه محصولات وارد کنید");
      return;
    }

    const code = selectedSize.accountingCode;
    const pieceSizeId = selectedSize.productPieceSizeId;
    const addedQuantity = quantity;

    setLineItems((current) => {
      const existingIndex = current.findIndex((item) => item.productPieceSizeId === pieceSizeId);
      if (existingIndex !== -1) {
        const next = [...current];
        const existing = next[existingIndex];
        if (existing) next[existingIndex] = { ...existing, quantity: existing.quantity + addedQuantity };
        return next;
      }
      return [
        ...current,
        {
          productPieceSizeId: pieceSizeId,
          accountingCode: code,
          quantity: addedQuantity,
          productName: selectedProduct.name,
          pieceName: selectedPiece.name,
          sizeLabel: selectedSize.sizeLabel,
        },
      ];
    });
    setQuantity("");
  }

  function handleRemoveItem(pieceSizeId: string) {
    setLineItems((current) => current.filter((item) => item.productPieceSizeId !== pieceSizeId));
  }

  /** The actual "Accounting Entry Sheet" content — grouped by code so a code reused across two variants becomes one summed row, matching what an external accounting system expects to receive per code. */
  const codeRows = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of lineItems) {
      totals.set(item.accountingCode, (totals.get(item.accountingCode) ?? 0) + item.quantity);
    }
    return Array.from(totals.entries()).map(([accountingCode, totalQuantity]) => ({ accountingCode, totalQuantity }));
  }, [lineItems]);

  function validateBeforeExport(): boolean {
    if (lineItems.length === 0) {
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

  const productSelectOptions = (productOptions ?? []).map((product) => ({
    value: product.id,
    label: product.name,
    description: product.productCode,
  }));
  const pieceSelectOptions = (selectedProduct?.pieces ?? []).map((piece) => ({ value: piece.id, label: piece.name }));
  const sizeSelectOptions = (selectedPiece?.sizes ?? []).map((size) => ({
    value: size.productPieceSizeId,
    label: `سایز ${toPersianDigits(size.sizeLabel)}${size.accountingCode ? "" : " (بدون کد حسابداری)"}`,
  }));

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
          <h2 className="mb-4 text-h4 font-semibold text-foreground">افزودن قلم</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] lg:items-end">
            <FormField label="طرح" htmlFor="design-select">
              <Autocomplete
                options={productSelectOptions}
                value={selectedProductId}
                onValueChange={handleSelectProduct}
                placeholder="جستجوی طرح..."
                searchPlaceholder="نام یا کد طرح..."
              />
            </FormField>
            <FormField label="قطعه" htmlFor="piece-select">
              <Select
                id="piece-select"
                options={pieceSelectOptions}
                value={selectedPieceId}
                onValueChange={handleSelectPiece}
                disabled={!selectedProduct}
                placeholder={isLoadingProduct ? "در حال بارگذاری..." : "انتخاب قطعه"}
              />
            </FormField>
            <FormField label="سایز" htmlFor="size-select">
              <Select
                id="size-select"
                options={sizeSelectOptions}
                value={selectedPieceSizeId}
                onValueChange={setSelectedPieceSizeId}
                disabled={!selectedPiece}
                placeholder="انتخاب سایز"
              />
            </FormField>
            <FormField label="تعداد" htmlFor="quantity">
              <NumberInput
                id="quantity"
                aria-label="تعداد"
                value={quantity}
                onChange={setQuantity}
                min={1}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddItem();
                  }
                }}
              />
            </FormField>
            <Button type="button" onClick={handleAddItem}>
              <Plus className="size-4" />
              افزودن قلم
            </Button>
          </div>
          {selectedPieceSizeId && selectedSize && !selectedSize.accountingCode ? (
            <p className="mt-3 text-body-small text-danger">
              برای این ترکیب کد حسابداری تعریف نشده است — از صفحه محصولات، در ردیف این سایز، کد را ثبت کنید.
            </p>
          ) : null}
        </Card>

        <Card>
          <h2 className="mb-4 text-h4 font-semibold text-foreground">اقلام ثبت‌شده</h2>
          {lineItems.length === 0 ? (
            <EmptyState icon={ClipboardList} title="هنوز قلمی اضافه نشده" description="طرح، قطعه، سایز و تعداد را انتخاب کنید و «افزودن قلم» را بزنید." />
          ) : (
            <div className="flex flex-col divide-y divide-divider">
              {lineItems.map((item) => (
                <div key={item.productPieceSizeId} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
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
                    onClick={() => handleRemoveItem(item.productPieceSizeId)}
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
