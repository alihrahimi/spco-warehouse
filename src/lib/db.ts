import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma 7 requires an explicit driver adapter — there is no built-in
 * connection engine anymore. Which adapter to construct is picked from
 * `DATABASE_URL`'s scheme, not hardcoded: a `file:` URL (SQLite, the
 * checked-in local-dev default — see `prisma/schema.prisma`) gets the
 * `better-sqlite3` adapter, anything else (a `postgresql://` URL) gets the
 * `pg` adapter. This is what makes the production migration genuinely
 * "change `DATABASE_URL`, change the schema provider, run migrations" —
 * this file needs no edit either way, matching `prisma.config.ts`'s
 * identical detection.
 *
 * The `globalThis` cache is the standard Next.js dev-mode pattern: without
 * it, every hot-reload of a file importing this module would construct a
 * new client/connection, quickly exhausting a real database's connection
 * limit (irrelevant for SQLite's single file, but the pattern costs
 * nothing to keep and matters again the moment `DATABASE_URL` points at
 * Postgres).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  if (url.startsWith("file:")) {
    const adapter = new PrismaBetterSqlite3({ url });
    return new PrismaClient({ adapter });
  }

  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
