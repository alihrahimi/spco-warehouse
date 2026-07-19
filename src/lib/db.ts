import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma 7 requires an explicit driver adapter — there is no built-in
 * connection engine anymore. PostgreSQL is the only supported database
 * (no SQLite anywhere in this project), so this always constructs the
 * `pg` adapter from `DATABASE_URL` — no provider branching.
 *
 * The `globalThis` cache is the standard Next.js dev-mode pattern: without
 * it, every hot-reload of a file importing this module would construct a
 * new connection pool, quickly exhausting Postgres's connection limit.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
