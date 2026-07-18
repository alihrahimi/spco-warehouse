# SPCO Warehouse — Frontend Architecture

**Status:** Phase 06 output. Architecture only — no business logic, no APIs, no database wiring, no pages implemented. This is the structural blueprint the implementation phases build inside; it assumes and extends [UX-FLOW.md](./UX-FLOW.md), [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md), and [SCREEN-SPECS.md](./SCREEN-SPECS.md).

**Grounded in the actual scaffolded project**, not assumptions — verified against `package.json`/`tsconfig.json`: Next.js `16.2.10` (App Router), React `19.2.4`, TypeScript `5`, Tailwind CSS `4` (CSS-first config, no `tailwind.config.ts`), Prisma `7.8.0`, path alias `@/*` → `./src/*`.

---

## 1. Confirmed Tech Stack

Everything below was approved in Phase 01 and is carried forward unchanged:

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Radix primitives) |
| Icons | Lucide (confirmed in Phase 04), + Simple Icons for WhatsApp/Telegram/Instagram marks only |
| Forms/Validation | React Hook Form + Zod |
| Server state | TanStack Query |
| Local/UI state | Zustand (sparingly, cross-component concerns only) |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Auth | Auth.js (credentials provider) |
| PDF | Playwright (HTML → PDF) |
| Dates | Jalali via `jalaali-js` + `react-multi-date-picker` |
| PWA | `next-pwa` / manual service worker |

### New additions for this phase (justified, not silently added)

| Library | Why |
|---|---|
| **TanStack Table** (headless) | Table Architecture (§8) requires sorting, searching, pagination, row selection, and RTL-correct column order across many screens (Order List, Customer List, Product List, Notifications History). Building this state machine per-screen would duplicate logic five times over; TanStack Table is headless (no fighting a pre-styled table against our own Design System), same ecosystem/API conventions as the already-approved TanStack Query, and is what shadcn/ui's own official data-table pattern is built on — the lowest-friction option given the already-approved foundation, not a new paradigm. |
| **Sonner** | The current shadcn/ui-recommended toast library (its predecessor is deprecated). Minimal, unopinionated, trivially themed with our Design System tokens — fits §13's toast spec directly rather than requiring us to fight a heavier, more opinionated toast library. |
| **TanStack Virtual** *(reserved, not installed in v1)* | Same family as TanStack Table/Query. Not needed at v1's expected data volume (single warehouse) — flagged here so that if years of accumulated orders eventually justify virtualized table rows, it drops into the existing `DataTable` component without a rewrite. |

`cmdk` (search/command palette, powers shadcn's `Command` component) and `clsx`/`tailwind-merge` (the standard shadcn `cn()` helper) are not treated as separate decisions — they ship as part of the already-approved shadcn/ui foundation, not additions on top of it.

---

## 2. Complete Folder Structure

```
spco-warehouse/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ public/
│  ├─ fonts/                     # Vazirmatn, IRANSansX — self-hosted, never CDN-loaded
│  ├─ icons/                     # PWA install icons
│  └─ manifest.json (or app/manifest.ts)
├─ docs/                         # Phase 01–06 architecture documents (this file included)
├─ src/
│  ├─ app/                       # Next.js App Router — ROUTES ONLY, no business logic
│  │  ├─ layout.tsx               # dir="rtl", lang="fa", font vars, providers
│  │  ├─ globals.css              # @theme tokens (see §11)
│  │  ├─ error.tsx                # root error boundary
│  │  ├─ not-found.tsx
│  │  ├─ manifest.ts              # PWA manifest
│  │  ├─ (auth)/
│  │  │  └─ login/page.tsx
│  │  ├─ (dashboard)/             # authenticated route group, own layout
│  │  │  ├─ layout.tsx            # DashboardShell (TopBar + tile-grid/sidebar)
│  │  │  ├─ page.tsx              # Dashboard
│  │  │  ├─ customers/
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ error.tsx
│  │  │  │  ├─ new/page.tsx
│  │  │  │  └─ [customerId]/edit/page.tsx
│  │  │  ├─ products/
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ new/page.tsx
│  │  │  │  └─ [productId]/
│  │  │  │     ├─ page.tsx        # Product Details
│  │  │  │     └─ edit/page.tsx
│  │  │  ├─ orders/
│  │  │  │  ├─ page.tsx           # Order List
│  │  │  │  ├─ error.tsx
│  │  │  │  ├─ new/page.tsx       # New Order
│  │  │  │  └─ [orderId]/
│  │  │  │     ├─ page.tsx        # Order Details
│  │  │  │     ├─ payment/page.tsx
│  │  │  │     └─ invoice/page.tsx
│  │  │  ├─ settings/
│  │  │  │  ├─ page.tsx           # Company Settings
│  │  │  │  └─ notifications/page.tsx
│  │  │  ├─ users/page.tsx
│  │  │  └─ utilities/
│  │  │     ├─ page.tsx
│  │  │     └─ xps-to-pdf/page.tsx
│  │  └─ api/                     # Route Handlers — ONLY for non-form endpoints (see §10)
│  │     ├─ auth/[...nextauth]/route.ts
│  │     ├─ orders/[orderId]/invoice/route.ts   # PDF streaming download
│  │     └─ utilities/xps-to-pdf/route.ts       # file-in/file-out conversion
│  │
│  ├─ features/                   # THE APPLICATION — one folder per feature module
│  │  ├─ auth/
│  │  ├─ dashboard/
│  │  ├─ customers/
│  │  ├─ products/
│  │  ├─ orders/
│  │  │  └─ components/
│  │  │     ├─ order-builder/     # New Order's step components — see §4
│  │  │     ├─ order-list/
│  │  │     └─ order-details/
│  │  ├─ payments/
│  │  ├─ invoices/
│  │  ├─ users/
│  │  ├─ settings/
│  │  ├─ utilities/
│  │  └─ notifications/
│  │     # every feature folder follows the same internal shape — see §4
│  │
│  ├─ components/                 # GLOBAL, cross-feature components ONLY
│  │  ├─ ui/                      # shadcn/ui primitives (button, input, dialog...) — untouched by feature logic
│  │  ├─ shared/                  # app-specific but feature-agnostic: StatusBadge, CurrencyText, JalaliDate, EmptyState, PageHeader, ConfirmDialog
│  │  ├─ layout/                  # TopBar, Sidebar, Breadcrumb, DashboardShell, StickyFooterSlot
│  │  ├─ table/                   # DataTable + DataTableToolbar + DataTablePagination (generic, TanStack Table-powered)
│  │  └─ form/                    # CurrencyInput, PersianNumberInput, JalaliDatePickerField, FormFieldWrapper
│  │
│  ├─ hooks/                       # TRULY global hooks only: use-media-query, use-debounce, use-confirm-dialog
│  ├─ lib/
│  │  ├─ db.ts                    # Prisma client singleton
│  │  ├─ auth.ts                  # Auth.js config
│  │  ├─ pdf/                     # Playwright render engine + invoice template
│  │  ├─ storage/                 # StorageProvider abstraction (local disk v1, S3-ready)
│  │  ├─ telegram/                # NotificationService (Telegram Bot API client)
│  │  ├─ format/
│  │  │  ├─ currency.ts           # Toman + Persian digit grouping
│  │  │  └─ date.ts               # Jalali conversion/formatting
│  │  └─ utils.ts                 # cn() and other true one-off utilities
│  ├─ providers/                  # QueryProvider, ThemeProvider, SessionProvider — composed once in root layout
│  ├─ store/                      # Zustand — one file per cross-cutting concern (order-builder-store.ts, ui-store.ts)
│  ├─ types/                      # Shared types not owned by one feature: ApiResult<T>, PaginatedResult<T>
│  ├─ config/                     # Static app config (nav.config.ts, site.config.ts) — NOT business settings, which live in the DB
│  ├─ constants/                  # Route paths, query-key factories, enum-label maps mirroring Prisma enums
│  └─ proxy.ts                    # Auth guard + admin-route protection (see §10) — Next.js 16 renamed middleware.ts to proxy.ts
├─ .env.example
├─ prisma.config.ts
├─ next.config.ts
├─ tsconfig.json
└─ package.json
```

---

## 3. Feature Organization

One folder per business domain, matching the modules named in this phase's brief: `auth`, `dashboard`, `customers`, `products`, `orders`, `payments`, `invoices`, `users`, `settings`, `utilities`, `notifications`.

`orders` is intentionally the largest, since it hosts the New Order builder, Order List, and Order Details — each gets its own components subfolder rather than one flat pile, mirroring the step boundaries already established in [SCREEN-SPECS.md §11](./SCREEN-SPECS.md).

`payments` and `invoices` are separate feature folders from `orders` even though they're tightly related, because they map to distinct screens with distinct concerns (Register Payment; Invoice Preview/PDF) and distinct DB tables (`payments`, `invoice_documents`) — keeping them separate avoids `orders/` becoming a dumping ground for everything order-adjacent.

---

## 4. Standard Feature Module Anatomy

Every feature folder follows the same internal shape, so moving between features costs zero re-orientation:

```
features/customers/
├─ components/         # Feature-specific UI: CustomerCard, CustomerForm, CustomerPicker
├─ hooks/               # TanStack Query hooks: use-customers.ts, use-create-customer.ts
├─ actions.ts           # Server Actions — mutation entry points (see §10)
├─ queries.ts           # Server-side data-fetching functions, used in Server Components
├─ services.ts          # Pure business logic, called by both actions.ts and queries.ts
├─ schemas/
│  └─ customer.schema.ts   # Zod — single source of truth, used client AND server side
├─ types.ts
└─ index.ts             # Public surface — what app/ and other allowed layers may import
```

The three-layer split (`actions` = write entry points, `queries` = read entry points, `services` = actual logic) keeps Server Actions and Server Components both thin, and gives future background jobs (e.g. a scheduled Telegram digest) a clean, already-tested `services.ts` to call into without going through HTTP at all.

---

## 5. Component Strategy

| Category | Location | Rule |
|---|---|---|
| **Global (UI primitives)** | `components/ui/` | shadcn/ui components as generated — styled via Design System tokens, never feature-aware |
| **Shared (app-specific, feature-agnostic)** | `components/shared/` | Used by 2+ features: `StatusBadge`, `CurrencyText`, `JalaliDate`, `EmptyState`, `PageHeader`, `ConfirmDialog` |
| **Feature components** | `features/*/components/` | Owned by exactly one feature, never imported cross-feature (§9) |
| **Layout components** | `components/layout/` | `TopBar`, `Sidebar`, `Breadcrumb`, `DashboardShell` — structural, not content |
| **Dialog components** | Triggered via `useConfirmDialog()` (global hook) for the common confirm/delete/warning pattern from Design System §12, rather than each feature building its own modal boilerplate. Feature-specific dialog *content* (e.g. the Create Customer overlay) still lives in that feature's `components/` | Reduces duplication across the many confirm-before-destructive-action moments in the spec |
| **Table components** | `components/table/` | One generic `DataTable`, configured per screen via column definitions living in the *feature* (`features/orders/components/order-list/columns.tsx`) |
| **Form components** | `components/form/` | `CurrencyInput`, `PersianNumberInput`, `JalaliDatePickerField` — built once, since these appear across nearly every feature |

**Rule of thumb:** a component moves from `features/*/components/` to `components/shared/` the moment a *second* feature needs it — not proactively "just in case."

---

## 6. State Management

| Type | Tool | Used for |
|---|---|---|
| **Server state** | TanStack Query | Everything fetched from the database: customers, products, orders, payments, settings. Query keys organized via a per-feature factory (`customerKeys.list(filters)`, `customerKeys.detail(id)`) — precise cache invalidation, no magic strings. |
| **Global UI state** | Zustand | Cross-component, cross-screen concerns only: the New Order **draft cart** (survives across the multi-step builder before final submit — see §4/SCREEN-SPECS §11), sidebar collapsed state, PWA install-prompt visibility. |
| **Local state** | `useState`/`useReducer` | Component-scoped ephemeral UI: dropdown open state, inline-edit toggle, focus state. Default choice — reach for Zustand only when state must survive outside one component tree. |
| **Form state** | React Hook Form | Uncontrolled by default (performance), controlled only where a component needs it (e.g. `CurrencyInput`'s live-formatting logic). |

**Caching strategy:** `staleTime` tuned per data type — Company Settings and the product catalog change rarely (longer `staleTime`), Order List changes constantly (short `staleTime`, plus explicit `invalidateQueries` after any order/payment mutation). Server Components that fetch initial data hydrate TanStack Query's cache on the client (Next.js + TanStack Query hydration pattern) so the first client-side render doesn't re-fetch what the server already sent.

---

## 7. Form Architecture

- **Validation:** one Zod schema per form, colocated in the feature's `schemas/` folder, imported by **both** the client (`react-hook-form`'s `zodResolver`) and the Server Action's input parsing. Same schema, zero drift — mirrors the "never duplicate data" principle applied to validation logic instead of data.
- **Error handling:** Server Actions return a typed discriminated result — `{ success: true, data }` or `{ success: false, fieldErrors, formError }` — for *expected* validation failures. Actual exceptions are reserved for truly unexpected errors and caught by the nearest `error.tsx` boundary. The client maps `fieldErrors` onto React Hook Form's `setError` per field, so a returned validation error renders inline exactly like a client-side one — one error-display code path, not two.
- **Currency Inputs:** a single `CurrencyInput` (`components/form/`) storing a raw numeric value internally while displaying live Persian-grouped Toman formatting (`۱۲۰,۰۰۰ تومان`) as the user types — built once, used for payment amounts and product pricing alike.
- **Persian Numbers:** digit conversion (Persian ↔ Latin at the input boundary, so typing either works but display is always Persian) lives in one shared utility (`lib/format/`), never reimplemented per component.
- **RTL Inputs:** no per-component RTL handling exists — every form inherits `dir="rtl"` from the root layout. There is no LTR mode to mirror against (§14), so there's no mirroring logic to write or maintain.
- **Dynamic Forms:** React Hook Form's `useFieldArray` for every variable-length structure — company phone numbers, a product's piece/size grid in the Create Product wizard, and the New Order cart itself before submission.

---

## 8. Table Architecture

One generic `DataTable` component (`components/table/`), powered by TanStack Table, reused by Order List, Customers List, Products List, User Management, and Notifications History — table *behavior* is built once; each screen only supplies column definitions and data.

| Requirement | Approach |
|---|---|
| **RTL** | Column definitions are declared in logical (primary-first) order; combined with `dir="rtl"` on the table root, visual RTL order (primary column right, actions column left) falls out automatically — no manual column reversal anywhere. |
| **Sorting** | TanStack Table's built-in sort state, triggered by tapping the column header cell itself (full 44px+ tap target, not a tiny icon). |
| **Searching** | A controlled, debounced (`useDebounce`) search input above the table. v1 filters client-side for the catalog-sized datasets involved (Products, Customers); Order List's query hook is structured so switching to server-side filtering later — if years of accumulated orders warrant it — is an internal change to that one hook, not a `DataTable` rewrite. |
| **Pagination** | TanStack Table's pagination state + the Design System's RTL-flipped Prev/Next control (`§9`: "next" points left). |
| **Row Selection** | TanStack Table's row-selection state, exposed generically on `DataTable` even though no v1 screen requires bulk actions yet — available the moment one does, without a component rewrite. |
| **Status Badge** | A single `StatusBadge` (`components/shared/`) mapping the Prisma `OrderStatus` enum (and payment-state derivations) directly to the Design System's §10 color+label pairs — one source of truth, so status never renders inconsistently between Order List, Order Details, and the Invoice. |
| **Responsive Layout** | Below the tablet breakpoint, `DataTable` renders the same data as stacked cards instead of a table — one component with two presentations, not two components to keep in sync. |

---

## 9. Layout Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          TopBar                               │
│  [بازگشت]      عنوان صفحه / breadcrumb       [کاربر] [خروج]   │
├───────────┬─────────────────────────────────────────────────┤
│           │                                                   │
│  Sidebar  │                  Content Area                     │
│ (desktop  │           (feature page renders here)             │
│  ≥1280px  │                                                   │
│  only,    │                                                   │
│  right    │                                                   │
│  edge)    │                                                   │
│           │                                                   │
├───────────┴─────────────────────────────────────────────────┤
│         [ Sticky Footer Slot — e.g. New Order's submit ]      │
└─────────────────────────────────────────────────────────────┘
```

- **Sidebar:** absent on tablet/mobile (Dashboard uses the tile grid from Screen Specs §2, per Phase 03/05) — appears only at the desktop breakpoint (≥1280px), docked at the **right** edge (RTL's leading/start side, the mirror of a conventional LTR left sidebar). Implemented as one `DashboardShell` layout component that conditionally renders sidebar-vs-tiles by breakpoint, so tablet and desktop share one layout component instead of two divergent ones.
- **TopBar:** persistent on every authenticated screen. Hosts the back-navigation control at the **top-right** (Design System convention), page title/breadcrumb, user identity, logout.
- **Breadcrumb:** appears in the TopBar for nested screens. Reads right-to-left with the root/ancestor at the right and the current page at the left — the RTL mirror of an LTR breadcrumb's left-to-right root-to-current flow (e.g. `محصولات ‹ خرس آبی ‹ ویرایش` reading right to left).
- **Content Area:** full-width on tablet; max-width constrained on desktop to avoid sprawling line lengths and overly wide tables on large monitors.
- **Dialogs:** rendered through Radix's Dialog primitive (shadcn), with the common confirm/delete/warning/error pattern (Design System §12) available everywhere via one `useConfirmDialog()` hook — avoids re-building modal boilerplate at every one of the spec's many confirmation moments.
- **Floating Actions:** a layout-level "sticky footer slot" any screen can populate — not a New-Order-specific hack — so New Order's submit bar, and any future screen needing the same pattern, share one mechanism.
- **Tablet Layout (primary):** TopBar + Content only, no sidebar — matches every wireframe in Screen Specs.
- **Desktop Layout (secondary):** TopBar + right-docked Sidebar + Content, as sketched above — the one deliberate structural difference between the two breakpoints.

---

## 10. Routing

- **Route groups:** `(auth)` for unauthenticated screens, `(dashboard)` for everything behind login — grouping affects file organization and per-group layouts only, not the URL.
- **Proxy (`src/proxy.ts`, named `middleware.ts` in earlier Next.js versions — renamed as of Next.js 16):** Auth.js session check on every request to `(dashboard)` routes, redirecting unauthenticated requests to `/login`. Also enforces admin-only routes (`/settings`, `/users`) server-side — the Design System already *hides* those Dashboard tiles from non-admin users, but hiding a tile is a UI nicety, not a security boundary; the proxy is the actual boundary, since a determined user could otherwise navigate to the URL directly.
- **Dynamic segments:** `[customerId]`, `[productId]`, `[orderId]` use the entity's UUID directly — no separate slug system needed for an internal tool.
- **Mutations — Server Actions, not a REST API:** since this app has no public/external API consumer, mutations (create customer, submit order, register payment, save settings) are implemented as **Next.js Server Actions**, colocated in each feature's `actions.ts`, invoked from client forms via a TanStack Query `useMutation` wrapping the action call. This gets Query's caching/optimistic-UI/loading-state ergonomics on the client while keeping the actual mutation logic server-side and framework-native, without hand-building a REST layer nobody else consumes.
- **Route Handlers (`app/api/`) are reserved for the few things that are genuinely not form-shaped mutations:** Auth.js's own required handler, PDF streaming download (a binary response, not a form submission), and the XPS→PDF utility's file-in/file-out conversion. Everything else goes through Server Actions.
- **Parallel/intercepting routes:** deliberately not used in v1 (e.g. no modal-over-list Order Details via an intercepting route) — full page navigations are simpler and more predictable for this audience, consistent with the "no hidden actions" UX principle. Flagged as a possible future refinement, not a v1 need.

---

## 11. Theme Architecture

Built directly on Tailwind v4's CSS-first configuration (already scaffolded — no `tailwind.config.ts` exists or is needed).

**Mechanism:** every Design System token (§3–6 of DESIGN-SYSTEM.md — colors, spacing, radius, shadows) becomes a CSS custom property in `:root`, then mapped into an `@theme inline` block in `globals.css`, exactly like the scaffold's current `--background`/`--foreground` pair — just fully populated with the approved palette instead of the Next.js starter defaults. This makes every token a native Tailwind utility (`bg-primary`, `text-muted`, `rounded-large`) with no separate config file to keep in sync.

**Dark mode readiness (v1 ships light-only, per Design System §0):** because every component references a token *name*, never a raw hex value, adding dark mode later means adding a second value-set for the same variable names — under a `.dark` class scope (recommended over pure `prefers-color-scheme`, since an in-app toggle is likely preferable to a silent OS-driven switch) — with **zero changes to any component**. This is what "easy to add later" concretely means here: the seam already exists in the token layer, it's just unpopulated for v1.

**Fonts:** Vazirmatn/IRANSansX loaded via `next/font/local` (self-hosted, per Design System — never CDN), exposed as `--font-vazirmatn` and mapped into `@theme`, replacing the scaffold's current Geist/Arial fallback chain.

---

## 12. File Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Files (all) | kebab-case | `customer-card.tsx`, `order-list-columns.tsx` |
| Component export | PascalCase, regardless of filename | `export function CustomerCard()` |
| Hooks | `use-*.ts` file, `useX` export | `use-customers.ts` → `useCustomers` |
| Zod schemas | `*.schema.ts` | `customer.schema.ts` |
| Types | `types.ts` per feature, or `*.types.ts` | `customer.types.ts` |
| Server Actions | `actions.ts` per feature (split into `create-customer.action.ts` style only if it exceeds the size guidance in §14) | — |
| Tests *(future)* | colocated `*.test.ts(x)` next to the file under test | — |

Kebab-case for every file (not just some) avoids case-sensitivity mismatches between Windows (this project's dev environment) and Linux (likely deployment target), which is a real, recurring source of "works on my machine" bugs in mixed-OS teams.

---

## 13. Import Rules

- **Always absolute imports** via `@/*` — never a relative path climbing more than one directory (`../../../`). A deep relative import is a signal the file is in the wrong place, not just a style nit.
- **Feature isolation (the one rule that matters most for years-long maintainability):** a feature (`features/orders/`) may freely import from `components/`, `lib/`, `hooks/`, `store/`, `types/`, `constants/` — but **must never import directly from another feature's internals** (`features/orders/` reaching into `features/customers/components/`). If two features need the same logic, that logic is promoted to `components/shared/`, `lib/`, or `types/`. This single rule is what prevents circular dependencies and feature-coupling sprawl as the app grows — enforce it with an ESLint import-boundary rule (`eslint-plugin-boundaries` or equivalent) rather than relying on discipline alone, once implementation begins.
- **`components/ui/`** (shadcn primitives) may be imported by anything and imports nothing feature-specific — it's the one layer every other layer can depend on safely.
- **Barrel files used sparingly:** only at a feature's top level (`features/customers/index.ts`, the feature's public surface), never nested at every subfolder. Deep barrel chains are a common, avoidable source of accidental circular imports and slower builds in large Next.js apps.

---

## 14. Code Standards

- **File size:** soft guidance, not a hard lint wall — ~250 lines for a component, ~400 for `actions.ts`/`services.ts`. Beyond that, split by responsibility.
- **Component size:** a component should do one feature's one job. The New Order screen is never one giant component — it's a parent orchestrator plus `CustomerStep`, `ProductPickerStep`, `SizeQuantityGrid`, `OrderCartReview`, mirroring the step boundaries already drawn in Screen Specs §11.
- **Folder organization:** feature-first, as established in §2–4.
- **Naming conventions:** booleans prefixed `is`/`has`/`should` (`isLoading`, `hasError`); local handlers prefixed `handle` (`handleSubmit`), component props prefixed `on` (`onSubmit`) — standard, unambiguous React convention, applied consistently rather than left to individual preference.
- **Comment strategy:** matches the project's stated engineering philosophy — comments explain *why* (a non-obvious constraint, a workaround), never *what* (which the code and its names already say).
- **Error boundaries:** Next.js `error.tsx` per route segment that can meaningfully fail independently (e.g. `orders/error.tsx` catches an Order List fetch failure without taking down the whole authenticated shell), plus one root-level `app/error.tsx` as the final catch-all — styled per the Design System's Error state, never a raw stack trace shown to a warehouse user.

---

## 15. Performance

| Strategy | Application |
|---|---|
| **Lazy Loading** | Route-based, automatic via App Router. Additionally, `next/dynamic` for heavy/rare pieces — the XPS→PDF utility and the Invoice print-rendering path — so their weight never loads into the Dashboard's initial bundle. |
| **Code Splitting** | Route-based by default; component-based via `next/dynamic` for the cases above. |
| **Memoization** | Applied deliberately where profiling shows a real cost (e.g. the New Order size-grid recalculating totals across many rows on every keystroke) — not as a reflexive default on every component, which adds complexity without measured benefit. |
| **Virtualization** | Not needed at v1's expected single-warehouse data volume. `DataTable` is built on TanStack Table specifically so TanStack Virtual (§1) drops in later without a rewrite, if years of accumulated orders eventually justify it. |
| **Image Optimization** | `next/image` for every product photo and the company logo, with the Screen-Specs §6 placeholder-image behavior implemented once as the component's fallback, not reimplemented at every render site. |

---

## 16. RTL — Architectural Enforcement, Not Just Visual Styling

- `dir="rtl"` and `lang="fa"` are set exactly once, at the HTML root in `app/layout.tsx` — never per-component, never conditionally.
- **There is no LTR code path in v1.** Per the Design System's founding principle ("author RTL-native, never mirror"), there is nothing to mirror *from* — no parallel LTR layout exists anywhere to keep in sync or accidentally diverge from. If English/LTR support is ever needed, that is a deliberate, scoped internationalization project undertaken later, not a toggle this architecture is pretending to already support.
- Tailwind v4's logical spacing utilities (`ms-`/`me-`/`ps-`/`pe-` — *start/end*, not *left/right*) are the default and only convention for anything directional. This makes RTL correct **by construction**: a developer who reaches for `ms-4` instead of `ml-4` out of habit gets the right visual result automatically, rather than needing to remember to flip it.
- Every RTL-specific behavioral detail called out in Design System §7–9 (chevron direction, switch fill direction, modal button order, pagination direction, table column order) is implemented once inside the shared component (`components/ui/`, `components/table/`, `components/form/`) — never re-decided per feature, which is exactly how RTL bugs creep in over a multi-year codebase.

---

## 17. Architecture Diagrams

### 17.1 Request/Mutation Flow

```
┌────────────┐     Server Component        ┌──────────────────┐
│  Browser   │ ───── (initial fetch) ─────▶ │  queries.ts       │──▶ services.ts ──▶ Prisma ──▶ Postgres
│  (Tablet)  │                              └──────────────────┘
│            │
│            │     Form submit               ┌──────────────────┐
│            │ ───── (Server Action) ───────▶ │  actions.ts        │──▶ Zod validate ──▶ services.ts ──▶ Prisma ──▶ Postgres
│            │                                └──────────────────┘
│            │                                         │
│            │        typed result                     ▼
│            │ ◀───── {success, data|errors} ── (no throw for expected validation failures)
│            │
│            │     TanStack Query useMutation
│            │ ── invalidateQueries(affected keys) ──▶ refetch ──▶ UI updates
└────────────┘

  Binary/file endpoints (PDF download, XPS→PDF) bypass Server Actions
  entirely and go through app/api/* Route Handlers instead — see §10.
```

### 17.2 Component Hierarchy (authenticated shell)

```
app/layout.tsx  (dir="rtl", lang="fa", Providers: Query/Theme/Session)
 └─ (dashboard)/layout.tsx → DashboardShell
     ├─ TopBar (breadcrumb, user, logout)
     ├─ Sidebar (desktop ≥1280px only)
     └─ <Content Area>
         └─ Feature page (app/(dashboard)/orders/new/page.tsx)
             └─ features/orders/components/order-builder/OrderBuilder
                 ├─ CustomerStep       (features/orders + features/customers' CustomerPicker, shared via components/shared)
                 ├─ ProductPickerStep  (components/table or grid + components/shared/EmptyState)
                 ├─ SizeQuantityGrid   (components/form primitives: quantity stepper, Pack/Unit toggle)
                 └─ OrderCartReview    (components/table row-like list + StickyFooterSlot)
```

### 17.3 Feature Module Internal Data Flow

```
 UI (components/)
   │  calls
   ▼
 hooks/use-*.ts  (TanStack Query wrapping actions.ts / queries.ts)
   │
   ├──▶ queries.ts   (read — used directly by Server Components too)
   └──▶ actions.ts   (write — Zod-validated Server Actions)
           │
           ▼
       services.ts   (pure business logic — the only layer that talks to Prisma)
           │
           ▼
         lib/db.ts  ──▶ Prisma ──▶ PostgreSQL
```

---

## 18. Future Scalability Recommendations

- **Multi-warehouse (Phase 01's confirmed future requirement):** the feature-module structure absorbs a new `warehouses` feature without touching existing ones; `orders`' services layer gains a `warehouseId` parameter rather than a redesign.
- **Server-side table filtering:** the `DataTable`/query-hook seam (§8) is the deliberate insertion point — no component-level rewrite needed when data volume crosses the threshold where client-side filtering stops being fast enough.
- **Dark mode:** the token-layer seam described in §11 — additive, zero component changes.
- **PIN/quick-switch login (Phase 01's deferred decision):** isolated entirely inside `features/auth/`; nothing elsewhere in the app references how a session was established, so this doesn't ripple outward.
- **Internationalization beyond Persian:** explicitly not designed for in v1 (§16) — if ever needed, it is scoped as its own project rather than something this architecture is silently carrying unused capacity for today. Avoiding that premature abstraction now is a deliberate simplicity choice, not an oversight.

---

## Summary of Standing Decisions Carried Into Implementation

- Server Actions for all form-shaped mutations; Route Handlers reserved only for Auth.js and binary file endpoints (PDF, XPS→PDF).
- One Zod schema per form, shared client/server — the single source of truth for validation.
- Feature isolation is a hard rule, not a suggestion: no feature imports another feature's internals, ever.
- `DataTable`, `CurrencyInput`, `StatusBadge`, and `useConfirmDialog()` are each built exactly once and reused everywhere their pattern recurs across the 18 screens in Screen Specs.
- No LTR code path exists anywhere — RTL is the only mode, by construction, not by per-component mirroring.
