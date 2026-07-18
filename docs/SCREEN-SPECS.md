# SPCO Warehouse — Complete Screen Specification & Wireframes

**Status:** Phase 05 output. UI planning only — no code, no components, no APIs. This is the blueprint the implementation phase builds against, on top of the approved [UX-FLOW.md](./UX-FLOW.md) and [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md).

**Wireframe conventions used below** (ASCII cannot fully encode RTL rendering, so these rules are stated once here instead of repeated per screen):
- Frames represent a tablet in landscape, ~1280×800, read right-to-left.
- Back navigation sits at the **top-right**, chevron pointing right (RTL mirror of a top-left, left-pointing back button).
- Modal close (`×`) sits at the **top-left** (trailing edge).
- `[[ متن ]]` = primary button. `[ متن ]` = secondary/outline button. `⟨ متن ⟩` = status badge.
- `▤` = list/table icon, `＋` = add, `⚲` = search, `▾` = dropdown chevron (rendered at the left/trailing edge per Design System §8).
- All example data (names, amounts, products) is illustrative only. Company identity fields are shown as `[نام شرکت]` / `[لوگو]` since that data is never hardcoded — it always renders from Company Settings.

---

## 1. Login — ورود به سیستم

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                              [لوگو]                                   │
│                                                                        │
│                    ┌──────────────────────────────┐                  │
│                    │        ورود به سیستم           │                  │
│                    │                                │                  │
│                    │   نام کاربری                    │                  │
│                    │   ┌──────────────────────────┐ │                  │
│                    │   │                          │ │                  │
│                    │   └──────────────────────────┘ │                  │
│                    │                                │                  │
│                    │   رمز عبور                     │                  │
│                    │   ┌──────────────────────────┐👁│                  │
│                    │   │                          │ │                  │
│                    │   └──────────────────────────┘ │                  │
│                    │                                │                  │
│                    │   ┌──────────────────────────┐ │                  │
│                    │   │           ورود              │ │                  │
│                    │   └──────────────────────────┘ │                  │
│                    └──────────────────────────────┘                  │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Authenticate a staff member before anything else is reachable. Single-purpose gate screen.
- **Target User:** Every user.
- **Components:** Company logo (live from Settings), username field, password field with show/hide toggle, primary login button.
- **Buttons:** `[[ ورود ]]` (primary, full-width of the card).
- **Interaction Flow:** Tap username → type → tap password → type → tap ورود → on success, redirect to Dashboard with no intermediate screen.
- **Validation:** Both fields required before submit is attempted; empty-field taps show inline messages rather than disabling the button.
- **Error Messages:** `نام کاربری یا رمز عبور اشتباه است.` / `حساب شما غیرفعال شده است. با مدیر تماس بگیرید.`
- **Success Messages:** None shown — the redirect itself is the confirmation (an extra toast would only add delay).
- **Navigation:** App entry point; no back destination. Success → Dashboard.
- **UX Notes:** Username auto-focused on load. Session persists for the full shift — no aggressive timeout that interrupts an in-progress order.
- **Tablet Optimization:** Card centered with generous margins so it's comfortable in both portrait and landscape; fields 52px tall per Design System.
- **Estimated Clicks:** 3 (username, password, submit) + typing.
- **Future Improvements:** PIN/quick-switch login for shared tablets (explicitly deferred per Phase 01's decision).

---

## 2. Dashboard — داشبورد

```
┌──────────────────────────────────────────────────────────────────────┐
│  [نام کاربر: رضا کریمی]                              [لوگو] [خروج]     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │                                                              │    │
│   │                        ＋  سفارش جدید                        │    │
│   │                                                              │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                        │
│   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐    │
│   │   ▤  سفارش‌ها      │ │   👤 مشتریان      │ │   📦 محصولات      │    │
│   │   امروز: ۵ سفارش  │ │                  │ │                  │    │
│   └──────────────────┘ └──────────────────┘ └──────────────────┘    │
│                                                                        │
│   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐    │
│   │  ⚙ تنظیمات (مدیر) │ │ 👥 کاربران (مدیر) │ │  🛠 ابزارها       │    │
│   └──────────────────┘ └──────────────────┘ └──────────────────┘    │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Single home screen — one tap to every major action. `سفارش جدید` is the dominant tile since order creation is the entire point of the app.
- **Target User:** Everyone; admin-only tiles (تنظیمات, کاربران) hidden for warehouse-role accounts.
- **Components:** Header (username, logo, logout), primary CTA banner, secondary tile grid, optional lightweight stat ("امروز: ۵ سفارش").
- **Buttons:** `[[ ＋ سفارش جدید ]]`, tile taps for `سفارش‌ها` / `مشتریان` / `محصولات` / `تنظیمات` / `کاربران` / `ابزارها`.
- **Interaction Flow:** Tap any tile → navigate directly, no submenu.
- **Validation:** N/A.
- **Error Messages:** Only a silent, non-blocking failure if the optional stat fails to load — tiles are never blocked by it.
- **Success Messages:** N/A.
- **Navigation:** Root screen post-login; every other screen provides a way back here.
- **UX Notes:** Icon + Persian label on every tile, never icon-only. Role-based tile visibility, not role-based screen redesign — keeps the mental model consistent across roles.
- **Tablet Optimization:** Grid sized for thumb reach two-handed; primary CTA banner spans full width so it's reachable from either side.
- **Estimated Clicks:** 1.
- **Future Improvements:** A short "notifications" bell if Telegram/notification volume grows enough to need in-app visibility, not just Telegram.

---

## 3. Customers List — لیست مشتریان

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت              لیست مشتریان                  [[ ＋ مشتری جدید ]] │
├──────────────────────────────────────────────────────────────────────┤
│                                              جستجو بر اساس نام یا موبایل ⚲ │
│                                          ┌───────────────────────┐    │
│                                          │                       │    │
│                                          └───────────────────────┘    │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  علی محمدی                                     ۰۹۱۲۳۴۵۶۷۸۹   │     │
│  ├────────────────────────────────────────────────────────────┤     │
│  │  زهرا احمدی                                    ۰۹۳۵۱۱۲۲۳۳۴   │     │
│  ├────────────────────────────────────────────────────────────┤     │
│  │  فروشگاه نوزاد بهار                              ۰۲۱۸۸۷۷۶۶۵۵   │     │
│  └────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Find an existing customer or start creating a new one. Reused, in picker mode, as the customer-selection step of New Order.
- **Target User:** Warehouse staff (order building), admin (record management).
- **Components:** Search field, scrollable row list (name + mobile), `مشتری جدید` button fixed at top.
- **Buttons:** `[[ ＋ مشتری جدید ]]`; each row is itself fully tappable (no separate "open" button).
- **Interaction Flow:** Type to filter live (no submit button) → tap a row → open the customer profile (or, in picker mode, select and return to New Order).
- **Validation:** N/A (read/search only).
- **Error Messages:** Empty state: `مشتری‌ای یافت نشد` with `مشتری جدید` emphasized as the next step.
- **Success Messages:** N/A.
- **Navigation:** From Dashboard `مشتریان` tile, or invoked inline from New Order's customer step.
- **UX Notes:** In picker mode, "recently ordered" customers pin to the top of the list before any search is typed — the single biggest speed win here, since a small set of regulars likely accounts for most orders.
- **Tablet Optimization:** Row height ≥56px; search field auto-focused when entering picker mode from New Order.
- **Estimated Clicks:** 1 (tap a result).
- **Future Improvements:** Recently-ordered ranking could later factor in order frequency, not just recency.

---

## 4. Create Customer — ثبت مشتری جدید

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت                    ثبت مشتری جدید                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                                              نام مشتری *                │
│                                        ┌──────────────────────────┐   │
│                                        │                          │   │
│                                        └──────────────────────────┘   │
│                                                                        │
│                                              شماره موبایل *              │
│                                        ┌──────────────────────────┐   │
│                                        │                          │   │
│                                        └──────────────────────────┘   │
│                                                                        │
│                                              نوع پرداخت پیش‌فرض           │
│                                        ┌───────────┬──────────────┐   │
│                                        │   نقدی    │     چک       │   │
│                                        └───────────┴──────────────┘   │
│                                                                        │
│                                              یادداشت (اختیاری)          │
│                                        ┌──────────────────────────┐   │
│                                        │                          │   │
│                                        └──────────────────────────┘   │
│                                                                        │
│                          [ انصراف ]              [[ ذخیره ]]           │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Register a new customer. Reachable as a full screen (from Customers List) or a lightweight overlay (from mid-order, so order-building context is never lost).
- **Target User:** Warehouse staff (mid-order) or admin.
- **Components:** Name, Mobile, Default Payment Type (two-segment toggle), Notes.
- **Buttons:** `[ انصراف ]` / `[[ ذخیره ]]` — primary at the right (RTL leading edge) per Design System §12.
- **Interaction Flow:** Fill fields top-to-bottom → tap ذخیره → toast → auto-navigate back to wherever this was launched from (Customers List, or straight back into New Order with the new customer pre-selected).
- **Validation:** Name and Mobile required; inline error under the exact field on save attempt, not a pre-disabled button.
- **Error Messages:** `این فیلد الزامی است.` / `این شماره قبلاً ثبت شده است` (non-blocking, offers opening the existing record instead).
- **Success Messages:** `مشتری ثبت شد`.
- **Navigation:** From Customers List `مشتری جدید`, or inline from New Order's customer step.
- **UX Notes:** Max 3–4 visible fields, fits one tablet screen with no scrolling. Mobile field triggers numeric keypad.
- **Tablet Optimization:** Fields 52px tall, name field auto-focused on open.
- **Estimated Clicks:** 3 taps (name, mobile, save) + typing.
- **Future Improvements:** Duplicate-mobile detection could later suggest merging records if two customers share a household mobile number.

---

## 5. Edit Customer — ویرایش مشتری

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت                    ویرایش مشتری                              │
├──────────────────────────────────────────────────────────────────────┤
│                                              نام مشتری *                │
│                                        ┌──────────────────────────┐   │
│                                        │ علی محمدی                 │   │
│                                        └──────────────────────────┘   │
│                                              شماره موبایل *              │
│                                        ┌──────────────────────────┐   │
│                                        │ ۰۹۱۲۳۴۵۶۷۸۹              │   │
│                                        └──────────────────────────┘   │
│                                              نوع پرداخت پیش‌فرض           │
│                                        ┌───────────┬──────────────┐   │
│                                        │  ⦿ نقدی   │     چک       │   │
│                                        └───────────┴──────────────┘   │
│                                                                        │
│   سوابق: ۱۲ سفارش قبلی · آخرین سفارش: ۲ روز پیش                        │
│                                                                        │
│                          [ انصراف ]           [[ ذخیره تغییرات ]]       │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Update an existing customer's details, with light read-only order-history context.
- **Target User:** Admin mainly; warehouse staff for quick corrections.
- **Components:** Same fields as Create, pre-filled; a read-only history summary line.
- **Buttons:** `[ انصراف ]` / `[[ ذخیره تغییرات ]]`.
- **Interaction Flow:** Reached via Customers List → customer profile → Edit. Edit a field → save → toast → back to profile.
- **Validation:** Same as Create Customer.
- **Error Messages:** Same as Create Customer.
- **Success Messages:** `تغییرات ذخیره شد`.
- **Navigation:** Customers List → profile → Edit; back → profile.
- **UX Notes:** History line is orientation only — not a link into a full reports view (out of scope for v1).
- **Tablet Optimization:** Identical field layout/order to Create Customer for muscle-memory consistency.
- **Estimated Clicks:** 2–3 (edit field, save).
- **Future Improvements:** Tapping the history line could later deep-link into a filtered Order List for that customer.

---

## 6. Products List — لیست محصولات

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت              لیست محصولات                 [[ ＋ محصول جدید ]] │
├──────────────────────────────────────────────────────────────────────┤
│  همه   بادی‌ها   شلوارها   ست‌ها   کلاه‌ها        مدیریت دسته‌بندی‌ها ⚙   │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │   [تصویر]      │  │   [تصویر]      │  │   [تصویر]      │         │
│  │   خرس آبی      │  │   گل صورتی     │  │   ستاره زرد    │         │
│  │   ۴ قطعه       │  │   ۳ قطعه       │  │   ۴ قطعه       │         │
│  └────────────────┘  └────────────────┘  └────────────────┘         │
│  ┌────────────────┐  ┌────────────────┐                              │
│  │   [تصویر]      │  │   [تصویر]      │                              │
│  │   خرگوش کرم    │  │   فیل آبی      │                              │
│  │   ۴ قطعه       │  │   ۲ قطعه       │                              │
│  └────────────────┘  └────────────────┘                              │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Browse the Design catalog. General catalog management — New Order uses its own optimized picker (§11).
- **Target User:** Admin mostly (catalog upkeep); occasionally warehouse staff for lookups.
- **Components:** Category filter chips (with a `مدیریت دسته‌بندی‌ها` link opening a lightweight category-management modal — see note below), product photo grid.
- **Buttons:** `[[ ＋ محصول جدید ]]`; chips for filtering; `مدیریت دسته‌بندی‌ها` opens category CRUD inline.
- **Interaction Flow:** Tap a category chip to filter → tap a card → Product Details.
- **Validation:** N/A.
- **Error Messages:** Empty state per filter, same pattern as Customers List.
- **Success Messages:** N/A.
- **Navigation:** From Dashboard `محصولات` tile. Tapping a card → Product Details.
- **UX Notes:** **Product photos are always shown** on each card (per this phase's explicit requirement — a placeholder image renders for any product without a photo uploaded yet, so the grid never looks broken). Card grid, not a dense table, per Design System card rules.
- **Tablet Optimization:** 2–3 column grid depending on orientation.
- **Estimated Clicks:** 1 (tap a card).
- **Future Improvements:** Barcode/SKU-based search, as noted in the Database Phase's future-expansion section — flagged there as a later addition, unchanged here.

> **Reconciliation note:** Phase 03 designed Product Categories as its own screen; this phase's 18-screen list doesn't include it separately. Resolved here as a lightweight modal reached from this screen's filter bar, not a dedicated top-level screen — keeps the navigation set exactly as specified in this phase while preserving category CRUD.

> **Schema note:** product photos require an image field that does not yet exist on `Product` in the approved Prisma schema. Addressed as a schema addendum at the end of this document, the same way the Database Phase was extended for the invoice-snapshot decision.

---

## 7. Create Product — ثبت محصول جدید

```
Step 1/3                                                    ← بازگشت
┌──────────────────────────────────────────────────────────────────────┐
│                      اطلاعات محصول                                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                    نام طرح *            │
│                                              ┌──────────────────────┐ │
│                                              │ خرس آبی               │ │
│                                              └──────────────────────┘ │
│                                                    دسته‌بندی *          │
│                                              ┌──────────────────────┐▾│
│                                              │ بادی‌ها                │ │
│                                              └──────────────────────┘ │
│                                                    تصویر محصول          │
│                                              ┌──────────────────────┐ │
│                                              │   ＋ افزودن تصویر       │ │
│                                              └──────────────────────┘ │
│                                                    توضیحات (اختیاری)    │
│                                              ┌──────────────────────┐ │
│                                              └──────────────────────┘ │
│                                        [ انصراف ]        [[ مرحله بعد ]]│
└──────────────────────────────────────────────────────────────────────┘

Step 2/3 — قطعه‌ها                         Step 3/3 — سایز و قیمت هر قطعه
┌────────────────────────────┐            ┌────────────────────────────┐
│ ＋ افزودن قطعه               │            │  بادی                       │
│ ┌────────────────────────┐ │            │  ┌──────┬────────┬───────┐ │
│ │ بادی               ✕   │ │            │  │ سایز │قیمت(تومان)│بسته │ │
│ ├────────────────────────┤ │            │  ├──────┼────────┼───────┤ │
│ │ شلوار              ✕   │ │            │  │  ۰   │ ۱۸۰,۰۰۰ │  ۶   │ │
│ ├────────────────────────┤ │            │  │  ۱   │ ۱۸۰,۰۰۰ │  ۶   │ │
│ │ رامپر              ✕   │ │            │  │  ۲   │ ۱۹۰,۰۰۰ │  ۶   │ │
│ ├────────────────────────┤ │            │  │  ۳   │ ۱۹۰,۰۰۰ │  ۶   │ │
│ │ کلاه               ✕   │ │            │  └──────┴────────┴───────┘ │
│ └────────────────────────┘ │            │        کپی سایزها به: [شلوار▾]│
│ [ مرحله قبل ]  [[بعد]]      │            │ [ مرحله قبل ]  [[ذخیره محصول]]│
└────────────────────────────┘            └────────────────────────────┘
```

- **Purpose / Description:** Register a new Design and its full Piece → Size → Price/Pack-Size structure, as a 3-step wizard rather than one long form, since the data is inherently hierarchical.
- **Target User:** Admin.
- **Components:** Step 1 — name, category, photo upload, description. Step 2 — piece name list. Step 3 — per-piece size/price/pack-size grid, with a "copy sizes to another piece" shortcut.
- **Buttons:** `[ مرحله قبل ]` / `[[ مرحله بعد ]]` / `[[ ذخیره محصول ]]` on the final step; `[ انصراف ]` available throughout.
- **Interaction Flow:** Step 1 basic info → Step 2 add pieces by name → Step 3 fill size grid per piece (Pack Size pre-fills **6**) → Save.
- **Validation:** A piece with zero sizes, or a size with no price, blocks final save with a specific inline list of what's missing (e.g. `قیمت سایز ۲ شلوار مشخص نشده`).
- **Error Messages:** As above, plus standard required-field messages on Step 1.
- **Success Messages:** `محصول با موفقیت ثبت شد` → return to Products List with the new product highlighted.
- **Navigation:** From Products List `محصول جدید`; back arrow steps back through the wizard rather than exiting it entirely.
- **UX Notes:** Default Pack Size pre-filled as **6** on every new size row — the common case costs zero extra taps. `کپی سایزها` duplicates one piece's size/price table onto another piece, since many Designs likely reuse the same size/price structure across pieces.
- **Tablet Optimization:** Pack size uses large +/− steppers, not free typing.
- **Estimated Clicks:** Deliberately higher than most screens — this is a low-frequency, admin-only, correctness-over-speed screen.
- **Future Improvements:** Bulk-import products/prices from a spreadsheet, if catalog size grows large enough to make one-by-one entry impractical.

---

## 8. Edit Product — ویرایش محصول

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت                    ویرایش محصول                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                    نام طرح *            │
│                                              ┌──────────────────────┐ │
│                                              │ خرس آبی               │ │
│                                              └──────────────────────┘ │
│                                                    دسته‌بندی *          │
│                                              ┌──────────────────────┐▾│
│                                              │ بادی‌ها                │ │
│                                              └──────────────────────┘ │
│                                                    تصویر محصول          │
│                                              ┌──────────────────────┐ │
│                                              │   [تصویر فعلی] تغییر    │ │
│                                              └──────────────────────┘ │
│                                                    وضعیت                │
│                                              ┌───────────┬──────────┐ │
│                                              │ ⦿ فعال    │  غیرفعال  │ │
│                                              └───────────┴──────────┘ │
│                                                                        │
│                          [ انصراف ]              [[ ذخیره تغییرات ]]   │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Edit an *existing* product's own base fields (name, category, photo, active status). Piece/Size structure is managed on Product Details, not here — keeps this screen single-purpose.
- **Target User:** Admin.
- **Components:** Name, Category, Photo (replace), Active/Inactive toggle.
- **Buttons:** `[ انصراف ]` / `[[ ذخیره تغییرات ]]`.
- **Interaction Flow:** Edit a field → save → toast → back to Product Details.
- **Validation:** Name and category required. Setting a product Inactive while it has been used in past orders is allowed (it simply stops appearing in New Order's picker) — it is never deleted, matching the Database Phase's soft-delete design.
- **Error Messages:** Standard required-field messages.
- **Success Messages:** `تغییرات ذخیره شد`.
- **Navigation:** From Product Details' edit affordance; back → Product Details.
- **UX Notes:** Replacing the photo here follows the same "never overwrite the same file path" rule established for the company logo in the Design System — old orders that referenced this product by snapshot are unaffected either way, since order items snapshot the product name at order time regardless of catalog photo changes.
- **Tablet Optimization:** Same field layout as Create Product's Step 1, for consistency.
- **Estimated Clicks:** 2–3.
- **Future Improvements:** None specific — this is intentionally a minimal, low-frequency screen.

---

## 9. Product Details — جزئیات محصول

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت        خرس آبی — بادی‌ها          [ویرایش] [[＋ افزودن قطعه]]│
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ ▾ بادی                                                       │     │
│  │   ┌──────┬────────────┬──────────────┬─────────┐            │     │
│  │   │ سایز │ قیمت (تومان) │ سایز بسته پیش‌فرض │ وضعیت   │            │     │
│  │   ├──────┼────────────┼──────────────┼─────────┤            │     │
│  │   │  ۰   │  ۱۸۰,۰۰۰   │      ۶       │  فعال   │            │     │
│  │   │  ۱   │  ۱۸۰,۰۰۰   │      ۶       │  فعال   │            │     │
│  │   │  ۲   │  ۱۹۰,۰۰۰   │      ۶       │  فعال   │            │     │
│  │   │  ۳   │  ۱۹۰,۰۰۰   │      ۶       │  فعال   │            │     │
│  │   └──────┴────────────┴──────────────┴─────────┘            │     │
│  ├────────────────────────────────────────────────────────────┤     │
│  │ ▸ شلوار                                                       │     │
│  ├────────────────────────────────────────────────────────────┤     │
│  │ ▸ رامپر                                                       │     │
│  ├────────────────────────────────────────────────────────────┤     │
│  │ ▸ کلاه   ⚠ قیمتی تعریف نشده                                  │     │
│  └────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** The full management hub for one Design's Piece → Size → Price/Pack-Size structure — the direct UI for the catalog hierarchy defined in the Database Phase.
- **Target User:** Admin.
- **Components:** Expandable (accordion) piece rows, each revealing its size table; per-row inline edit of price/pack-size; `افزودن قطعه`/`افزودن سایز` actions.
- **Buttons:** `[ویرایش]` (→ Edit Product, for base fields), `[[＋ افزودن قطعه]]`; inline per-cell edit within each size table.
- **Interaction Flow:** Tap a piece row to expand/collapse → tap a price/pack-size cell to edit inline (autosave on blur) → tap `افزودن سایز` within a piece for a new size row.
- **Validation:** A piece with no sizes configured is visually flagged (`⚠ قیمتی تعریف نشده`) so it can never silently be orderable with a missing price.
- **Error Messages:** Deleting a piece/size that has order history is blocked; the system offers deactivation (`غیرفعال‌سازی`) instead.
- **Success Messages:** Inline confirmation per field (autosave-on-blur pattern — a small checkmark flash, not a full toast per keystroke).
- **Navigation:** From Products List card tap; back → Products List.
- **UX Notes:** Pack size uses +/− steppers, not free typing, since it's almost always a small integer.
- **Tablet Optimization:** Accordion keeps the screen scannable even for a Design with many pieces; touch targets on the inline table match Design System table row-height rules (56px).
- **Estimated Clicks:** 3–5 to fully configure one piece's sizes.
- **Future Improvements:** Bulk price adjustment (e.g. "+5% on all sizes") if repricing an entire Design becomes a frequent task.

---

## 10. Order List — لیست سفارش‌ها

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت              لیست سفارش‌ها                [[ ＋ سفارش جدید ]]│
├──────────────────────────────────────────────────────────────────────┤
│  همه فعال   در انتظار پرداخت   در حال آماده‌سازی   آماده ارسال   تکمیل‌شده │
├──────────────────────────────────────────────────────────────────────┤
│ شماره سفارش │ مشتری         │ مبلغ کل   │ مانده     │ وضعیت              │
├────────────┼───────────────┼──────────┼──────────┼────────────────────┤
│ INV-1405-7 │ علی محمدی      │۲,۴۰۰,۰۰۰│    ۰      │⟨تکمیل‌شده⟩          │
│ INV-1405-8 │ زهرا احمدی     │۱,۸۰۰,۰۰۰│ ۶۰۰,۰۰۰ ●│⟨در انتظار پرداخت⟩   │
│ INV-1405-9 │ فروشگاه بهار   │۵,۱۰۰,۰۰۰│    ۰      │⟨در حال آماده‌سازی⟩   │
├──────────────────────────────────────────────────────────────────────┤
│                    ▶ قبلی        صفحه ۱ از ۳        بعدی ◀              │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Browse/search orders to check status, resume, collect payment, or print. Defaults to active orders, not full history.
- **Target User:** All staff.
- **Components:** Status filter chips (default: `همه فعال`, excluding Completed/Cancelled), order table with order #, customer, total, remaining balance, status badge.
- **Buttons:** `[[ ＋ سفارش جدید ]]`; filter chips; pagination (`▶ قبلی` / `بعدی ◀` — note "next" points left per Design System §9's RTL pagination rule).
- **Interaction Flow:** Optional filter tap → tap a row → Order Details.
- **Validation:** N/A.
- **Error Messages:** Empty state per active filter, e.g. `سفارشی در انتظار پرداخت نیست`.
- **Success Messages:** N/A.
- **Navigation:** From Dashboard `سفارش‌ها` tile.
- **UX Notes:** A filled dot (`●`) next to the remaining-balance figure flags orders with an outstanding balance — collecting payment is a recurring task, so this needs to be scannable at a glance, not just present in a column.
- **Tablet Optimization:** Row height 56px, horizontal cell padding ≥16px per Design System table rules.
- **Estimated Clicks:** 1–2.
- **Future Improvements:** A date-range filter once order volume is high enough that status filtering alone isn't sufficient.

---

## 11. New Order — ثبت سفارش جدید

**This is the most important screen in the application.** Design goal: build a large, multi-product order using mostly taps, minimal typing, minimal screens. Full behavioral rationale is in [UX-FLOW.md § Order Creation Flow](./UX-FLOW.md); this section is its exact screen-by-screen wireframe.

### 11a. Step 1 — انتخاب مشتری (Select Customer)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← انصراف            سفارش جدید — انتخاب مشتری                        │
├──────────────────────────────────────────────────────────────────────┤
│                                              جستجوی مشتری ⚲            │
│                                        ┌──────────────────────────┐   │
│                                        └──────────────────────────┘   │
│                                                    [[ ＋ مشتری جدید ]] │
│  اخیراً سفارش داده‌اند:                                                 │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  علی محمدی          ۰۹۱۲۳۴۵۶۷۸۹                             │     │
│  │  فروشگاه نوزاد بهار   ۰۲۱۸۸۷۷۶۶۵۵                            │     │
│  │  زهرا احمدی          ۰۹۳۵۱۱۲۲۳۳۴                             │     │
│  └────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

### 11b. Step 2 — انتخاب محصول و قطعه (Select Product → Piece)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت    سفارش جدید — علی محمدی        ۳ قلم · ۹۵۰,۰۰۰ تومان     │
├──────────────────────────────────────────────────────────────────────┤
│  همه   بادی‌ها   شلوارها   کلاه‌ها                     جستجوی طرح ⚲    │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│  │ [تصویر]    │ │ [تصویر]    │ │ [تصویر]    │ │ [تصویر]    │        │
│  │ خرس آبی    │ │ گل صورتی   │ │ ستاره زرد  │ │ خرگوش کرم  │        │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘        │
│                                                                        │
│  ▼ خرس آبی — انتخاب قطعه                                              │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────┐│
│  │     بادی        │ │     شلوار       │ │     رامپر       │ │  کلاه  ││
│  └────────────────┘ └────────────────┘ └────────────────┘ └────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

### 11c. Step 3 — سایز، نوع سفارش و تعداد (Size × Pack/Unit × Quantity — the core interaction)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت    خرس آبی — شلوار              ۳ قلم · ۹۵۰,۰۰۰ تومان       │
├──────────────────────────────────────────────────────────────────────┤
│  سایز ۰    ┌─────────┬─────────┐   تعداد: ┌───┬────────┬───┐          │
│            │[⦿ بسته] │  عدد    │          │ − │   ۰    │ + │  = ۰ تومان│
│            └─────────┴─────────┘          └───┴────────┴───┘          │
├──────────────────────────────────────────────────────────────────────┤
│  سایز ۱    ┌─────────┬─────────┐   تعداد: ┌───┬────────┬───┐          │
│            │[⦿ بسته] │  عدد    │          │ − │   ۳    │ + │           │
│            └─────────┴─────────┘          └───┴────────┴───┘          │
│            ۳ بسته = ۱۸ عدد — ۳,۲۴۰,۰۰۰ تومان                          │
├──────────────────────────────────────────────────────────────────────┤
│  سایز ۲    ┌─────────┬─────────┐   تعداد: ┌───┬────────┬───┐          │
│            │  بسته    │[⦿ عدد]  │          │ − │   ۸    │ + │           │
│            └─────────┴─────────┘          └───┴────────┴───┘          │
│            ۸ عدد — ۱,۵۲۰,۰۰۰ تومان                                     │
├──────────────────────────────────────────────────────────────────────┤
│  سایز ۳    ┌─────────┬─────────┐   تعداد: ┌───┬────────┬───┐          │
│            │[⦿ بسته] │  عدد    │          │ − │   ۰    │ + │           │
│            └─────────┴─────────┘          └───┴────────┴───┘          │
├──────────────────────────────────────────────────────────────────────┤
│                                          [[ افزودن به سفارش (۲ قلم) ]]  │
└──────────────────────────────────────────────────────────────────────┘
```

### 11d. Step 4 — بازبینی سفارش (Review cart, sticky submit)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت              سفارش جدید — علی محمدی                        │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ خرس آبی — شلوار — سایز ۱ — ۳ بسته (۱۸ عدد)   ۳,۲۴۰,۰۰۰   ✎ ✕│     │
│  ├────────────────────────────────────────────────────────────┤     │
│  │ خرس آبی — شلوار — سایز ۲ — ۸ عدد             ۱,۵۲۰,۰۰۰   ✎ ✕│     │
│  ├────────────────────────────────────────────────────────────┤     │
│  │ گل صورتی — کلاه — سایز ۰ — ۲ بسته (۱۲ عدد)     ۹۶۰,۰۰۰   ✎ ✕│     │
│  └────────────────────────────────────────────────────────────┘     │
│                                              [[ ＋ افزودن آیتم دیگر ]] │
├──────────────────────────────────────────────────────────────────────┤
│  جمع کل: ۵,۷۲۰,۰۰۰ تومان                    [[ ثبت سفارش ]]           │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Build and submit a new order in as few taps as possible, then flow directly into payment.
- **Target User:** Warehouse staff — this is the screen used dozens of times a day.
- **Components:** Customer picker (11a), product/piece picker with photos (11b), per-piece parallel size rows with independent Pack/Unit toggle + stepper (11c), running cart with sticky total + submit (11d).
- **Buttons:** `[[ ＋ مشتری جدید ]]`, product/piece cards, per-size Pack/Unit toggle, `+`/`−` steppers, `[[ افزودن به سفارش ]]`, `[[ ＋ افزودن آیتم دیگر ]]`, `[[ ثبت سفارش ]]`.
- **Interaction Flow (full path):**
  1. Tap `＋ سفارش جدید` (Dashboard). **1 tap.**
  2. Pick a customer — recent customer row = **1 tap**, or `＋ مشتری جدید` opens the Create Customer overlay and returns straight back here with the customer selected.
  3. Tap a category chip (optional) → tap a product photo → tap a piece.
  4. **All configured sizes for that piece appear at once**, each with its own Pack/Unit toggle (defaults to **بسته**, since Pack-of-6 is the common case) and quantity stepper. Fill in as many size rows as needed for this piece.
  5. Tap `افزودن به سفارش` **once** — every non-zero size row across the whole piece is added as a separate order item in a single action. This is the single biggest speed lever in the app: two sizes of the same piece cost one "add" tap, not two round trips through the picker.
  6. Repeat steps 3–5 for the next product/piece via `＋ افزودن آیتم دیگر`.
  7. Review the cart — tap any line to edit (✎) or remove (✕) directly, no separate edit-mode toggle.
  8. Tap `[[ ثبت سفارش ]]`, sticky at the bottom regardless of scroll position.
  9. On success, the order is created (status `در انتظار پرداخت`, order number generated) and the flow moves straight into Register Payment, with a visible `پرداخت بعداً` escape hatch.
- **Validation:** At least one item required; every item quantity > 0. A failed submit points at the specific offending line, never a generic error.
- **Error Messages:** `حداقل یک آیتم باید اضافه شود.` / field-specific errors on the inline customer-create overlay.
- **Success Messages:** Brief confirmation on `افزودن به سفارش` (e.g. a momentary highlight on the newly added cart lines) — no blocking toast, since staff need to keep moving. Full `سفارش ثبت شد` toast on final submit.
- **Navigation:** From Dashboard or Order List `سفارش جدید`. On submit → Register Payment → Order Details.
- **UX Notes:** A persistent header strip (`۳ قلم · ۹۵۰,۰۰۰ تومان`) shows running item count and subtotal through every step, so staff always see progress without a separate summary tap.
- **Tablet Optimization:** Size rows sized for two-handed thumb operation with the Pack/Unit toggle and stepper both within comfortable reach; product/piece cards sized generously for photo visibility (see note below).
- **Estimated Clicks:** ≈15–18 for a moderately complex order (3 products, 5 size-lines) — see the full breakdown in UX-FLOW.md.
- **Future Improvements:** Barcode scanning to jump straight to a product/piece/size instead of browsing the grid (explicitly requested as a "later" capability, not v1) — the picker step is designed so a barcode scan could substitute for steps 3–4 without changing steps 1, 5–9 at all.

> **Product photo requirement:** this phase states product photos must always be visible during order creation, which the Products List screen (§6) and this picker both reflect. See the schema addendum at the end of this document.

---

## 12. Order Details — جزئیات سفارش

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت      سفارش INV-1405-000008 — زهرا احمدی    ⟨در انتظار پرداخت⟩│
├──────────────────────────────────────────────────────────────────────┤
│  جمع کل: ۱,۸۰۰,۰۰۰   پرداخت‌شده: ۱,۲۰۰,۰۰۰   مانده: ۶۰۰,۰۰۰ تومان     │
├──────────────────────────────────────────────────────────────────────┤
│ خرس آبی — بادی — سایز ۱ — ۲ بسته (۱۲ عدد)               ۲,۱۶۰,۰۰۰      │
│ گل صورتی — کلاه — سایز ۰ — ۵ عدد                          ۹۵۰,۰۰۰      │
│ ... (فقط قابل مشاهده — ویرایش فقط در وضعیت «در انتظار پرداخت»)          │
├──────────────────────────────────────────────────────────────────────┤
│ [[ ＋ افزودن پرداخت ]]   [ چاپ / اشتراک‌گذاری فاکتور ]   [ لغو سفارش ]  │
├──────────────────────────────────────────────────────────────────────┤
│ تغییر وضعیت به:  [در حال آماده‌سازی] [آماده ارسال] [تکمیل‌شده]           │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Single source of truth for one order — items, live totals, payment status, and every action taken on it.
- **Target User:** All staff.
- **Components:** Header with status badge, Total/Paid/Remaining strip (always computed live from payments, never cached), read-only item list once past `در انتظار پرداخت`, action row, manual status-change row.
- **Buttons:** `[[＋ افزودن پرداخت]]`, `[چاپ / اشتراک‌گذاری فاکتور]`, `[لغو سفارش]` (visually separated, destructive styling), manual status buttons.
- **Interaction Flow:** View → optionally tap one action. Status changes are **always manual** — the system never applies one automatically; the only system-initiated nudge is the dismissible full-payment suggestion described in Register Payment (§13).
- **Validation:** Cancelling a Completed order is blocked with an explanation.
- **Error Messages:** `سفارش‌های تکمیل‌شده قابل لغو نیستند.`
- **Success Messages:** Toast on every state-changing action, e.g. `وضعیت به «آماده ارسال» تغییر کرد`.
- **Navigation:** From Order List row tap, or auto-opened right after New Order completes.
- **UX Notes:** Item list is editable only while status is `در انتظار پرداخت`; past that point, changing items requires an explicit "edit order" action rather than a silent side-channel edit, to protect the order-item snapshot integrity established in the Database Phase.
- **Tablet Optimization:** Action buttons sized and spaced per Design System touch rules; the Total/Paid/Remaining strip stays visible without scrolling.
- **Estimated Clicks:** 1 to view, up to 3 to perform one action.
- **Future Improvements:** An activity/audit timeline (who changed what, when) once the app has enough usage history to make that view worthwhile.

---

## 13. Register Payment — ثبت پرداخت

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت              ثبت پرداخت — سفارش INV-1405-000008              │
├──────────────────────────────────────────────────────────────────────┤
│  مانده فعلی: ۶۰۰,۰۰۰ تومان                                            │
├──────────────────────────────────────────────────────────────────────┤
│  روش پرداخت    ┌───────────────┬───────────────┐                      │
│                │   [⦿ نقدی]    │      چک       │                      │
│                └───────────────┴───────────────┘                      │
├──────────────────────────────────────────────────────────────────────┤
│                ┌────────────────┐ ┌────────────────┐ ┌──────────────┐│
│                │  پیش‌پرداخت      │ │ تسویه باقیمانده │ │[[تسویه کامل]]││
│                └────────────────┘ └────────────────┘ └──────────────┘│
├──────────────────────────────────────────────────────────────────────┤
│  مبلغ (تومان)                                                          │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                          ۶۰۰,۰۰۰                               │    │
│  └──────────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────┤
│                                              [[ ثبت پرداخت ]]           │
└──────────────────────────────────────────────────────────────────────┘
```

Cheque method swaps the amount block for:

```
│  شماره چک                              تاریخ سررسید (جلالی)             │
│  ┌────────────────────────┐            ┌────────────────────────┐     │
│  └────────────────────────┘            └────────────────────────┘     │
```

Post-submit, if this payment brings the balance to exactly zero:

```
┌──────────────────────────────────────────────────────────────────────┐
│  ✓ این سفارش به طور کامل پرداخت شده است.                              │
│    وضعیت به «در حال آماده‌سازی» تغییر یابد؟                             │
│                                                                        │
│                      [ فعلاً نه ]        [[ بله، تغییر بده ]]           │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Record a payment against an order. Reached from Order Details, or as the natural final step of New Order.
- **Target User:** Whoever is at the counter when money changes hands.
- **Components:** Current-balance header, Method toggle (نقدی/چک), Cash sub-type shortcuts (پیش‌پرداخت/تسویه باقیمانده/تسویه کامل — each pre-fills the amount, `تسویه کامل` visually largest), amount field (or cheque number + Jalali due date for چک).
- **Buttons:** `[[ ثبت پرداخت ]]`; the three cash sub-type buttons double as amount shortcuts.
- **Interaction Flow:** Pick method → (cash) pick a sub-type or type an amount / (cheque) enter number + due date → تبت پرداخت → balance updates immediately on-screen → if balance is now zero, the non-blocking status-suggestion prompt appears (see UX-FLOW.md's Payment Flow for its exact wording and behavior — it never changes anything by itself).
- **Validation:** Amount exceeding the remaining balance triggers a non-blocking overpayment confirm (legitimate scenario, not disallowed). Cheque number/date required when method is چک.
- **Error Messages:** `این فیلد الزامی است.` / overpayment confirm copy: `مبلغ وارد شده بیشتر از مانده است. ادامه می‌دهید؟`
- **Success Messages:** `پرداخت ثبت شد` with the updated remaining balance shown immediately, before navigating away.
- **Navigation:** From Order Details `افزودن پرداخت`, or automatically as the payment step after New Order submission.
- **UX Notes:** The system never changes order status by itself — see the suggestion prompt above, which is a shortcut to the same manual action available on Order Details, not an automatic change.
- **Tablet Optimization:** Amount field live-formats as Persian-grouped Toman while typing; large numeric keypad triggered automatically.
- **Estimated Clicks:** 2–4.
- **Future Improvements:** Multiple partial cheques recorded in one flow, if splitting a balance across several post-dated cheques turns out to be a common real-world pattern.

---

## 14. Invoice Preview — پیش‌نمایش فاکتور

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت                    پیش‌نمایش فاکتور                          │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ [لوگو]                                    شماره: INV-1405-8   │     │
│  │ [نام شرکت]                                 تاریخ: ۱۴۰۵/۰۴/۲۶  │     │
│  │ [آدرس شرکت]                                                   │     │
│  ├────────────────────────────────────────────────────────────┤     │
│  │ مشتری: زهرا احمدی        موبایل: ۰۹۳۵۱۱۲۲۳۳۴                  │     │
│  ├──────────────┬──────┬──────┬────────┬──────────┬────────────┤     │
│  │ محصول        │ قطعه │ سایز │ نوع     │ تعداد     │ مبلغ         │     │
│  ├──────────────┼──────┼──────┼────────┼──────────┼────────────┤     │
│  │ خرس آبی      │ بادی │  ۱   │ بسته   │ ۲ (۱۲ عدد)│  ۲,۱۶۰,۰۰۰   │     │
│  │ گل صورتی     │ کلاه │  ۰   │ عدد    │    ۵      │    ۹۵۰,۰۰۰   │     │
│  ├──────────────┴──────┴──────┴────────┴──────────┴────────────┤     │
│  │                                      جمع کل:      ۱,۸۰۰,۰۰۰   │     │
│  │                                      پرداخت‌شده:   ۱,۲۰۰,۰۰۰   │     │
│  │                                      مانده:          ۶۰۰,۰۰۰   │     │
│  ├────────────────────────────────────────────────────────────┤     │
│  │ [متن فوتر شرکت]        📞 [شماره تماس]  ✆ [واتساپ]  ✈ [تلگرام]│     │
│  └────────────────────────────────────────────────────────────┘     │
├──────────────────────────────────────────────────────────────────────┤
│      [چاپ]          [دانلود PDF]          [اشتراک‌گذاری در واتساپ]     │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Render the invoice exactly as it will print/export before handing it off — includes company logo, customer info, every order item's Product/Piece/Size/Order-Type/quantity/amount, totals, payment summary, and footer contact info, per this phase's explicit content requirement.
- **Target User:** All staff.
- **Components:** As wireframed — header block (logo, company identity, invoice number, Jalali date), customer block, item table, totals/payment-summary block, footer (contact channels + footer text).
- **Buttons:** `[چاپ]`, `[دانلود PDF]`, `[اشتراک‌گذاری در واتساپ/تلگرام]` — three explicit labeled actions, not a generic icon-only share sheet.
- **Interaction Flow:** Opens automatically right after New Order's first invoice generation, or from Order Details thereafter. Choosing an action does not require a confirmation dialog (non-destructive, cheap to redo).
- **Validation:** Generation is blocked with a one-time message if Company Settings has no company name configured yet — never prints a blank header.
- **Error Messages:** `اطلاعات شرکت کامل نیست. ابتدا در تنظیمات وارد کنید.` / PDF generation failure → explicit retry, never a silent failure.
- **Success Messages:** Native share sheet typically self-confirms; brief toast otherwise.
- **Navigation:** From Order Details, or automatically post-order-creation.
- **UX Notes:** On an order's **first** invoice generation, all company-identity fields shown here are frozen into a snapshot (per the Phase 03 addendum) — every later re-open of this exact invoice reads that frozen snapshot, not live Company Settings, even if the company info changes afterward.
- **Tablet Optimization:** Pinch-to-zoom enabled on the rendered preview so fine print can be checked before handing the invoice to a customer.
- **Estimated Clicks:** 1.
- **Future Improvements:** A "proforma" watermarked preview mode before the order is fully paid, if the business wants to visually distinguish a pre-invoice from a final invoice.

---

## 15. Company Settings — تنظیمات شرکت

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت                    تنظیمات شرکت                              │
├──────────────────────────────────────────────────────────────────────┤
│  اطلاعات شرکت                                                          │
│  نام شرکت *                                        لوگو                │
│  ┌──────────────────────────┐                     ┌────────────────┐ │
│  └──────────────────────────┘                     │  [پیش‌نمایش]     │ │
│  آدرس                                              │  تغییر لوگو      │ │
│  ┌──────────────────────────┐                     └────────────────┘ │
│  └──────────────────────────┘                                        │
├──────────────────────────────────────────────────────────────────────┤
│  راه‌های ارتباطی                                                       │
│  شماره‌های تماس                                          [＋ افزودن شماره]│
│  ┌──────────────────────────────────────────────┐  ✕                 │
│  │ ۰۲۱۸۸۷۷۶۶۵۵ — فروش                             │                   │
│  └──────────────────────────────────────────────┘                   │
│  واتساپ ┌────────────────┐  تلگرام ┌────────────────┐  اینستاگرام ┌──┐ │
│         └────────────────┘         └────────────────┘             └──┘ │
├──────────────────────────────────────────────────────────────────────┤
│  تنظیمات فاکتور                                                       │
│  پیشوند شماره فاکتور     متن فوتر فاکتور               نمایش لوگو ⦿ روشن│
│  ┌────────────┐          ┌────────────────────────┐                  │
│  │    INV     │          │                          │                  │
│  └────────────┘          └────────────────────────┘                  │
├──────────────────────────────────────────────────────────────────────┤
│                                              [[ ذخیره تنظیمات ]]        │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Edit every piece of business identity shown on the app and on invoices — nothing hardcoded, per the standing requirement restated in this phase.
- **Target User:** Admin only.
- **Components:** Three clearly sub-headed groups — اطلاعات شرکت / راه‌های ارتباطی / تنظیمات فاکتور — matching the Settings Flow defined in UX-FLOW.md.
- **Buttons:** `[[ ذخیره تنظیمات ]]`; per-phone-number `✕` remove and `＋ افزودن شماره` add.
- **Interaction Flow:** Edit any field(s) → ذخیره تنظیمات → toast → takes effect immediately for every **future** invoice generation (past invoices are unaffected — see §14).
- **Validation:** Invalid phone format → inline, non-blocking warning. Logo file too large/wrong type → inline error naming the limit.
- **Error Messages:** `فرمت شماره تماس صحیح نیست.` / `حجم فایل لوگو بیش از حد مجاز است.`
- **Success Messages:** `تنظیمات ذخیره شد`.
- **Navigation:** From Dashboard `تنظیمات` tile (admin-only).
- **UX Notes:** Logo preview renders live at the exact aspect ratio it appears on the invoice. A soft warning appears if the invoice number prefix is changed mid-year, since that affects all future order numbers.
- **Tablet Optimization:** Grouped sub-headers keep this low-frequency, high-consequence screen legible rather than one long scrolling form.
- **Estimated Clicks:** ~1 tap per changed field + 1 save.
- **Future Improvements:** Multiple named logo variants (e.g. a monochrome version for print) if invoice branding needs evolve.

---

## 16. User Management — مدیریت کاربران

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت              مدیریت کاربران              [[ ＋ کاربر جدید ]] │
├──────────────────────────────────────────────────────────────────────┤
│  نام                  نام کاربری     نقش          وضعیت                │
├──────────────────────┼──────────────┼────────────┼─────────────────┤
│  رضا کریمی            reza.k        انباردار      ⟨فعال⟩   [غیرفعال‌سازی]│
│  مریم صادقی           maryam.s      مدیر          ⟨فعال⟩   [غیرفعال‌سازی]│
│  حسین رضایی           hossein.r     انباردار      ⟨غیرفعال⟩            │
└──────────────────────────────────────────────────────────────────────┘
```

New-user overlay:

```
┌────────────────────────────────────────┐
│  ＋ کاربر جدید                      ✕   │
├────────────────────────────────────────┤
│  نام کامل *          ┌──────────────┐   │
│                      └──────────────┘   │
│  نام کاربری *        ┌──────────────┐   │
│                      └──────────────┘   │
│  رمز عبور *          ┌──────────────┐   │
│                      └──────────────┘   │
│  نقش                 ┌────────┬───────┐ │
│                      │⦿انباردار│ مدیر │ │
│                      └────────┴───────┘ │
│         [ انصراف ]        [[ ذخیره ]]   │
└────────────────────────────────────────┘
```

- **Purpose / Description:** Admin creates and deactivates staff accounts.
- **Target User:** Admin only.
- **Components:** User table (name, username, role, status), `کاربر جدید` overlay form.
- **Buttons:** `[[ ＋ کاربر جدید ]]`, per-row `[غیرفعال‌سازی]`, `[[ ذخیره ]]` in the overlay.
- **Interaction Flow:** Tap کاربر جدید → fill overlay fields → ذخیره → toast → new row appears. Deactivation requires a confirmation tap.
- **Validation:** Duplicate username → inline error. Weak/short password → inline requirement hint.
- **Error Messages:** `این نام کاربری قبلاً استفاده شده است.` / `رمز عبور باید حداقل ۶ کاراکتر باشد.`
- **Success Messages:** Toast on create/deactivate.
- **Confirmation dialog:** `این کاربر غیرفعال شود و دیگر نتواند وارد شود؟`
- **Navigation:** From Dashboard `کاربران` tile (admin-only).
- **UX Notes:** Password reset is a distinct explicit action (`تغییر رمز عبور`), never silently editable inline, to avoid accidental resets. Deactivation, not deletion — preserves historical `created_by` references on old orders/payments.
- **Tablet Optimization:** Role selected via a two-option chip control, not a dropdown.
- **Estimated Clicks:** 4–6 to create a user.
- **Future Improvements:** PIN/quick-switch credentials management, once that login mode is built (Phase 01 explicitly deferred it, not this phase).

---

## 17. Utilities — ابزارها

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت                        ابزارها                               │
├──────────────────────────────────────────────────────────────────────┤
│   ┌────────────────────────────────────────────────────────────┐    │
│   │                  📄  تبدیل XPS به PDF                        │    │
│   └────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

XPS → PDF tool:

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت                    تبدیل XPS به PDF                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                    ┌──────────────────────────────┐                  │
│                    │      انتخاب فایل XPS ...        │                  │
│                    └──────────────────────────────┘                  │
│                                                                        │
│                          [[ تبدیل به PDF ]]                            │
│                                                                        │
│                     ⟳ در حال تبدیل...                                 │
│                                                                        │
│                    [ دانلود فایل PDF ]                                 │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Landing menu for miscellaneous internal tools — currently just XPS→PDF — so future tools land here without redesigning the Dashboard.
- **Target User:** Admin/office staff.
- **Components:** Tile menu (§17 top); file picker, convert button, progress indicator, download button (XPS→PDF sub-screen).
- **Buttons:** `[[ تبدیل XPS به PDF ]]` tile; `انتخاب فایل`, `[[ تبدیل به PDF ]]`, `[ دانلود فایل PDF ]`.
- **Interaction Flow:** Tile → choose file → تبدیل به PDF → progress state → دانلود.
- **Validation:** Wrong file type selected → inline error before attempting conversion.
- **Error Messages:** `فایل انتخاب‌شده معتبر نیست.` / `تبدیل با خطا مواجه شد. دوباره تلاش کنید.`
- **Success Messages:** `تبدیل با موفقیت انجام شد` with the result immediately offered for download.
- **Navigation:** From Dashboard `ابزارها` tile.
- **UX Notes:** Visible progress state (`⟳ در حال تبدیل...`) during conversion — a frozen-looking screen erodes trust for this audience.
- **Tablet Optimization:** File picker uses the native Android file chooser; large convert/download buttons.
- **Estimated Clicks:** 3 (choose file, convert, download).
- **Future Improvements:** This screen's whole purpose is to absorb future tools without redesign — the next entry here is undefined until requested.

---

## 18. Notifications History — تاریخچه اعلان‌ها

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← بازگشت              تاریخچه اعلان‌ها                                 │
├──────────────────────────────────────────────────────────────────────┤
│  همه   ارسال‌شده   ناموفق                                              │
├──────────────────────────────────────────────────────────────────────┤
│ زمان         │ رویداد              │ سفارش       │ وضعیت              │
├──────────────┼─────────────────────┼─────────────┼────────────────────┤
│ ۱۴۰۵/۰۴/۲۶   │ ثبت سفارش جدید      │ INV-1405-9  │ ⟨ارسال‌شده⟩         │
│ ۱۴۰۵/۰۴/۲۶   │ دریافت پرداخت       │ INV-1405-8  │ ⟨ارسال‌شده⟩         │
│ ۱۴۰۵/۰۴/۲۵   │ ثبت سفارش جدید      │ INV-1405-7  │ ⟨ناموفق⟩ ⓘ         │
└──────────────────────────────────────────────────────────────────────┘
```

- **Purpose / Description:** Read-only audit log of Telegram notifications the system attempted to send — surfaces the `notification_events` table from the Database Phase so a failed notification is never silently invisible.
- **Target User:** Admin.
- **Components:** Status filter chips (همه / ارسال‌شده / ناموفق), event table (time, event type, related order, status).
- **Buttons:** Filter chips; tapping a related order number opens that Order Details; a failed row's `ⓘ` reveals the error message.
- **Interaction Flow:** Filter (optional) → tap `ⓘ` on a failed row to see why, or tap the order number to jump to that order.
- **Validation:** N/A — read-only.
- **Error Messages:** N/A (this screen displays errors from other flows, it doesn't produce its own).
- **Success Messages:** N/A.
- **Navigation:** From Dashboard, admin-only — not surfaced as a top-level tile in the v1 Dashboard wireframe (§2) since it's a low-frequency diagnostic screen; reachable via `تنظیمات` or a small link there, avoiding Dashboard clutter for a screen the founding brief didn't ask to be a primary tile.
- **UX Notes:** Times shown in Jalali, consistent with the rest of the app.
- **Tablet Optimization:** Same table conventions as Order List (§10) for consistency.
- **Estimated Clicks:** 1–2.
- **Future Improvements:** A manual "retry send" action on failed notifications, once Telegram integration is live and failure patterns are understood.

> **Placement note:** the Dashboard wireframe in §2 doesn't show a dedicated tile for this screen, to avoid diluting the tile grid with a low-frequency admin/diagnostic view. It's reachable from Company Settings or Utilities. Flagging this placement choice explicitly in case a dedicated Dashboard tile is preferred instead.

---

## Database Phase Addendum — Product Photos

This phase's explicit requirement ("Product photos should always be visible") is new information the Database Phase didn't have — the current `Product` model has no image field. Consistent with how the invoice-snapshot decision required a schema addition earlier, the same treatment applies here:

- Add `imageFilePath String? @map("image_file_path") @db.VarChar(255)` to the `Product` model — nullable, since a product can exist before a photo is uploaded; the UI renders a placeholder image in that case rather than requiring one before a product can be saved.
- Governed by the same immutable-file-path rule already documented for the company logo in the Design System: replacing a product's photo must write a new file, never overwrite the existing path, so any historical reference (however unlikely for a live catalog photo) stays consistent.

This will be applied as a new incremental Prisma migration, the same way `invoice_documents` was added, once this phase is approved — flagging it here rather than applying it silently mid-UI-planning-phase.
