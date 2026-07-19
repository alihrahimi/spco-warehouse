/**
 * Rasterizes a PDF to one high-resolution PNG per page, entirely in-process:
 * pdf.js (the legacy/Node build) renders each page onto an `@napi-rs/canvas`
 * surface — pdf.js's own Node canvas backend, no system binary involved.
 * Because the input is the exact PDF the invoice export produces, the PNGs
 * are pixel-faithful to the printed invoice by construction (same fonts,
 * same pagination, same margins).
 *
 * 300 DPI: print-shop resolution for an A4 page (≈2480×3508px) while
 * keeping each PNG a few MB — "ready for printing or sharing".
 */

/** What pdf.js's NodeCanvasFactory actually hands back (its type is declared as a bare `Object`). */
interface NodeCanvasAndContext {
  canvas: HTMLCanvasElement & { toBuffer: (mime: "image/png") => Buffer };
  context: CanvasRenderingContext2D;
}

export async function renderPdfPagesToPng(pdf: Buffer, dpi = 300): Promise<Buffer[]> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = getDocument({
    data: new Uint8Array(pdf),
    // pdf.js logs recoverable font quirks at its default verbosity; errors still throw.
    verbosity: 0,
  });
  const pdfDocument = await loadingTask.promise;

  try {
    const scale = dpi / 72; // PDF user space is 72 units/inch
    const canvasFactory = pdfDocument.canvasFactory as { create: (width: number, height: number) => NodeCanvasAndContext };
    const pages: Buffer[] = [];

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      // The document's canvasFactory is pdf.js's NodeCanvasFactory (backed
      // by @napi-rs/canvas) — the officially supported Node rendering path.
      const { canvas } = canvasFactory.create(Math.ceil(viewport.width), Math.ceil(viewport.height));

      await page.render({ canvas, viewport }).promise;
      pages.push(canvas.toBuffer("image/png"));
      page.cleanup();
    }

    return pages;
  } finally {
    await loadingTask.destroy();
  }
}
