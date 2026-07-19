# Developer Guide — SPCO Warehouse v1.0

Read [FRONTEND-ARCHITECTURE.md](./FRONTEND-ARCHITECTURE.md) first — it is the binding structural blueprint. This guide is the practical companion: where things live, the rules that keep the codebase healthy, and how to add to it.

## Project structure (as built)

```
src/
├─ app/                # Routes ONLY. (auth)=public, (dashboard)=authenticated shell,
│  │                   # print/=chrome-free invoice, api/=Auth.js + binary endpoints only
├─ features/           # THE APPLICATION — auth, customers, products, orders, payments,
│  │                   # invoices, settings, dashboard, reports, search
│  └─ <feature>/       # schemas/ (Zod) · services.ts (Prisma, business logic) ·
│                      # actions.ts ("use server" entry points) · components/ · index.ts (public surface)
├─ components/         # ui/ (primitives) · shared/ (feature-agnostic) · layout/ · table/ · form/
├─ lib/                # db.ts, auth/, audit/, format/ (Jalali+Toman), storage/, pdf/,
│                      # notifications/, order/, product/, customer/
├─ store/              # Zustand (order-builder-store)
├─ providers/          # Query/Session/Tooltip/ConfirmDialog composition (app-providers.tsx)
├─ hooks/ config/ constants/ types/
└─ proxy.ts            # Auth + permission gate (Next 16 middleware)
```

## The rules that matter

1. **Feature isolation.** A feature never imports another feature's internals. Cross-feature needs go through the target feature's `index.ts` public surface (see `features/customers/index.ts`) or get promoted to `components/shared/`/`lib/`.
2. **One Zod schema per form**, in the feature's `schemas/`, used by BOTH the client resolver and the Server Action — validation never drifts.
3. **Server Actions for all form-shaped mutations.** Route Handlers exist only for Auth.js and binary responses (invoice PDF, XPS→PDF). Every action's first line is `requirePermission(...)`/`requireSession()` — the proxy protects pages, actions protect themselves.
4. **Money is `BigInt` Toman end-to-end**; raw-SQL aggregates come back as strings from the `pg` driver — normalize with the established `normalizeBigint`/`toBigint` pattern. Dates are stored Gregorian, displayed Jalali only via `lib/format/date.ts`.
5. **Persian digits in UI, Latin in storage** — `lib/format/persian-digits.ts` at the boundary, never inline conversions.
6. **Snapshots are sacred.** `OrderItem` freezes catalog data at order time; `InvoiceDocument` freezes company identity at pre-invoice generation. Never "fix" a historical document by re-reading live data. Uploaded files use immutable UUID paths and are never overwritten in place.
7. **Status badges are per-domain.** Order (`StatusBadge`), account, customer, product, notification badges each own their vocabulary — never reuse one domain's badge for another (recurring bug class, caught three times).
8. **Soft delete by status** (`inactive`/`blocked`), never row deletion, for anything referenced by history. Only drafts hard-delete.
9. **Audit everything business-visible** via `lib/audit/log.ts` (generic) or `lib/auth/audit-log.ts` (auth events). Audit writes never throw.
10. **RTL is by construction**: logical properties (`ms-/me-/ps-/pe-/start/end`) everywhere; the few deliberate physical exceptions (switch thumb, progress origin) are commented in place.
11. **No Prisma `enum` columns.** What used to be Prisma enums are plain `String` columns validated by the union types in `src/lib/enums.ts` + each feature's Zod schema — add new values there, not as a schema `enum` block. This was never a SQLite-compatibility workaround (PostgreSQL is the only supported database — see README); plain `String` columns just make adding/renaming a value a data migration instead of a schema-level `ALTER TYPE`, and it's simpler for one column type to always mean "validated by the application layer."

## Adding a feature (checklist)

1. `features/<name>/{schemas,components}/`, `services.ts`, `actions.ts`.
2. Pages under `app/(dashboard)/<name>/`; add `error.tsx` if it can fail independently.
3. Admin-only? Add the prefix to `ROUTE_PERMISSIONS` in `proxy.ts` AND gate the actions.
4. New tables/columns → edit `prisma/schema.prisma` (rule 11 above — no `enum` columns), then `npx prisma migrate dev --name <description>` against your local Postgres database to generate + apply the migration in one step. Read the generated SQL before committing it regardless — the auto-generated file is normally correct as-is, but "normally" isn't "always."
5. Nav: TopNav link in `(dashboard)/layout.tsx` and/or a Dashboard tile.
6. `npm run build && npm run lint` must both pass clean — warnings are fixed, not accumulated.

## Testing note

v1 has no automated test suite (an accepted, documented limitation — see the delivery report). The build's strict TypeScript pass + ESLint are the current gates; `npm run build` type-checks every page and action signature. When tests are introduced, colocate as `*.test.ts` next to the unit under test (already reserved in the naming conventions).
