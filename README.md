# SPCO Warehouse — سامانه انبار

Internal warehouse management system for a baby-clothing manufacturer: customers, product catalog (design → pieces → sizes), order entry optimized for tablet-wielding warehouse staff, payments (cash/cheque), and printable Persian pre-invoices. Persian-first, RTL-first, tablet-first. **Version 1.0.**

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Prisma 7 + **PostgreSQL** (the only supported database) · NextAuth v4 (credentials) · TanStack Query/Table · Zustand · Playwright (invoice PDF) · Ghostscript `gxps` (XPS→PDF utility)

## Quick start (development)

PostgreSQL is required — there is no bundled/embedded database. Point `DATABASE_URL` at a real, reachable Postgres instance (a local install, Docker, or a free-tier cloud Postgres such as Neon or Supabase both work fine for development) before anything below will run:

```bash
npm install
cp .env.example .env   # then edit DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npm run db:setup
npm run dev
```

`db:setup` generates the Prisma Client, applies every migration in `prisma/migrations/`, and seeds the database (3 RBAC roles + the initial admin account). It requires `DATABASE_URL` to already be a working connection string — unlike a bundled database, this step cannot create the server for you.

Open `http://localhost:3000` and log in:

- **Username:** `spcobaby`
- **Password:** `spcospco2026`

**Change this password immediately** via حساب کاربری (it's committed in `prisma/seed.ts`, so treat it as public), then fill تنظیمات → اطلاعات شرکت — the first pre-invoice cannot be generated until a company name exists.

### Other database scripts

```bash
npm run db:generate   # regenerate the Prisma Client after a schema change
npm run db:migrate     # create + apply a new migration (interactive, prompts for a name)
npm run db:push        # push schema changes without creating a migration (quick prototyping)
npm run db:seed        # re-run the seed only (idempotent — safe to run any time)
npm run db:studio      # open Prisma Studio, a GUI for the database
```

## Documentation

| Document | Contents |
|---|---|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Local setup, Ubuntu 24.04 VPS provisioning (PostgreSQL, PM2, Nginx), backup & restore |
| [docs/USER-GUIDE.md](docs/USER-GUIDE.md) | راهنمای کاربری فارسی برای کارکنان انبار |
| [docs/DEVELOPER-GUIDE.md](docs/DEVELOPER-GUIDE.md) | Project structure, conventions, how to add a feature |
| docs/UX-FLOW.md · DESIGN-SYSTEM.md · SCREEN-SPECS.md · FRONTEND-ARCHITECTURE.md | The approved design/architecture record the implementation was built against |

## System dependencies

- **PostgreSQL 15+** — required in every environment, including local development
- **Chromium for Playwright** — `npx playwright install --with-deps chromium` (invoice PDF export; printing works without it)
- **Ghostscript** — `apt install ghostscript` (provides `gxps` for the XPS→PDF utility)

## Scripts

```bash
npm run dev     # development server
npm run build   # production build (type-checks everything)
npm run start   # run the production build
npm run lint    # ESLint
```
