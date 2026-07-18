# Deployment Guide — SPCO Warehouse v1.0

## Local development (SQLite — no server to install)

```bash
git clone <repository> && cd spco-warehouse
npm install
npm run db:setup    # generate client, create+migrate prisma/dev.db, seed roles + admin
npm run dev
```

Open `http://localhost:3000`, log in with `spcobaby` / `spcospco2026` (see `prisma/seed.ts`). `.env` ships with a working `DATABASE_URL="file:./prisma/dev.db"` — nothing to edit. To start over: delete `prisma/dev.db` and re-run `npm run db:setup`.

This is a genuinely separate, disposable database from production — see "Moving to production" below for how the two stay decoupled while sharing one schema and one codebase.

## Production (PostgreSQL on a VPS)

Target: a single Linux VPS (Debian/Ubuntu assumed). The architecture also allows a future on-premise move — the steps are identical on any machine meeting the dependencies.

### 1. System provisioning

```bash
# Node.js 20+ (via nodesource or nvm), then:
apt update
apt install -y postgresql ghostscript        # ghostscript provides `gxps` (XPS→PDF utility)
```

Create the database and user:

```sql
CREATE USER spco WITH PASSWORD '<strong-password>';
CREATE DATABASE spco_warehouse OWNER spco;
```

### 2. Application setup

```bash
git clone <repository> /opt/spco-warehouse && cd /opt/spco-warehouse
npm ci
npx playwright install --with-deps chromium   # required for invoice PDF export
```

### 3. Switch the schema from SQLite to Postgres

The schema is deliberately provider-agnostic (no Postgres-only native types, no Prisma `enum` blocks — see `src/lib/enums.ts`, no `LATERAL` joins in the raw SQL), specifically so this is the entire migration:

1. Open `prisma/schema.prisma` and change:
   ```prisma
   datasource db {
     provider = "sqlite"
   }
   ```
   to:
   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```
2. Set `.env`'s `DATABASE_URL` to the Postgres connection string (below) — `src/lib/db.ts` and `prisma.config.ts` both pick the matching driver adapter automatically from the URL scheme (`file:` vs `postgresql://`), so no other file needs to change.
3. Generate a fresh Postgres migration history — the committed `prisma/migrations/` directory holds SQLite-specific DDL that does not apply to Postgres:
   ```bash
   npx prisma migrate dev --name init
   ```
   (`prisma/migrations-postgresql-reference/` holds the original hand-authored Postgres migration set from before the SQLite conversion, kept only as a reference if you'd rather hand-author this one instead of regenerating it.)

No application code — services, actions, components, the seed script — needs to change for this switch. That was the explicit design goal of removing every Postgres-only construct from the schema and raw queries.

### Environment variables (`.env`)

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://spco:<password>@localhost:5432/spco_warehouse?schema=public` |
| `NEXTAUTH_SECRET` | Output of `openssl rand -base64 32` — unique per environment, never reused |
| `NEXTAUTH_URL` | The public URL of the app, e.g. `https://anbar.example.ir` — also used by the PDF exporter to reach its own print page |

### 4. Migrate and seed

```bash
npx prisma generate
npx prisma migrate deploy    # applies prisma/migrations/* in order — never `migrate dev` in production
npm run db:seed              # idempotent: 3 RBAC roles + initial admin `spcobaby`
```

**Immediately after first login: change the `spcobaby` password** (حساب کاربری → تغییر رمز عبور). The seed password is in source control and must be treated as public.

Then, as the admin, open **تنظیمات** and save the company name — pre-invoice generation is blocked until it exists.

### 5. Build and run

```bash
npm run build
npm run start                # serves on port 3000
```

Run under a process manager (systemd example):

```ini
# /etc/systemd/system/spco-warehouse.service
[Unit]
Description=SPCO Warehouse
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/spco-warehouse
ExecStart=/usr/bin/npm run start
Restart=always
EnvironmentFile=/opt/spco-warehouse/.env

[Install]
WantedBy=multi-user.target
```

Put Nginx/Caddy in front for TLS and set `X-Forwarded-For` (the auth audit log reads it). The `public/uploads/` directory holds product images, the company logo, and exported invoice PDFs — it must be writable by the service user and **included in backups**.

### 6. Backup

Two things constitute the entire system state:

```bash
# 1. Database (nightly cron recommended)
pg_dump -U spco -Fc spco_warehouse > /backup/spco_$(date +%F).dump

# 2. Uploaded files (logo/product images/invoice PDFs — referenced by DB rows)
tar czf /backup/uploads_$(date +%F).tar.gz -C /opt/spco-warehouse/public uploads
```

Keep at least 14 daily copies off the VPS. The invoice snapshot guarantee depends on upload files never being lost: DB rows reference them by immutable path.

### 7. Restore

```bash
systemctl stop spco-warehouse
dropdb -U spco spco_warehouse && createdb -U spco spco_warehouse
pg_restore -U spco -d spco_warehouse /backup/spco_<date>.dump
tar xzf /backup/uploads_<date>.tar.gz -C /opt/spco-warehouse/public
systemctl start spco-warehouse
```

Restore DB and uploads **from the same date** — they reference each other.

### 8. Upgrades

```bash
cd /opt/spco-warehouse
git pull
npm ci
npx prisma migrate deploy    # new migrations only; existing data preserved
npm run build
systemctl restart spco-warehouse
```

Take a backup (step 6) before every upgrade.
