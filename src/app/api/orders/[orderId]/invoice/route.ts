import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

import { requirePermission } from "@/lib/auth/session";
import { renderInvoicePdf } from "@/lib/pdf/render-invoice-pdf";
import { getInvoiceRenderData, recordPdfExported } from "@/features/invoices/services";

/**
 * PDF export — one of the few sanctioned Route Handlers (binary response;
 * FRONTEND-ARCHITECTURE.md §10). Drives the auth-protected print page
 * through headless Chromium with this request's own session cookies, so
 * the export renders exactly what the requesting user sees on screen.
 * Each export is also persisted under /uploads/invoices (immutable UUID
 * filename, same StorageProvider rule as every upload) and stamped on the
 * InvoiceDocument row + audit log.
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

  const filename = `${randomUUID()}.pdf`;
  const targetDirectory = path.join(process.cwd(), "public", "uploads", "invoices");
  await mkdir(targetDirectory, { recursive: true });
  await writeFile(path.join(targetDirectory, filename), rendered.pdf);
  await recordPdfExported(orderId, session.user.id, `/uploads/invoices/${filename}`);

  return new NextResponse(new Uint8Array(rendered.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceData.data.orderNumber}.pdf"`,
    },
  });
}
