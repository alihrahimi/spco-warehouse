# SPCO Warehouse — Design System

**Status:** Phase 04 output. Documentation only — no components, no CSS, no Tailwind config. This document is the single source of truth every future screen and component must be built against.

**Scope reminder:** Internal warehouse management system for a baby clothing manufacturer. Persian-first, RTL-first, tablet-first. Desktop is a supported secondary target; mobile is supported but not primary. No offline support in v1 (confirmed in Phase 01).

---

## 0. Design Philosophy

The application must feel like **professional business software an experienced employee trusts**, not a consumer app. Every decision below is filtered through three questions:

1. Does this help someone with little computer experience finish a task faster?
2. Does this hold up after 8 hours of daily use — physically (glare, touch fatigue) and cognitively (no surprises)?
3. Is this designed *for* Persian and RTL, or *translated into* it? (If a decision would look different if English/LTR came first, it has failed this test.)

Explicitly rejected: trendy UI trends (glassmorphism, neumorphism, heavy gradients), decorative animation, dense information layouts, icon-only primary actions, and anything that adds visual interest without adding clarity.

**Dark mode:** out of scope for v1 by deliberate decision, not oversight. Warehouse tablets are typically used under bright ambient light where a light UI is more legible; revisit if usage patterns show otherwise.

---

## 1. Persian-First Design Principles

These are binding rules, not suggestions — they resolve ambiguity in every section below.

| Rule | Why |
|---|---|
| Every layout is authored RTL-native, never mirrored from an LTR draft. | Mirroring after the fact reliably misses asymmetric details (icon direction, shadow direction, reading order) that only show up when you design RTL first. |
| Numerals are **Persian digits** (۰۱۲۳۴۵۶۷۸۹) everywhere on screen and in PDFs. Stored/DB values remain plain numeric. | Matches user expectation for a Persian-native tool; this is a standing decision carried from earlier phases, restated here as the binding UI rule. |
| Persian punctuation only in UI copy: `،` not `,`, `؟` not `?`. | Latin punctuation in Persian sentences reads as a translation artifact. |
| No italic or oblique text, anywhere. | Persian letterforms are cursive/joining; forced slanting breaks legibility and has no equivalent in native Persian typographic convention. |
| No negative or tight letter-spacing. | Persian joining letterforms depend on natural spacing; Latin-style tight tracking breaks character connections. |
| Directional icons (arrows, chevrons, "forward/back") are mirrored for RTL. | An arrow that visually points the wrong way relative to reading direction is actively confusing, not neutral. |
| All copy — labels, placeholders, validation messages, tooltips, empty states, toasts — is written in natural Persian first. Never a translated English string, never Lorem Ipsum, never an English placeholder. | Stated directly in your brief; also the single highest-leverage rule for a low-computer-literacy audience. |

**Reference examples** (used throughout this document instead of English placeholders):
`نام مشتری` · `شماره موبایل` · `ثبت سفارش` · `پیش‌فاکتور` · `جستجوی طرح` · `پرداخت` · `مبلغ` · `وضعیت سفارش`

---

## 2. Typography

**Primary:** Vazirmatn (variable font). **Fallback order:** IRANSansX → Tahoma → system sans-serif.

Weights used: Regular (400), Medium (500), SemiBold (600), Bold (700) only. Thin/Light weights are excluded — they reduce legibility at warehouse-tablet viewing distances and under bright light.

| Token | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| Display | 40px | Bold | 1.3 | Rare — large empty-state headlines only |
| H1 | 32px | Bold | 1.35 | Page titles |
| H2 | 26px | SemiBold | 1.4 | Section headers |
| H3 | 22px | SemiBold | 1.4 | Card headers, dialog titles |
| H4 | 18px | Medium | 1.5 | Subsection labels |
| Body Large | 18px | Regular | 1.6 | Form field values, primary reading text — larger than typical web default given the audience |
| Body | 16px | Regular | 1.6 | Default UI text, table cells |
| Body Small | 14px | Regular | 1.5 | Secondary/meta text, helper text |
| Caption | 12px | Regular | 1.4 | Timestamps, tiny meta labels — the floor; nothing in the app goes smaller |
| Buttons | 16px | Medium | 1 | Never smaller than Body — a button is never the smallest text on its screen |
| Table Header | 15px | Medium | 1.4 | Column headers |
| Table Body | 16px | Regular | 1.6 | Cell content — kept at full Body size for tablet readability, not shrunk for density |
| Currency (inline) | 16px | Medium | 1.6 | Amounts inside rows/lists |
| Currency (emphasis) | 28px | Bold | 1.3 | Order totals, invoice grand total — the number the eye should land on |

**Numeral rendering:** all numeric UI (amounts, quantities, dates, order numbers) uses tabular/fixed-width digit rendering so stacked numbers align in columns — critical for scanning a table of order totals.

---

## 3. Color System

Light mode only (see §0). Neutrals lean warm rather than cold blue-gray — reads less clinical for daily 8-hour use.

### Brand
| Token | Hex | Usage |
|---|---|---|
| Primary / Default | `#1E5A96` | Primary buttons, active nav state, links, focus ring |
| Primary / Hover | `#17497A` | Hover/press feedback on primary elements |
| Primary / Active | `#123A61` | Pressed state |
| Primary / Light | `#E8F1FA` | Selected-row tint, subtle primary backgrounds |
| Primary / Border | `#B7D3EA` | Borders on primary-tinted surfaces |
| Secondary / Default | `#3E7C74` | Secondary emphasis (e.g. "Ready" status, secondary CTAs) — a muted teal, deliberately distinct from all semantic colors below |
| Secondary / Hover | `#316158` | Hover/press on secondary elements |
| Secondary / Light | `#E3F1EE` | Subtle secondary backgrounds |

### Neutrals
| Token | Hex | Usage |
|---|---|---|
| Background | `#F7F7F5` | App canvas — deliberately not pure white, reduces glare over long shifts |
| Surface | `#FFFFFF` | Cards, panels, modals, inputs |
| Border | `#E1E0DC` | Default component borders |
| Divider | `#ECEBE7` | Hairline separators inside a component |
| Hover (neutral) | `#F1F0EC` | Row/list hover — desktop pointer only, see §9 |
| Selected (neutral) | `#EAF2FB` | Same value as Primary/Light — selection always reads as "primary" |
| Disabled Background | `#F0F0EE` | Disabled inputs/buttons |
| Disabled Border/Text | `#B9B8B3` | Disabled component borders and text |

### Text
| Token | Hex | Usage |
|---|---|---|
| Text Primary | `#1F2328` | Default text — warm near-black, not pure `#000`, to soften screen contrast over long shifts |
| Text Secondary | `#5B6068` | Supporting text, field labels |
| Muted Text | `#8A8E94` | Placeholders, timestamps, least-important text |
| Text on Primary | `#FFFFFF` | Text/icons on filled primary/danger/success buttons |
| Text Disabled | `#B9B8B3` | Disabled text |

### Semantic
| Token | Base | Light (background) | Usage |
|---|---|---|---|
| Success | `#2E7D4F` | `#E6F4EC` | Completed, fully paid, success toasts/badges |
| Warning | `#B8790A` | `#FBF1DF` | Pending payment, partial payment, warning toasts |
| Danger | `#C43D3D` | `#FBEAEA` | Cancel, delete, error states |
| Information | `#3C8DBC` | `#E7F3FA` | Preparing status, informational toasts — deliberately a lighter/more cyan blue than Primary so the two are never confused |

**Contrast requirement:** every text/background pairing above must clear WCAG AA (4.5:1 body text, 3:1 large text/UI boundaries). Text Primary on Background/Surface comfortably exceeds this; verify any new combination introduced later against the same bar before shipping it.

---

## 4. Spacing System

8px base grid.

| Token | Value | Typical usage |
|---|---|---|
| space-1 | 4px | Icon-to-label gap, chip internal padding |
| space-2 | 8px | Base unit — tight gaps |
| space-3 | 12px | Form field internal padding, small card padding |
| space-4 | 16px | Standard gap between related elements, default card padding |
| space-5 | 20px | Comfortable form field spacing |
| space-6 | 24px | Section spacing within a screen, large card padding |
| space-8 | 32px | Spacing between major sections, page horizontal padding (tablet) |
| space-10 | 40px | Large section breaks |
| space-12 | 48px | Dashboard tile gaps, major layout gutters |
| space-16 | 64px | Page-level vertical rhythm, empty-state spacing |
| space-20 | 80px | Large empty-state top spacing (rare) |
| space-24 | 96px | Full-bleed section separation (rare) |

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| Radius / Small | 6px | Badges, small chips, checkboxes |
| Radius / Medium | 10px | Inputs, buttons |
| Radius / Large | 16px | Cards, panels |
| Radius / Dialog | 20px | Modals — slightly larger, reads as "elevated" from cards |
| Radius / Full | 999px (pill) | Status badges, toggle switches, filter chips |

Rounding is moderate throughout — enough to feel approachable, never enough to feel playful/trendy (rejects both sharp-cornered "enterprise-cold" and heavily-rounded "consumer-app" extremes).

---

## 6. Shadow / Elevation System

Five levels, used consistently to communicate stacking order, not decoration.

| Level | Offset-Y / Blur / Opacity | Usage |
|---|---|---|
| Elevation-0 | none | Flat/inline content, disabled elements |
| Elevation-1 | 1px / 3px / 6% black | Resting cards on Background |
| Elevation-2 | 2px / 8px / 8% black | Hover/press feedback, dropdown menus |
| Elevation-3 | 4px / 16px / 12% black | Modal/dialog panels, popovers |
| Elevation-4 | 6px / 24px / 16% black | Toasts — the topmost floating layer |

All elevated surfaces additionally keep a 1px Border-color outline even under shadow — in bright warehouse lighting, soft shadows alone can wash out and a surface can lose visible edges.

---

## 7. Button System

**Default height:** 52px (well above the 44px touch-target floor, per Phase 01's "large touch targets" requirement). **Compact height:** 44px, reserved for dense contexts like inline table-row actions.

| Variant | Fill | Text | Usage |
|---|---|---|---|
| Primary | Primary/Default | White | The one dominant action per screen (e.g. `ثبت سفارش`) |
| Secondary | Surface + Border | Text Primary | Secondary actions alongside a Primary button |
| Outline | Transparent + Primary border | Primary | Tertiary emphasis |
| Ghost | Transparent, no border | Text Secondary | Lowest emphasis (e.g. `انصراف`) |
| Danger | Danger/Base | White | Destructive actions (`لغو سفارش`, `حذف`) |
| Success | Success/Base | White | Confirming a positive outcome (e.g. `تسویه کامل`) |
| Icon Button | Transparent or Surface | Icon only | See exception rule below |

**Icon Button exception:** the Phase 03 rule "no icon-only primary actions" still governs all *primary* and *navigation* actions — those always carry a Persian label. Icon Buttons are a distinct, narrower component reserved for universally understood, low-stakes, reversible micro-actions (close a dialog, inline edit-pencil in a table row) — never a screen's main call to action. Minimum 44×44px hit area regardless of the visible icon's size.

**Loading state:** spinner replaces or precedes the label; the button's footprint stays exactly the same size (no layout shift) and becomes non-interactive.

**Disabled state:** reduced-opacity fill using Disabled Background/Text tokens, no hover/press feedback. Disabled is used sparingly — per Phase 03, prefer letting a tap happen and showing inline validation over silently disabling a button, since a disabled control gives a low-literacy user no information about *why*.

---

## 8. Input System

**Default height:** 52px, matching button height for shared visual rhythm. **Compact:** 44px.

General rules: label sits above the field, right-aligned by natural RTL text flow (no special alignment override needed — this falls out of `dir="rtl"` automatically if authored correctly). Placeholder text uses Muted Text and is always a realistic Persian example (e.g. `نام مشتری را وارد کنید`), never Lorem Ipsum or an English hint.

| Component | RTL-specific behavior | Notes |
|---|---|---|
| Text Input | — | Standard field, Body Large text |
| Number Input | Numeric keypad triggered on tablet; Persian digit glyphs displayed | Large +/− steppers for small integers (e.g. pack size) rather than pure typing |
| Currency Input | Live Persian-grouped formatting while typing (`۱۲۰,۰۰۰ تومان`) | Unit word `تومان` trails the number, matching natural RTL reading order |
| Search | Icon at the **right** (leading) edge, clear (`×`) at the **left** (trailing) edge | Mirrors an LTR search field exactly |
| Dropdown | Disclosure chevron at the **left** (trailing) edge | Chevrons/carets always sit at the trailing edge of the reading direction — left in RTL, the mirror of their LTR position |
| Autocomplete | Search + Dropdown combined; results list anchored below, text right-aligned | — |
| Date Picker | **Native Jalali calendar only** — never Gregorian-with-converted-labels. Week grid reads right-to-left: Saturday (first day) at the rightmost column, Friday at the leftmost. | This is the single most important RTL-native component in the app given the Jalali requirement from Phase 01 |
| Checkbox | Control at the right, label extends to its left | Mirror of LTR's left-control/right-label |
| Radio | Same positioning as Checkbox; ≥12px gap between options | Generous spacing for touch |
| Switch | OFF = thumb left; ON = thumb right, filled Primary/Success | Most component libraries default LTR (thumb moves right = ON) and need explicit RTL flipping — call this out directly to whoever implements it |
| Textarea | — | Min-height ~96px, vertical resize only |

**States** (all inputs): Default → Focus (2px Primary ring with slight offset) → Error (Danger border + inline Persian message below, e.g. `این فیلد الزامی است`) → Disabled (Disabled tokens, non-interactive). An optional subtle Success/valid state exists for specific verified-field cases but is not used everywhere.

---

## 9. Table System

- **Column order:** RTL — the primary/identifying column (e.g. `نام مشتری`) starts at the right edge; an actions/edit column, if present, sits at the far **left** edge (mirror of the common LTR right-side-actions convention).
- **Sticky header:** stays visible on scroll; gains Elevation-1 and a bottom border once the body has scrolled under it, to stay visually separated from content.
- **Row hover:** applies only on pointer (desktop/mouse) input — hover has no meaning on a touch tablet. Touch instead gets a brief **press/active** state (short bg-color pulse using Hover token on touch-down) so taps still register visual feedback.
- **Row selection:** selected row = Primary/Light background + a 3px solid Primary accent bar on the **right** edge (the RTL leading edge — mirror of a common LTR left-edge accent bar).
- **Status badge:** embedded in its own column, pill-shaped (Radius/Full), always color + Persian text together (see §10).
- **Pagination:** large Prev/Next buttons (no numbered page-jump list, to stay simple) with a `صفحه ۲ از ۵` label between them. Because RTL reading progresses right-to-left, "next" (forward) points **left** and "previous" points **right** — the reverse of an LTR pager, and an easy mistake to get backwards if not stated explicitly.
- **Touch targets:** minimum row height 56px on tablet (taller than typical desktop table density); minimum 16px horizontal cell padding.

---

## 10. Status Badges

Every badge pairs a semantic color **and** its Persian text label — never color alone (colorblind-safe, and consistent with the Phase 03 accessibility principle).

| Status | Persian Label | Color Family |
|---|---|---|
| Pending Payment | در انتظار پرداخت | Warning |
| Preparing | در حال آماده‌سازی | Information |
| Ready | آماده ارسال | Secondary (teal) |
| Completed | تکمیل شده | Success |
| Cancelled | لغو شده | Neutral gray (deliberately *not* Danger — cancelled is a closed/inactive state, not an error, and shouldn't visually alarm staff the way a red badge would) |
| Fully Settled | تسویه کامل | Success |
| Partial Payment | پرداخت ناقص | Warning |

**Anatomy:** pill shape (Radius/Full), 4–8px vertical padding, 12–16px horizontal padding, Body Small (14px) Medium weight text on the color's Light background variant with the Base color as text/border.

---

## 11. Cards

All cards share: Radius/Large, Surface background, 1px Border (kept even under shadow — see §6), Elevation-1 at rest → Elevation-2 on hover(desktop)/press(touch).

| Card | Anatomy |
|---|---|
| Dashboard Tile | Icon + large Persian label + optional subtitle/count. The `سفارش جدید` tile is visually largest on the Dashboard — size communicates priority. |
| Customer | Name (Body Large, SemiBold) + mobile (Body, Muted) + optional note preview |
| Product | Category tag + product name (H4) + piece count |
| Order | Order number + customer name + status badge + total (Currency/emphasis) + remaining-balance indicator when non-zero |
| Statistics | Large number (Currency/emphasis or Display) + label; no sparkline charts or dense visualizations — keeps the Dashboard glanceable, not a reporting surface |

---

## 12. Modals

**Anatomy:** semi-opaque dark scrim (50% black) → centered panel, Radius/Dialog, Elevation-4, max-width ~560px on tablet → header (H3 title + optional close Icon Button at the trailing/left corner) → body → footer action row.

**Footer button order (RTL):** the primary action sits at the **far right** (the RTL leading edge), with Cancel/secondary to its left — mirrors the common convention of placing the primary action nearest the reading start. Easy to get backwards if a component library's default LTR order isn't explicitly flipped.

| Type | Behavior |
|---|---|
| Confirmation | Title + short question + Cancel (Ghost/Secondary) + Confirm (Primary or Danger, matched to the action's severity) |
| Delete | Same as Confirmation, Confirm uses Danger variant, and names exactly what will be removed — never a bare "مطمئن هستید؟" with no specifics |
| Warning | Warning-colored icon/accent, states the consequence, requires an acknowledgement tap |
| Success | Reserved for cases needing acknowledgement *and* a next-step choice (e.g. "سفارش ثبت شد — فاکتور چاپ شود؟"); a plain success with no follow-up decision uses a Toast instead, not a Modal |
| Error | Danger-colored icon/accent, a clear Persian explanation of what went wrong, and a Retry or Dismiss action — never a raw technical/English error string |

---

## 13. Toasts

**Position:** top-center, below any persistent header bar.

**Anatomy:** semantic icon + short Persian message + dismissal behavior:
- Success / Information → auto-dismiss after 4s
- Warning / Error → persist until manually dismissed (`×`), since these often carry information a busy warehouse user shouldn't miss by auto-dismiss timing

**Stacking:** newest on top, maximum 3 visible simultaneously, additional toasts collapse into a count rather than flooding the screen.

---

## 14. Empty States

| State | Treatment |
|---|---|
| No Data | Simple line-art icon (not cartoonish) + Persian headline (e.g. `هنوز مشتری‌ای ثبت نشده`) + short supporting line + primary CTA where applicable (`افزودن مشتری`) |
| No Results | Distinct from No Data — headline `نتیجه‌ای یافت نشد` + suggestion to adjust the search/filter; no CTA needed, or a "clear filter" action |
| No Internet | Since v1 requires connectivity (Phase 01), this gets its own distinct treatment — icon + `اتصال اینترنت برقرار نیست` + Retry button, so it's never confused with a generic app error |
| Loading | Centered spinner; add a `در حال بارگذاری...` label for any operation likely to exceed ~1s — a silent spinner reads as "frozen" to this audience |
| Skeleton | Preferred over spinners specifically for list/table/card screens (Order List, Customer List, Product List) — subtle pulsing neutral blocks matching eventual content shape, previews structure and feels faster than a blank spinner. Spinners are reserved for full-page or action-level loading (e.g. PDF generation). |

---

## 15. Icon Library

**Recommendation: Lucide (`lucide-react`).**

1. **Already the default** icon set bundled with shadcn/ui, which Phase 01 locked in as the component foundation — using a second icon system means fighting the library's defaults on every screen instead of working with them.
2. **SVG-based and trivially mirrorable** — directional icons (arrows, chevrons) flip for RTL with a simple horizontal transform, no separate "RTL icon pack" needed.
3. **Broad, consistent coverage** (2000+ icons) for everything this app needs — users, boxes/inventory, print, share, settings, checkmarks, calendar, search.
4. **Tree-shakeable** — only icons actually used ship in the bundle, which matters for install/first-load size on modest warehouse tablets running a PWA.
5. **Permissive ISC license** — no attribution requirements that complicate an internal commercial tool.

**One gap to flag:** Lucide does not include official brand marks for WhatsApp, Telegram, or Instagram (used on Company Settings and the invoice contact block). Recommend a small, narrowly-scoped supplementary source (e.g. Simple Icons) used *only* for these three brand marks — Lucide remains the single system for every other icon in the app.

---

## 16. Responsiveness

| Range | Role |
|---|---|
| 360–767px | Mobile — secondary support |
| 768–1279px | **Tablet — primary target.** Every screen is designed and validated here first, in both portrait and landscape, since staff may hold the device either way |
| 1280px+ | Desktop — secondary. v1 reuses the same tile-based navigation scaled up; a persistent sidebar nav is a plausible future refinement, not required now |

Layout behavior: multi-column grids (product grid, dashboard tiles) collapse to a single column below 768px; nothing about the core interaction model changes across breakpoints — the same large-touch-target components are used everywhere, just laid out with more or less room.

---

## 17. Touch Design

- **Absolute floor:** 44×44px for any interactive element (matches iOS/Android platform guidance).
- **Standard target:** 52px height, deliberately above the floor — this app's default, not an exception, reflecting Phase 01's "some users have almost no computer knowledge" requirement.
- **Minimum spacing between adjacent targets:** 8px, to prevent mis-taps.
- **Size communicates priority:** a screen's primary action is its visually largest control, not just its most colorful — see the Dashboard's `سفارش جدید` tile.
- **No precision gestures:** no tiny drag handles, no close icons with a hit-area smaller than the 44px floor even if the glyph itself is small.

---

## 18. PDF Design

Applies to both the on-screen Invoice Preview and the exported PDF — they must render identically (per Phase 03's Invoice Flow).

- **Page size:** A4, portrait — standard printer paper size in Iran.
- **Margins:** 15mm all sides, consistent across every page of a multi-page invoice (clearance for staple/hole-punch, no wasted space).
- **Typography:** Vazirmatn embedded in the PDF, never system-substituted. A print-specific scale, smaller than the on-screen scale (print is viewed closer, at higher effective resolution): Invoice title ~20pt, section labels ~11pt Medium, table/body text ~10pt Regular, footer/legal text ~8pt.
- **Table styles:** RTL column order matching the on-screen table. Alternating rows use a very subtle Divider-level tint, not the stronger on-screen Hover color — heavy fills waste ink/toner on a business printing invoices daily. Header row is bold text with a bottom rule, not a filled background — print-economical and avoids a "trendy" look that dates quickly.
- **Header:** company logo (from the invoice's frozen snapshot — see the Phase 03 addendum) at the right (leading) edge or centered, company name/address/contact block beneath it; invoice number + Jalali date at the left (trailing) edge — same RTL/LTR-flip logic as on-screen tables.
- **Footer:** repeats on every page — page number (`صفحه ۲ از ۳`), footer text from Company Settings, and the invoice footer note from Invoice Settings.
- **Page breaks:** a single item row never splits across a page break. If the item table continues past page 1, the header row repeats at the top of each continuation page. The totals/payment-summary block never lands alone at the top of a new page with no preceding content — force it onto the prior page's remaining space or push it cleanly rather than leaving a near-empty trailing page.
- **Multi-page invoices:** only the final page shows the Total/Paid/Remaining summary block; intermediate pages carry items plus the repeating header/footer only.

---

## 19. Accessibility

- **Contrast:** WCAG AA minimum — 4.5:1 for body text, 3:1 for large text (≥24px, or ≥18.5px Bold) and for meaningful UI boundaries (input borders, icon-only button glyphs). Verify any new color pairing against this bar before it ships — the palette in §3 is designed to clear it comfortably by default.
- **Touch targets:** 44px floor / 52px standard, per §17 — accessibility and the core "easy for low-computer-literacy users" goal are the same requirement here, not two separate concerns.
- **Keyboard navigation:** required for the desktop secondary target. Every interactive element must be reachable via Tab/Shift+Tab and operable via Enter/Space, in an order that matches the **visual RTL reading order** — a common real-world bug is tab order silently defaulting to LTR DOM order even when the visual layout is RTL; this must be explicitly verified, not assumed correct.
- **Visible focus states:** every focusable element gets a clear focus ring (2px Primary, slight offset). Never `outline: none` without an explicit, equally visible replacement — one of the most common accessibility regressions in custom-styled component libraries, called out here so it isn't reintroduced silently during implementation.

---

## Summary of Standing Decisions Carried Into Implementation

- Light mode only for v1 (deliberate, not deferred by accident).
- Persian digits for all on-screen and PDF numerals; underlying data stays plain numeric.
- Lucide as the single icon system, supplemented only for WhatsApp/Telegram/Instagram brand marks.
- 52px is the default interactive-element height across buttons, inputs, and table rows — not just a minimum, the default.
- No component in this system defaults to LTR-then-mirrored behavior; every RTL-specific flip (chevrons, switches, accent bars, modal button order, pagination direction) is called out explicitly above so implementation doesn't have to guess.
