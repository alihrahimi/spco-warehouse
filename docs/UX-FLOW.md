# SPCO Warehouse — UX & Application Flow Blueprint

**Status:** Draft for review — Phase 03 output. No code, no components, no APIs implemented from this document yet.

This document is the complete application flow for Version 1: every screen, every navigation path, and the four critical end-to-end workflows (Order Creation, Payment, Invoice, Settings). It is written to be the reference the implementation phase builds against.

---

## 0. Design Principles (applied to every screen below)

- **Tablet-first, finger-first.** Minimum tap target ~48×48dp. Every screen usable one-handed or two-thumbed on an Android tablet held in portrait.
- **Persian labels always, icons never alone.** No icon-only buttons — every action has a clear Persian word next to it.
- **No hidden actions.** No long-press-only features, no swipe-only destructive actions without a visible alternative, no hamburger menus hiding primary actions.
- **One purpose per screen.** If a screen starts doing two jobs, it should split.
- **Every action gives feedback.** A tap either navigates, shows a toast, shows an inline validation message, or visibly changes state — never a silent no-op.
- **Confirmation dialogs are reserved for destructive or hard-to-reverse actions** (cancel order, deactivate user, delete category-in-use). Non-destructive actions (save, print, add payment) never get an extra "are you sure?" tap.
- **Money is always Toman, Persian-grouped, no decimals. Dates are always Jalali.** These are rendered, never typed by hand, wherever the system can compute them.

---

## 1. Login

| | |
|---|---|
| **Purpose** | Authenticate a staff member before anything else is reachable. |
| **Who uses it** | Every user — warehouse staff, admin. |
| **Inputs** | Username, password. |
| **Outputs** | Authenticated session → Dashboard. |
| **Buttons** | `ورود` (primary, full-width). Password field has a show/hide-eye toggle. |
| **Navigation** | App entry point. No back destination. Success → Dashboard. |
| **Possible errors** | Wrong credentials → inline red text under the form: "نام کاربری یا رمز عبور اشتباه است." Deactivated account → distinct message: "حساب شما غیرفعال شده. با مدیر تماس بگیرید." |
| **Success message** | None needed — the redirect to Dashboard *is* the confirmation. An extra toast here would just add a delay. |
| **Confirmation dialogs** | None. |
| **Important notes** | Company logo (loaded live from Settings, never hardcoded) shown above the form. Username field auto-focused on load. |
| **UX recommendations** | Large input fields (≥52px tall). Session stays alive for the whole shift — no aggressive auto-logout that forces re-entry mid-task. |
| **Estimated clicks** | 3 (tap username, tap password, tap Login) plus typing. |

---

## 2. Dashboard

| | |
|---|---|
| **Purpose** | Single home screen; one tap to every major action. |
| **Who uses it** | Everyone, with admin-only tiles (Settings, Users) hidden for warehouse-role accounts. |
| **Inputs** | None — pure navigation. |
| **Outputs** | None. |
| **Buttons** | One dominant tile: `سفارش جدید` (New Order) — visually the largest element on the screen, since order creation is the entire point of this app. Secondary tiles: `سفارش‌ها`, `مشتریان`, `محصولات`, and (admin) `تنظیمات`, `کاربران`, `ابزارها`. |
| **Navigation** | Root screen post-login. Every other screen provides a way back here (persistent home affordance). |
| **Possible errors** | Only a silent, non-blocking failure if an optional "today's summary" stat fails to load — never blocks the tiles. |
| **Success message** | N/A. |
| **Confirmation dialogs** | None. |
| **Important notes** | Optional lightweight status strip ("امروز: ۵ سفارش ثبت شده") for orientation — not a reports dashboard. |
| **UX recommendations** | Every tile: icon + Persian label together. Consistent grid sized for thumb reach. |
| **Estimated clicks** | 1 (tap destination tile). |

---

## 3. Customer List

| | |
|---|---|
| **Purpose** | Find an existing customer, or launch creating a new one. Also reused as the in-flow customer picker during Order Creation. |
| **Who uses it** | Warehouse staff (order building), admin (record management). |
| **Inputs** | Search text (name or mobile). |
| **Outputs** | Filtered, tappable list of customers. |
| **Buttons** | `مشتری جدید` fixed at top. Each row is a full-width tappable card — no separate "open" button needed. |
| **Navigation** | From Dashboard `مشتریان` tile, or invoked inline from Create Order. |
| **Possible errors** | No results → empty state: "مشتری‌ای یافت نشد" with `مشتری جدید` emphasized as the next step — never a dead end. |
| **Success message** | N/A (list view). |
| **Confirmation dialogs** | None here. |
| **Important notes** | Search matches name and mobile as-you-type — no submit button, saves a tap. |
| **UX recommendations** | When opened from inside Order Creation, pin "recently ordered" customers at the top — likely the single biggest speed win on this screen, since a small set of regulars probably accounts for most orders. |
| **Estimated clicks** | 1 (tap a result row). |

---

## 4. Create Customer

| | |
|---|---|
| **Purpose** | Register a new customer. |
| **Who uses it** | Warehouse staff (mid-order) or admin. |
| **Inputs** | Name*, Mobile*, Notes, Default Payment Type (Cash/Cheque toggle). |
| **Outputs** | New customer record. |
| **Buttons** | `ذخیره` (primary), `انصراف` (secondary). |
| **Navigation** | From Customer List, or as an inline overlay from Order Creation's "customer not found" path (returns straight back into the order, customer pre-selected — never a full navigation detour). |
| **Possible errors** | Missing required field → inline error under that exact field on Save tap (fields aren't pre-disabled, since a disabled Save button confuses users about what's wrong). Duplicate mobile → non-blocking warning offering to open the existing record instead. |
| **Success message** | Toast: "مشتری ثبت شد", then auto-navigate back to wherever this was launched from. |
| **Confirmation dialogs** | Only on Cancel if fields were touched: "تغییرات ذخیره نشود؟" |
| **Important notes** | Mobile field uses numeric keypad input mode. Name field auto-focused. |
| **UX recommendations** | Max 3 visible fields — fits one tablet screen with no scrolling. |
| **Estimated clicks** | 3 taps (name, mobile, save) + typing. |

---

## 5. Edit Customer

| | |
|---|---|
| **Purpose** | Update an existing customer's details. |
| **Who uses it** | Admin mainly; warehouse staff for quick corrections (e.g. a mistyped phone number). |
| **Inputs** | Same fields as Create, pre-filled. |
| **Outputs** | Updated record. |
| **Buttons** | `ذخیره تغییرات`, `انصراف`. |
| **Navigation** | Customer List → customer profile view → Edit. |
| **Possible errors** | Same validation as Create. |
| **Success message** | Toast: "تغییرات ذخیره شد". |
| **Confirmation dialogs** | Unsaved-changes prompt on back-navigation with pending edits. |
| **Important notes** | Show read-only order-history summary ("۱۲ سفارش قبلی") for context — not a full report, just orientation. |
| **UX recommendations** | Identical field layout to Create Customer for muscle-memory consistency. |
| **Estimated clicks** | 2–3 (edit field, save). |

---

## 6. Product List

| | |
|---|---|
| **Purpose** | Browse the catalog of Designs. General catalog management — Order Creation uses its own optimized picker (§ Order Creation Flow). |
| **Who uses it** | Admin mostly. |
| **Inputs** | Search text, category filter chips. |
| **Outputs** | Filtered product grid. |
| **Buttons** | `محصول جدید`; category filter chips at top (`همه`, then each category) — tap-to-filter, no dropdown. |
| **Navigation** | From Dashboard `محصولات` tile, or drilled into from Product Categories. |
| **Possible errors** | Empty state, same pattern as Customer List. |
| **Success message** | N/A. |
| **Confirmation dialogs** | None. |
| **Important notes** | Cards are text/color-forward, not photo-dependent — product photography isn't a confirmed input, so the design doesn't assume it exists. |
| **UX recommendations** | Card grid (2–3 columns on tablet), not a dense table — density fights the large-touch-target principle. |
| **Estimated clicks** | 1 (tap a card → Product Details). |

---

## 7. Product Categories

| | |
|---|---|
| **Purpose** | Manage the categories that organize products. |
| **Who uses it** | Admin only. |
| **Inputs** | Category name, description. |
| **Outputs** | Category CRUD. |
| **Buttons** | `دسته‌بندی جدید`; inline edit/delete per row. |
| **Navigation** | From Product List's filter bar, or a Settings sub-entry. |
| **Possible errors** | Deleting a category with products still attached → blocked with explanation: "ابتدا محصولات این دسته را جابجا کنید." No silent cascade delete. |
| **Success message** | Toast on save/delete. |
| **Confirmation dialogs** | Required for delete: "این دسته‌بندی حذف شود؟" |
| **Important notes** | Low-frequency admin screen — still uses the same large-touch-target visual language for consistency, even though speed isn't the priority here. |
| **UX recommendations** | Inline-editable list, not a separate page per category. |
| **Estimated clicks** | 2–3 per category managed. |

---

## 8. Product Details

| | |
|---|---|
| **Purpose** | View and manage one Design's full structure: its Pieces, and per-piece Sizes with price + pack size. |
| **Who uses it** | Admin. |
| **Inputs** | None to view; edits via Add Piece / Add Size sub-actions. |
| **Outputs** | N/A (composite view). |
| **Buttons** | `افزودن قطعه` per product; inline price/pack-size fields per size row within each piece. |
| **Navigation** | From Product List card tap; back → Product List. |
| **Possible errors** | A piece with no sizes configured is visually flagged ("قیمتی تعریف نشده") so it can't silently be orderable with a missing price. |
| **Success message** | Inline save confirmation per field (autosave-on-blur — see UX recommendations). |
| **Confirmation dialogs** | Deleting a piece/size that has order history → blocked, offered deactivation instead (`is_active = false`) rather than deletion — matches the DB design's soft-delete philosophy. |
| **Important notes** | This screen is the direct UI for the Product → Piece → Size → {Price, Pack Size} structure from the Database Phase. |
| **UX recommendations** | Expandable (accordion) piece rows, each revealing a small size table. Pack size uses a stepper (+/−), not free typing, since it's almost always a small integer. |
| **Estimated clicks** | 3–5 to fully configure one piece's sizes. |

---

## 9. Create Product

| | |
|---|---|
| **Purpose** | Register a new Design and its initial Piece/Size structure. |
| **Who uses it** | Admin. |
| **Inputs** | Step 1: name, category, description. Step 2: piece names. Step 3: per-piece sizes with price + pack size. |
| **Outputs** | New product, ready to appear in Order Creation. |
| **Buttons** | Staged 3-step wizard rather than one long form (`بعدی` / `ذخیره محصول`) — this data is inherently hierarchical, a single flat form would be worse. |
| **Navigation** | From Product List `محصول جدید`. Back arrow steps back through the wizard, doesn't exit it. |
| **Possible errors** | A piece with zero sizes, or a size with no price → final save blocked with a specific inline list of what's missing (e.g. "قیمت سایز ۲ شلوار خرسی مشخص نشده"). |
| **Success message** | "محصول با موفقیت ثبت شد" → return to Product List with the new product highlighted. |
| **Confirmation dialogs** | Cancel mid-wizard → confirm discard. |
| **Important notes** | Default Pack Size pre-fills as **6** on every new size row, per your business rule — the common case costs zero extra taps. |
| **UX recommendations** | `کپی سایزها` (Copy Sizes) shortcut to duplicate one piece's size/price table onto a new piece — flagged as a recommendation (not confirmed as required), since many Designs likely share identical size/price structures across pieces. |
| **Estimated clicks** | Higher than most screens by nature — this is a low-frequency, admin-only, correctness-over-speed screen. |

---

## 10. Order List

| | |
|---|---|
| **Purpose** | Browse/search orders — check status, resume, collect payment, or print. |
| **Who uses it** | All staff. |
| **Inputs** | Search (customer name/order number), status filter chips. |
| **Outputs** | Order rows: order #, customer, total, remaining balance, status badge. |
| **Buttons** | `سفارش جدید` fixed at top; status filter chips (`در انتظار پرداخت` / `در حال آماده‌سازی` / `آماده` / `تکمیل‌شده` / `لغوشده`); each row taps into Order Details. |
| **Navigation** | From Dashboard `سفارش‌ها` tile. |
| **Possible errors** | Empty state per active filter. |
| **Success message** | N/A. |
| **Confirmation dialogs** | None. |
| **Important notes** | Status shown as color **+** Persian text together — never color alone. Orders with an outstanding balance are visually flagged (e.g. small indicator dot), since collecting payment is a recurring task. |
| **UX recommendations** | Default filter excludes Completed/Cancelled, so the default view is the actionable list, not full history. |
| **Estimated clicks** | 1–2 (optional filter tap, row tap). |

---

## 11. Create Order — *see the dedicated deep-dive in § Order Creation Flow below.*

---

## 12. Order Details

| | |
|---|---|
| **Purpose** | Single source of truth for one order: items, totals, payment status, and every action taken on it. |
| **Who uses it** | All staff. |
| **Inputs** | None to view; status-advance and Add Payment are the actionable inputs. |
| **Outputs** | N/A. |
| **Buttons** | Context-aware status-advance button (see Important Notes); `افزودن پرداخت`; `چاپ / اشتراک‌گذاری فاکتور`; `لغو سفارش` (secondary/destructive styling, visually separated from primary actions). |
| **Navigation** | From Order List row tap, or auto-opened right after Create Order completes. |
| **Possible errors** | Attempting to cancel a Completed order → blocked with explanation. |
| **Success message** | Toast on every state-changing action, e.g. "وضعیت به «آماده» تغییر کرد". |
| **Confirmation dialogs** | Required for `لغو سفارش`: "این سفارش لغو شود؟" |
| **Important notes** | Total / Paid / Remaining shown prominently at the top, always computed live from `payments` — never a stale cached figure (per the Database Phase design). **Status changes are always a manual staff action — the system never changes status automatically**, since it has no way to independently confirm a payment actually occurred (see Payment Flow below for the one exception: a non-binding suggestion prompt). |
| **UX recommendations** | Once an order is past `pending_payment`, its item list becomes read-only — line-item changes after that point should go through an explicit "edit order" action (while still `pending_payment` only), never a silent side-channel edit, to protect the snapshot integrity from the Database Phase. |
| **Estimated clicks** | 1 to view, up to 3 to perform one action. |

---

## 13. Payment Screen

| | |
|---|---|
| **Purpose** | Record a payment against an order. |
| **Who uses it** | Whoever is at the counter when money changes hands. |
| **Inputs** | Method: Cash / Cheque (large two-segment toggle, not a dropdown). Cash → sub-type: `پیش‌پرداخت` / `تسویه باقیمانده` / `تسویه کامل` (three big buttons, each pre-fills the amount). Cheque → cheque number + Jalali due-date picker, amount typed manually. |
| **Outputs** | New payment record; order's derived paid/remaining totals update immediately. |
| **Buttons** | `ثبت پرداخت` (primary); the three cash sub-type buttons double as amount shortcuts. |
| **Navigation** | From Order Details `افزودن پرداخت`, or as the natural final step of Create Order (see deep-dive). |
| **Possible errors** | Amount exceeds remaining balance → non-blocking warning requiring an explicit confirm tap (overpayment/credit is a legitimate scenario, not disallowed). Cheque number/date left blank → inline required-field error. |
| **Success message** | "پرداخت ثبت شد" with the updated remaining balance shown immediately on-screen before navigating away. If this payment brings the remaining balance to exactly zero **and** the order is still `pending_payment`, a non-blocking suggestion prompt appears immediately after (see Important Notes) — it never fires automatically without this explicit trigger, and it never changes anything by itself. |
| **Confirmation dialogs** | Only the overpayment-confirm case above. (The zero-balance status suggestion below is not a confirmation dialog — it's an optional suggestion the user can dismiss with no consequence.) |
| **Important notes** | Amount field live-formats as Persian-grouped Toman while typing (e.g. "۱۲۰,۰۰۰ تومان") — this is a high-stakes, frequent field, so format feedback matters. **The system never changes order status by itself** — it has no way to independently verify a payment was actually received; staff confirm that by the act of recording it. When a recorded payment brings the balance to zero, the system only *suggests* a status change (see below), it never applies one. |
| **UX recommendations** | `تسویه کامل` is the visually largest of the three cash buttons — likely the most common real-world case for an on-the-spot payment. |
| **Estimated clicks** | 2–4 (method → sub-type/amount → confirm). |

---

## 14. Invoice Preview

| | |
|---|---|
| **Purpose** | Show the generated invoice exactly as it will print/export, before it's handed off. |
| **Who uses it** | All staff. |
| **Inputs** | None (read-only render). |
| **Outputs** | Leads to Print / Download / Share. |
| **Buttons** | `چاپ`, `دانلود PDF`, `اشتراک‌گذاری در واتساپ/تلگرام` — three explicit, labeled buttons rather than a generic icon-only share sheet, since this is the most externally visible output the app produces. |
| **Navigation** | From Order Details, and auto-offered right after order creation completes (see Invoice Flow deep-dive). |
| **Possible errors** | PDF generation failure → explicit retry button, never a silent failure. |
| **Success message** | Native share sheet typically self-confirms; otherwise a brief toast after Share completes. |
| **Confirmation dialogs** | None — viewing/printing isn't destructive. |
| **Important notes** | The preview renders with the exact same Vazirmatn/RTL/Jalali/Toman formatting as the final PDF — never an approximate preview that then differs from the real export. |
| **UX recommendations** | Pinch-to-zoom enabled so staff can double-check fine print before handing the invoice to a customer. |
| **Estimated clicks** | 1 (choose an action). |

---

## 15. Company Settings

| | |
|---|---|
| **Purpose** | Edit the business identity shown on every invoice and around the app — nothing hardcoded, per your explicit requirement. |
| **Who uses it** | Admin only. |
| **Inputs** | Company name, logo upload, phone numbers (add/remove multiple), WhatsApp, Telegram, Instagram, address, footer text, invoice number prefix, invoice footer note, show/hide logo on invoice. |
| **Outputs** | Updated `company_settings` / `invoice_settings` records. |
| **Buttons** | `ذخیره تنظیمات`; per phone number a small remove (`×`) and an `افزودن شماره` add button. |
| **Navigation** | From Dashboard `تنظیمات` tile (admin-only). |
| **Possible errors** | Invalid phone format → inline, non-blocking warning (formats vary). Logo file too large/wrong type → inline error naming the limit. |
| **Success message** | "تنظیمات ذخیره شد". |
| **Confirmation dialogs** | None typically; a soft warning on changing the invoice number prefix mid-year ("این تغییر روی فاکتورهای بعدی اعمال می‌شود"). |
| **Important notes** | Logo preview renders live, at the same aspect ratio it appears on the invoice. |
| **UX recommendations** | Group fields under clear sub-headers (اطلاعات شرکت / شبکه‌های ارتباطی / تنظیمات فاکتور) — this is low-frequency but high-consequence, so clarity beats speed here. |
| **Estimated clicks** | ~1 tap per changed field + 1 save. |

---

## 16. User Management

| | |
|---|---|
| **Purpose** | Admin creates and deactivates staff accounts. |
| **Who uses it** | Admin only. |
| **Inputs** | Full name, username, password (on create), role, active/inactive toggle. |
| **Outputs** | User CRUD. |
| **Buttons** | `کاربر جدید`; per-row `غیرفعال‌سازی` instead of delete — preserves historical `created_by` references (matches the Database Phase's soft-delete design). |
| **Navigation** | From Dashboard `کاربران` tile (admin-only). |
| **Possible errors** | Duplicate username → inline error. Weak/short password → inline requirement hint. |
| **Success message** | Toast on create/deactivate. |
| **Confirmation dialogs** | Required for deactivation: "این کاربر غیرفعال شود و دیگر نتواند وارد شود؟" |
| **Important notes** | Password reset is a distinct, explicit action (`تغییر رمز عبور`) — never silently editable inline, to avoid accidental resets. |
| **UX recommendations** | Role selection as a chip selector (2–3 options), not a dropdown. |
| **Estimated clicks** | 4–6 to create a user. |

---

## 17. Utilities

| | |
|---|---|
| **Purpose** | Landing menu for miscellaneous internal tools — currently just the XPS→PDF converter, but future tools land here without redesigning the Dashboard. |
| **Who uses it** | Admin/office staff. |
| **Inputs** | None. |
| **Outputs** | None. |
| **Buttons** | One large tile per tool — currently `تبدیل XPS به PDF`. |
| **Navigation** | From Dashboard `ابزارها` tile. |
| **Possible errors** | N/A. |
| **Success message** | N/A. |
| **Confirmation dialogs** | None. |
| **Important notes** | Purpose-built to absorb future tools without touching the main Dashboard layout. |
| **UX recommendations** | If floor-staff vs. office-staff roles are ever split, this tile is a natural candidate to hide from floor staff — flagged as a future refinement, not a v1 requirement. |
| **Estimated clicks** | 1. |

---

## 18. XPS → PDF Tool

| | |
|---|---|
| **Purpose** | Convert an XPS file to PDF. |
| **Who uses it** | Admin/office staff. |
| **Inputs** | File picker (.xps). |
| **Outputs** | Downloadable/shareable .pdf. |
| **Buttons** | `انتخاب فایل`, `تبدیل به PDF`, then `دانلود` once ready. |
| **Navigation** | From Utilities. |
| **Possible errors** | Wrong file type selected → inline error before attempting conversion. Conversion failure → explicit error with retry, never a silent hang. |
| **Success message** | "تبدیل با موفقیت انجام شد" with the result immediately offered for download. |
| **Confirmation dialogs** | None. |
| **Important notes** | Stateless file-in/file-out utility — no database record, matching the Database Phase's note that Utilities don't need tables. |
| **UX recommendations** | Visible progress state during conversion ("در حال تبدیل...") — a frozen-looking screen erodes trust for low-computer-literacy users. |
| **Estimated clicks** | 3 (choose file, convert, download). |

---

## Order Creation Flow — the critical path

This is the single most important workflow in the application. The design goal: a warehouse employee should be able to build a large, multi-product order using mostly taps, minimal typing, and as few screens as possible.

**Step 1 — Start.** Tap `سفارش جدید` (Dashboard or Order List). 1 tap.

**Step 2 — Select customer.** Opens directly into a customer picker (the Customer List screen, in picker mode), with recently-ordered customers pinned at the top. Repeat customer = 1 tap. New customer = inline `مشتری جدید` overlay (not a full navigation away) — Save returns straight back into the order with the customer already selected, so order-building context is never lost.

**Step 3 — Add items (the core interaction).**
A persistent footer shows the running item count and subtotal at all times, so staff always see progress.

`افزودن آیتم` opens a fast picker:
`دسته‌بندی چیپ‌ها` → `شبکه محصولات` → `لیست قطعه‌ها` (within the chosen product) → selecting a **piece** (e.g. "شلوار") immediately shows **all its configured sizes at once** as parallel rows — size 0, 1, 2, 3 — each with:
- a Pack/Unit two-segment toggle (defaults to **Pack**, since Pack-of-6 is the common case),
- a quantity stepper,
- a live line total ("۳ بسته = ۱۸ عدد — ۵۴۰,۰۰۰ تومان").

Tapping `افزودن به سفارش` **once** adds every non-zero row across all visible sizes as separate order items in a single action. This is the single biggest speed lever in the whole app: filling in Size 0 and Size 2 of the same piece and adding both together costs one "add" tap, not two round-trips through the picker.

Back in the running order-items list, tapping `افزودن آیتم` again continues to the next piece/product. Any already-added line is edited or removed by tapping it directly — no separate "edit mode" toggle to find first.

**Step 4 — Review & submit.** A scrollable list of every added item (Product — Piece — Size — Pack/Unit qty — line total). `ثبت سفارش` is sticky at the bottom of the screen regardless of scroll position, since orders can run long.

**Step 5 — Validation.** On submit: at least one item required; every item must have quantity > 0. A failure points at the specific offending line — never a generic "error occurred."

**Step 6 — Order created.** Status = `pending_payment`, order number generated (`INV-1405-000001` pattern).

**Step 7 — Straight into Payment**, with a visible `پرداخت بعداً` (Pay Later) escape hatch — payment is not forced here, since forcing it would undercut the speed this whole flow exists to deliver.

**Step 8 — Order Details**, with `چاپ فاکتور` front and center.

**Illustrative tap budget** for a moderately complex order (3 products, 5 size-lines): ≈1 (new order) + 1 (customer) + 3×2 (pick product/piece + add) + ~5 (quantity steppers) + 1 (submit) + ~3 (payment) ≈ **15–18 taps** for the entire order, versus dozens in a naive one-field-at-a-time form. This is an estimate to guide design, not a guarantee.

---

## Payment Flow — end to end

1. Order total is known (computed from its items).
2. Staff picks **Cash** or **Cheque**.
   - **Cash** → sub-choice of `پیش‌پرداخت` / `تسویه باقیمانده` / `تسویه کامل`. `تسویه کامل` auto-fills the exact remaining balance; `پیش‌پرداخت` leaves the amount blank for manual entry.
   - **Cheque** → cheque number + Jalali due date are required; amount is entered manually (Iranian business practice often splits payment across multiple post-dated cheques, so no auto-fill is assumed here).
3. **Multiple payments per order are supported** — e.g. a cash deposit today, a cheque next week. Order Details always shows the live, derived remaining balance.
4. **Status is always a manual decision — resolved.** The system has no independent way to verify a payment actually happened; only a staff member recording it confirms that. So order `status` (`pending_payment → preparing → ready → completed → cancelled`) is **never** changed automatically by the system, under any condition.
5. **The one assist the system provides:** immediately after a recorded payment brings the remaining balance to exactly zero (and the order is still `pending_payment`), a dismissible, non-blocking suggestion prompt appears:

   > **"این سفارش به طور کامل پرداخت شده است. وضعیت به «در حال آماده‌سازی» تغییر یابد؟"**
   > *(This order has been fully paid. Would you like to change the status to Preparing?)*
   >
   > Buttons: `بله، تغییر بده` (primary — applies the status change immediately, same as if done manually from Order Details) / `فعلاً نه` (secondary — dismisses with zero effect; order stays exactly as it was, and staff can change status manually at any time later regardless).

   This prompt is purely a convenience shortcut for the *same manual action* available from Order Details — it never fires outside this one moment (right after a payment recording completes), and dismissing it has no side effects and cannot be "missed" as a decision, since the manual status control is always available afterward anyway.

---

## Invoice Flow — exactly what happens after "Generate Invoice"

1. Staff taps `چاپ / صدور فاکتور` from Order Details (available at any order status).
2. **Validation:** order must have ≥1 item (always true once submitted), and Company Settings must have at least a company name configured — if Company Settings is incomplete, a clear one-time blocking message directs the admin to Settings rather than silently printing a blank header.
3. The system assembles invoice data: order items **from their stored snapshots** (never re-fetched from live catalog — guarantees the invoice reflects exactly what was agreed at order time), customer info, live company info from Settings, payment summary (paid/remaining), Jalali-formatted date, and order number.
4. Backend renders the HTML invoice template (Vazirmatn embedded, RTL) via Playwright into a PDF, stored via the storage layer; the DB record links the order to its PDF.
5. Invoice Preview opens showing the rendered result.
6. Staff chooses `چاپ` (print), `دانلود PDF`, or `اشتراک‌گذاری در واتساپ/تلگرام` — a native share sheet with the PDF pre-attached.
7. No "confirm before generating" dialog — generating is non-destructive and cheap to redo.

**Resolved — company info is snapshotted, not live-read, after first generation.** At the moment step 3–4 above run for the *first* time for a given order, the assembled company identity fields (name, logo, phone numbers, WhatsApp, Telegram, Instagram, footer text) are written once to a new `invoice_documents` row tied 1:1 to the order (see the Database Phase addendum below). Every subsequent re-print/re-export of that same order reads from this frozen row instead of live `CompanySettings` — only orders generating their invoice for the *first* time use current settings. This mirrors the same guarantee `order_items` already gives for catalog data.

**Database Phase addendum (schema change made as a direct consequence of this decision):** added `InvoiceDocument` (table `invoice_documents`) to `prisma/schema.prisma` — one row per order, created on first invoice generation, storing the company snapshot fields above plus `pdf_file_path`, `generated_at`, and `generated_by`. A new incremental migration (`add_invoice_documents`) was generated and verified consistent; the previously-approved `init` migration was not modified. One structural constraint this introduces: **logo uploads must never overwrite an existing file path** (e.g. must be timestamped/versioned filenames) — if a new logo silently replaced the old file at the same path, this snapshot guarantee would break even though the DB row itself is correct.

---

## Settings Flow — end to end

A single `تنظیمات` entry point (admin-only) branches into three clearly labeled sections:

- **اطلاعات شرکت** — logo, name, address, footer text
- **راه‌های ارتباطی** — phone numbers (multiple), WhatsApp, Telegram, Instagram
- **فاکتور** — number prefix, invoice footer note, show/hide logo on invoice

Every field here maps directly and *only* to `company_settings` / `company_phone_numbers` / `invoice_settings` — nothing about company identity is ever hardcoded into the invoice template. Changes take effect immediately for every future invoice generation. (Whether past-generated invoices should reflect changes is the open question noted in the Invoice Flow section above.)

---

## Open Decisions Before Implementation

Both workflow questions that surfaced while designing these flows are now resolved:

1. ~~Payment → Status coupling~~ — **Resolved.** Status changes are always manual. The system only ever *suggests* a status change (via the dismissible zero-balance prompt in the Payment Flow), never applies one automatically.
2. ~~Company info snapshotting~~ — **Resolved.** Company info is snapshotted once per order at first invoice generation (`invoice_documents` table). See Invoice Flow above.

No open questions remain from this phase. Everything in this document reflects the approved Database Phase (plus the `invoice_documents` addendum above) and your stated principles without further assumptions.
