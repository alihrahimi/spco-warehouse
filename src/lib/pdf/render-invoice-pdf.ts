import { chromium } from "playwright";

/**
 * Renders the invoice PRINT PAGE (the single source of invoice markup) to
 * an A4 PDF via headless Chromium — the Phase 01-approved approach, and
 * the only reliable way to get correct Persian glyph shaping in a PDF.
 * The caller's session cookies are forwarded so the (auth-protected) page
 * renders for the same user requesting the export.
 *
 * Page numbers ride in the footer template on every page (Phase 13's
 * automatic page numbers); Chromium's header/footer templates only emit
 * Latin digits for pageNumber/totalPages — the label is Persian, the
 * digits Latin, a documented engine limitation rather than an oversight.
 *
 * DEPLOYMENT REQUIREMENT (flagged, not hidden): the Chromium binary is NOT
 * downloaded at `npm install` (skipped deliberately — ~170MB). The VPS
 * provisioning step must run `npx playwright install --with-deps chromium`
 * once; until then this function fails fast with a clear Persian error.
 */
export async function renderInvoicePdf(
  invoiceUrl: string,
  cookies: { name: string; value: string; domain: string; path: string }[],
): Promise<{ success: true; pdf: Buffer } | { success: false; error: string }> {
  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    console.error("Chromium launch failed — run `npx playwright install --with-deps chromium` on this server:", error);
    return { success: false, error: "موتور تولید PDF روی سرور نصب نشده است. با مدیر سیستم تماس بگیرید." };
  }

  try {
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();

    const response = await page.goto(invoiceUrl, { waitUntil: "networkidle" });
    if (!response || !response.ok()) {
      return { success: false, error: "بارگذاری صفحه پیش‌فاکتور برای تولید PDF ناموفق بود" };
    }

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `
        <div style="width:100%;text-align:center;font-size:8px;color:#666;direction:rtl;">
          صفحه <span class="pageNumber"></span> از <span class="totalPages"></span>
        </div>`,
      margin: { top: "10mm", bottom: "14mm", left: "0", right: "0" },
    });

    return { success: true, pdf: Buffer.from(pdf) };
  } catch (error) {
    console.error("Invoice PDF render failed:", error);
    return { success: false, error: "تولید PDF با خطا مواجه شد. دوباره تلاش کنید." };
  } finally {
    await browser.close();
  }
}
