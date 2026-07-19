import JSZip from "jszip";
import { NextResponse, type NextRequest } from "next/server";

import { requirePermission } from "@/lib/auth/session";
import { renderInvoicePdf } from "@/lib/pdf/render-invoice-pdf";
import { renderPdfPagesToPng } from "@/lib/pdf/pdf-to-images";
import { getInvoiceRenderData, recordImagesExported } from "@/features/invoices/services";

/**
 * "Download Images" export — every invoice page as a separate 300 DPI PNG.
 * Renders the same PDF the PDF export produces (same headless-Chromium
 * pass over the print page, same forwarded session cookies), then
 * rasterizes it page by page, so the images exactly match the printed
 * invoice. One page downloads as a bare PNG; multiple pages come zipped,
 * one numbered PNG per page.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await requirePermission("orders:view");
  const { orderId } = await params;

  const invoiceData = await getInvoiceRenderData(orderId);
  if (!invoiceData.success) {
    return NextResponse.json({ error: invoiceData.error }, { status: 404 });
  }

  const origin = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const invoiceUrl = `${origin}/print/invoice/${orderId}`;
  const cookies = request.cookies.getAll().map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: new URL(origin).hostname,
    path: "/",
  }));

  const rendered = await renderInvoicePdf(invoiceUrl, cookies);
  if (!rendered.success) {
    return NextResponse.json({ error: rendered.error }, { status: 500 });
  }

  let pages: Buffer[];
  try {
    pages = await renderPdfPagesToPng(rendered.pdf);
  } catch (error) {
    console.error("Invoice PNG render failed:", error);
    return NextResponse.json({ error: "تولید تصویر پیش‌فاکتور با خطا مواجه شد. دوباره تلاش کنید." }, { status: 500 });
  }

  const orderNumber = invoiceData.data.orderNumber;
  await recordImagesExported(orderId, session.user.id, pages.length);

  const [firstPage] = pages;
  if (pages.length === 1 && firstPage) {
    return new NextResponse(new Uint8Array(firstPage), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${orderNumber}.png"`,
      },
    });
  }

  const zip = new JSZip();
  pages.forEach((png, index) => {
    zip.file(`${orderNumber}-page-${String(index + 1).padStart(2, "0")}.png`, png);
  });
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${orderNumber}-images.zip"`,
    },
  });
}
