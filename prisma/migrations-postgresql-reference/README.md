# Archived Postgres migration history

These 8 migration folders were generated against the original Postgres-only
schema (native `enum` types, `@db.Uuid`/`@db.Timestamptz`/`@db.VarChar`,
`customer_code_seq`/`product_code_seq` sequences). They predate the SQLite
local-dev conversion and are **not compatible with the current
`prisma/schema.prisma`** — do not copy them into `prisma/migrations/` as-is.

They are kept only as a reference for hand-authoring (or diffing against) a
Postgres migration history if/when this project provisions a real Postgres
instance for production. The current `prisma/migrations/` directory holds
the SQLite migration history that `npm run db:setup` actually applies.

No real database was ever connected to this project while these were the
active migrations — nothing here represents live production data.
