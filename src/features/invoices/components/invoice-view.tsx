/* Server-safe, pure — no client hooks. Rendered by the print page, which
 * the PDF exporter drives via headless Chromium: one markup source, so the
 * on-screen preview, direct print, and exported PDF can never diverge
 * (DESIGN-SYSTEM.md §18's "preview renders exactly like the PDF" rule).
 */
import Image from "next/image";

import { formatToman } from "@/lib/format/currency";
import { formatJalaliLong } from "@/lib/format/date";
import { toPersianDigits } from "@/lib/format/persian-digits";
import type { InvoiceRenderData } from "@/features/invoices/services";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "پرداخت نشده",
  partial: "پرداخت ناقص",
  paid: "تسویه کامل",
};

export function InvoiceView({ data }: { data: InvoiceRenderData }) {
  return (
    <div className="invoice-page mx-auto bg-white text-[#1f2328]">
      {/* Header — company identity from the FROZEN snapshot, never live settings */}
      <header className="flex items-start justify-between border-b-2 border-[#1f2328] pb-4">
        <div className="flex items-center gap-4">
          {data.company.logoFilePath ? (
            // `unoptimized`: Next's `/_next/image` optimizer resolves its
            // source with an internal, cookie-less fetch — `/uploads/*` is
            // deliberately auth-protected (proxy.ts), so that internal
            // fetch gets redirected to `/login` and the optimizer receives
            // HTML instead of image bytes ("isn't a valid image"),
            // silently dropping the logo. This tag renders in the
            // logged-in browser instead, which does carry the session
            // cookie, so skipping the optimizer and requesting the file
            // directly is what actually works here.
            // `priority`: disables next/image's default lazy-loading —
            // without it the logo waits on an IntersectionObserver that
            // never fires in the PDF exporter's headless capture, so the
            // logo would be missing from exported PDFs specifically even
            // though it's above the fold on screen.
            <Image
              src={data.company.logoFilePath}
              alt={data.company.name}
              width={72}
              height={72}
              unoptimized
              priority
              className="object-contain"
            />
          ) : null}
          <div>
            <p className="text-[16pt] font-bold">{data.company.name}</p>
            {data.company.address ? <p className="mt-1 text-[9pt]">{data.company.address}</p> : null}
            <p className="mt-1 text-[9pt]">
              {data.company.phoneNumbers.map((phone) => toPersianDigits(phone.phoneNumber)).join(" · ")}
            </p>
          </div>
        </div>
        <div className="text-start">
          <p className="text-[14pt] font-bold">پیش‌فاکتور</p>
          <p className="mt-1 text-[10pt]" dir="ltr">
            {data.orderNumber}
          </p>
          <p className="mt-1 text-[10pt]">{formatJalaliLong(data.generatedAt)}</p>
        </div>
      </header>

      {/* Customer block */}
      <section className="mt-4 grid grid-cols-2 gap-2 rounded border border-[#c9c9c9] p-3 text-[10pt]">
        <p>
          <span className="font-bold">مشتری: </span>
          {data.customer.name}
          <span dir="ltr" className="ms-2 text-[8pt] text-[#666]">
            {data.customer.customerCode}
          </span>
        </p>
        <p>
          <span className="font-bold">موبایل: </span>
          <span dir="ltr">{toPersianDigits(data.customer.mobile)}</span>
        </p>
        {data.customer.address ? (
          <p className="col-span-2">
            <span className="font-bold">آدرس: </span>
            {data.customer.address}
          </p>
        ) : null}
      </section>

      {/* Items — thead repeats automatically on every printed page */}
      <table className="invoice-items mt-4 w-full border-collapse text-[9.5pt]">
        <thead>
          <tr>
            <th>ردیف</th>
            <th>محصول</th>
            <th>قطعه</th>
            <th>سایز</th>
            <th>بسته</th>
            <th>عددی</th>
            <th>جمع عدد</th>
            <th>قیمت واحد (تومان)</th>
            <th>جمع (تومان)</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={`${item.productCode}-${item.pieceName}-${item.sizeLabel}`}>
              <td>{toPersianDigits(index + 1)}</td>
              <td>
                {item.productName}
                <span dir="ltr" className="ms-1 text-[7.5pt] text-[#666]">
                  {item.productCode}
                </span>
              </td>
              <td>{item.pieceName}</td>
              <td>{toPersianDigits(item.sizeLabel)}</td>
              <td>{item.packQuantity > 0 ? `${toPersianDigits(item.packQuantity)}×${toPersianDigits(item.packSize)}` : "—"}</td>
              <td>{item.unitQuantity > 0 ? toPersianDigits(item.unitQuantity) : "—"}</td>
              <td className="font-bold">{toPersianDigits(item.totalUnits)}</td>
              <td>{formatToman(item.unitPrice, { withUnit: false })}</td>
              <td className="font-bold">{formatToman(item.totalPrice, { withUnit: false })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals + payment summary — kept whole, lands on the last page only */}
      <section className="invoice-totals mt-4 flex items-start justify-between gap-6">
        <div className="flex-1 text-[9pt]">
          {data.customerNotes ? (
            <p className="rounded border border-[#c9c9c9] p-2">
              <span className="font-bold">یادداشت: </span>
              {data.customerNotes}
            </p>
          ) : null}
        </div>
        <div className="w-64 text-[10pt]">
          <div className="flex justify-between border-b border-[#c9c9c9] py-1.5">
            <span>جمع کل</span>
            <span className="font-bold">{formatToman(data.totalAmount)}</span>
          </div>
          <div className="flex justify-between border-b border-[#c9c9c9] py-1.5">
            <span>پرداخت‌شده</span>
            <span>{formatToman(data.payment.paidAmount)}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span>مانده</span>
            <span className="font-bold">{formatToman(data.payment.remainingAmount)}</span>
          </div>
          <p className="mt-1 text-end text-[9pt] text-[#666]">وضعیت پرداخت: {PAYMENT_STATUS_LABELS[data.payment.paymentStatus]}</p>
        </div>
      </section>

      {/* Footer — contact info + snapshot footer text (no QR code, per the explicit request to remove it) */}
      <footer className="invoice-footer mt-6 flex items-end justify-between gap-4 border-t border-[#c9c9c9] pt-3 text-[8.5pt]">
        <div className="flex items-center gap-3">
          <div>
            {data.company.whatsapp ? <p>واتساپ: <span dir="ltr">{toPersianDigits(data.company.whatsapp)}</span></p> : null}
            {data.company.telegram ? <p>تلگرام: <span dir="ltr">{data.company.telegram}</span></p> : null}
            {data.company.instagram ? <p>اینستاگرام: <span dir="ltr">{data.company.instagram}</span></p> : null}
          </div>
        </div>
        {data.company.footerText ? <p className="max-w-[45%] text-end">{data.company.footerText}</p> : null}
      </footer>
    </div>
  );
}
