"use client";

import { Download, Images, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { recordInvoicePrintedAction } from "@/features/orders/actions";

/**
 * Hidden in print output (`print:hidden`). Direct print goes through the
 * browser's native dialog; the audit event fires first so "Invoice
 * Printed" is recorded even if the user cancels the dialog — recording an
 * intent-to-print is the honest available signal, since the browser never
 * reports whether printing actually happened.
 */
export function PrintToolbar({ orderId }: { orderId: string }) {
  async function handlePrint() {
    void recordInvoicePrintedAction(orderId);
    window.print();
  }

  return (
    <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-end gap-3 p-4 print:hidden">
      <Button asChild variant="outline">
        <a href={`/api/orders/${orderId}/invoice/images`} download>
          <Images className="size-4" />
          دانلود تصاویر
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href={`/api/orders/${orderId}/invoice`} download>
          <Download className="size-4" />
          دانلود PDF
        </a>
      </Button>
      <Button type="button" onClick={handlePrint}>
        <Printer className="size-4" />
        چاپ
      </Button>
    </div>
  );
}
