# SPCO Warehouse — سامانه انبار

Internal warehouse management system for a baby-clothing manufacturer: customers, product catalog (design → pieces → sizes), order entry optimized for tablet-wielding warehouse staff, payments (cash/cheque), and printable Persian pre-invoices. Persian-first, RTL-first, tablet-first. **Version 1.0.**

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Prisma 7 (SQLite for local dev, Postgres-ready for production) · NextAuth v4 (credentials) · TanStack Query/Table · Zustand · Playwright (invoice PDF) · Ghostscript `gxps` (XPS→PDF utility)

## Quick start (development)

No database server to install, no manual configuration — this is the entire setup:

```bash
npm install
npm run db:setup
npm run dev
```

`db:setup` generates the Prisma Client, creates and migrates a local SQLite database at `prisma/dev.db`, and seeds it (3 RBAC roles + the initial admin account). `.env` already ships with a working `DATABASE_URL` pointing at that file — nothing to fill in.

Open `http://localhost:3000` and log in:

- **Username:** `spcobaby`
- **Password:** `spcospco2026`

**Change this password immediately** via حساب کاربری (it's committed in `prisma/seed.ts`, so treat it as public), then fill تنظیمات → اطلاعات شرکت — the first pre-invoice cannot be generated until a company name exists.

### Resetting your local database

```bash
rm prisma/dev.db   # Windows PowerShell: Remove-Item prisma/dev.db
npm run db:setup
```

### Other database scripts

```bash
npm run db:generate   # regenerate the Prisma Client after a schema change
npm run db:migrate     # create + apply a new migration (interactive, prompts for a name)
npm run db:push        # push schema changes without creating a migration (quick prototyping)
npm run db:seed        # re-run the seed only (idempotent — safe to run any time)
npm run db:studio      # open Prisma Studio, a GUI for the local database
```

## Moving to production (PostgreSQL)

The schema is deliberately provider-agnostic — no Postgres-only native types, no Prisma `enum` blocks (SQLite doesn't support enums; every former enum is now a plain `String` validated by a matching union type in `src/lib/enums.ts` + Zod at the application boundary), no `LATERAL` joins or other Postgres-only SQL in the raw queries. Moving to Postgres is exactly three steps, with **zero application code changes**:

1. In `prisma/schema.prisma`, change `datasource db { provider = "sqlite" }` to `provider = "postgresql"`.
2. Set `DATABASE_URL` to a `postgresql://...` connection string (`src/lib/db.ts` picks the matching driver adapter automatically from the URL scheme).
3. Run `npx prisma migrate dev --name init` against the Postgres database to generate and apply a fresh Postgres migration history (the SQLite migrations in `prisma/migrations/` are SQLite-specific DDL and don't apply to Postgres — this is expected, not an error).

Full walkthrough in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). `prisma/migrations-postgresql-reference/` holds the original hand-authored Postgres migration set from before the SQLite conversion, kept only as a reference.

## Documentation

| Document | Contents |
|---|---|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Local setup, VPS provisioning, Postgres migration, backup & restore |
| [docs/USER-GUIDE.md](docs/USER-GUIDE.md) | راهنمای کاربری فارسی برای کارکنان انبار |
| [docs/DEVELOPER-GUIDE.md](docs/DEVELOPER-GUIDE.md) | Project structure, conventions, how to add a feature |
| docs/UX-FLOW.md · DESIGN-SYSTEM.md · SCREEN-SPECS.md · FRONTEND-ARCHITECTURE.md | The approved design/architecture record the implementation was built against |

## System dependencies (production only — none required for local dev)

- **PostgreSQL 15+** (local dev uses SQLite, no install needed)
- **Chromium for Playwright** — `npx playwright install --with-deps chromium` (invoice PDF export; printing works without it)
- **Ghostscript** — `apt install ghostscript` (provides `gxps` for the XPS→PDF utility)

## Scripts

```bash
npm run dev     # development server
npm run build   # production build (type-checks everything)
npm run start   # run the production build
npm run lint    # ESLint
```
