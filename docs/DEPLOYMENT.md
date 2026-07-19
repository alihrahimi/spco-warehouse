# Deployment Guide — SPCO Warehouse v1.0

PostgreSQL is the only supported database, in every environment — there is no bundled/embedded database and no SQLite fallback anywhere in this project. A real, reachable Postgres instance is required before `npm run dev`, `npm run db:setup`, or any other `db:*` script will do anything useful.

## Local development

Any Postgres 15+ instance works: a local install, Docker (`docker run -e POSTGRES_PASSWORD=... -p 5432:5432 postgres:16`), or a free-tier cloud Postgres (Neon, Supabase). Then:

```bash
git clone <repository> && cd spco-warehouse
npm install
cp .env.example .env   # edit DATABASE_URL to your real Postgres connection string
npm run db:setup       # generate client, apply migrations, seed roles + admin
npm run dev
```

Open `http://localhost:3000`, log in with `spcobaby` / `spcospco2026` (see `prisma/seed.ts`). To start over: drop and recreate the database, then re-run `npm run db:setup`.

## Production — Ubuntu 24.04, PostgreSQL, PM2, Nginx

### 1. System packages

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 20 LTS (Ubuntu 24.04's own repo Node is too old for Next.js 16)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL (Ubuntu 24.04 ships PostgreSQL 16)
sudo apt install -y postgresql postgresql-contrib

# Ghostscript — provides `gxps` for the XPS→PDF utility
sudo apt install -y ghostscript

# Nginx (reverse proxy) + Certbot (TLS)
sudo apt install -y nginx certbot python3-certbot-nginx

# PM2 (process manager)
sudo npm install -g pm2
```

### 2. Database

```bash
sudo -u postgres psql <<'SQL'
CREATE USER spco WITH PASSWORD 'REPLACE_WITH_A_STRONG_PASSWORD';
CREATE DATABASE spco_warehouse OWNER spco;
SQL
```

### 3. Application

```bash
sudo mkdir -p /opt/spco-warehouse && sudo chown $USER:$USER /opt/spco-warehouse
git clone <repository> /opt/spco-warehouse && cd /opt/spco-warehouse
npm ci
npx playwright install --with-deps chromium   # required for invoice PDF export
```

### 4. Environment variables

```bash
cp .env.example .env
nano .env
```

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://spco:<password>@localhost:5432/spco_warehouse?schema=public` |
| `NEXTAUTH_SECRET` | Output of `openssl rand -base64 32` — unique per environment, never reused |
| `NEXTAUTH_URL` | The public URL of the app, e.g. `https://anbar.example.ir` — also used by the PDF exporter to reach its own print page |

### 5. Migrate, seed, build

```bash
npx prisma generate
npx prisma migrate deploy    # applies prisma/migrations/* in order — never `migrate dev` in production
npm run db:seed              # idempotent: 3 RBAC roles + initial admin `spcobaby` / `spcospco2026`
npm run build
```

**Immediately after first login: change the `spcobaby` password** (حساب کاربری → تغییر رمز عبور). The seed password is in source control and must be treated as public. Then, as the admin, open **تنظیمات** and save the company name — pre-invoice generation is blocked until it exists.

### 6. Run under PM2

```bash
pm2 start npm --name spco-warehouse -- start
pm2 save
pm2 startup systemd   # prints a command to run once as root — run it to survive reboots
```

Useful PM2 commands: `pm2 status`, `pm2 logs spco-warehouse`, `pm2 restart spco-warehouse`.

### 7. Nginx reverse proxy

```nginx
# /etc/nginx/sites-available/spco-warehouse
server {
    listen 80;
    server_name anbar.example.ir;

    client_max_body_size 25M;  # matches the XPS→PDF and image upload limits

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # the auth audit log reads this
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/spco-warehouse /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d anbar.example.ir   # TLS
```

The `public/uploads/` directory holds product images, the company logo, and exported invoice PDFs — it must be writable by the user PM2 runs as and **included in backups**.

### 8. Backup

Two things constitute the entire system state:

```bash
# 1. Database (nightly cron recommended)
pg_dump -U spco -Fc spco_warehouse > /backup/spco_$(date +%F).dump

# 2. Uploaded files (logo/product images/invoice PDFs — referenced by DB rows)
tar czf /backup/uploads_$(date +%F).tar.gz -C /opt/spco-warehouse/public uploads
```

Keep at least 14 daily copies off the VPS. The invoice snapshot guarantee depends on upload files never being lost: DB rows reference them by immutable path.

### 9. Restore

```bash
pm2 stop spco-warehouse
sudo -u postgres dropdb spco_warehouse && sudo -u postgres createdb -O spco spco_warehouse
pg_restore -U spco -d spco_warehouse /backup/spco_<date>.dump
tar xzf /backup/uploads_<date>.tar.gz -C /opt/spco-warehouse/public
pm2 start spco-warehouse
```

Restore DB and uploads **from the same date** — they reference each other.

### 10. Upgrades

```bash
cd /opt/spco-warehouse
git pull
npm ci
npx prisma migrate deploy    # new migrations only; existing data preserved
npm run build
pm2 restart spco-warehouse
```

Take a backup (step 8) before every upgrade.
