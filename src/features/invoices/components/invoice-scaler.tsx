"use client";

import { useEffect, useState, type ReactNode } from "react";

/** 210mm at CSS 96dpi — the fixed design width of `.invoice-page`. */
const INVOICE_WIDTH_PX = 794;

/**
 * Scales the fixed-width A4 invoice down to fit narrow viewports (phones,
 * small tablets) without touching the invoice markup itself: the document
 * keeps its exact 210mm print layout, and only the on-screen preview
 * shrinks. `zoom` (not `transform: scale`) so the scaled element's layout
 * box shrinks with it — no leftover blank space and no horizontal overflow
 * for the page to inherit. Print/PDF are unaffected: the print stylesheet
 * resets zoom to 1 (see the print page), and the PDF exporter's viewport
 * is wider than the invoice so the scale computes to 1 there anyway.
 */
export function InvoiceScaler({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      setScale(Math.min(1, document.documentElement.clientWidth / INVOICE_WIDTH_PX));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="invoice-scaler" style={{ zoom: scale }}>
      {children}
    </div>
  );
}
