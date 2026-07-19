import { notFound } from "next/navigation";

import { requirePermission } from "@/lib/auth/session";
import { getInvoiceRenderData } from "@/features/invoices/services";
import { InvoiceScaler } from "@/features/invoices/components/invoice-scaler";
import { InvoiceView } from "@/features/invoices/components/invoice-view";
import { PrintToolbar } from "@/features/invoices/components/print-toolbar";

interface InvoicePrintPageProps {
  params: Promise<{ orderId: string }>;
}

/**
 * The pre-invoice document, at its own chrome-free route (outside the
 * dashboard layout — nothing but the document prints). Auth still applies
 * via proxy.ts, which is also what lets the PDF exporter drive this exact
 * page with a forwarded session cookie.
 *
 * A4 print rules per DESIGN-SYSTEM.md §18: 15mm margins, item rows never
 * split across pages, the column header row repeats on every page (native
 * `thead` behavior), and the totals block stays whole on the final page.
 * Page numbers: the PDF export stamps them via its footer template; direct
 * browser printing leaves them to the browser's own print footer.
 */
export default async function InvoicePrintPage({ params }: InvoicePrintPageProps) {
  await requirePermission("orders:view");
  const { orderId } = await params;

  const result = await getInvoiceRenderData(orderId);
  if (!result.success) notFound();

  return (
    <div className="min-h-screen bg-[#e8e8e8] print:bg-white">
      <PrintToolbar orderId={orderId} />
      <style>{`
        .invoice-page { width: 210mm; min-height: 297mm; padding: 15mm; box-shadow: 0 2px 12px rgba(0,0,0,.15); }
        .invoice-items th, .invoice-items td { border: 1px solid #c9c9c9; padding: 4pt 6pt; text-align: right; }
        .invoice-items thead th { background: #f2f2f0; font-weight: 700; }
        .invoice-items tr { break-inside: avoid; }
        .invoice-totals, .invoice-footer { break-inside: avoid; }
        @page { size: A4; margin: 15mm; }
        @media print {
          .invoice-page { width: auto; min-height: auto; padding: 0; box-shadow: none; }
          /* !important so the reset beats the scaler's inline on-screen zoom. */
          .invoice-scaler { zoom: 1 !important; }
        }
      `}</style>
      <InvoiceScaler>
        <InvoiceView data={result.data} />
      </InvoiceScaler>
    </div>
  );
}
