import "dotenv/config";

import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";
import { ROLE_LABELS_FA, ROLE_SLUGS, type RoleSlug } from "../src/lib/auth/roles";

/**
 * Roles: structural reference data every deployment needs for RBAC to
 * function at all, not business/mock data.
 *
 * Initial accounts: explicitly requested with literal credentials — one
 * Administrator (`spcobaby`) and one Warehouse Staff (`spcoanbar`), the two
 * default logins for the final-revision split between `/login/admin` and
 * `/login/warehouse`. Idempotent (only created if the username doesn't
 * already exist), password hashed with the same `hashPassword()` every
 * other password in the app goes through, never stored in plain text.
 *
 * Security note worth flagging explicitly: the plaintext passwords below
 * live in source control once this file is committed. That's an accepted
 * tradeoff for documented bootstrap credentials (changeable afterward
 * through the application), not an oversight — but they should be treated
 * as effectively public and changed immediately after first deployment.
 */
const INITIAL_ACCOUNTS: { username: string; password: string; fullName: string; role: RoleSlug }[] = [
  { username: "spcobaby", password: "spcospco2026", fullName: "مدیر سیستم", role: ROLE_SLUGS.ADMINISTRATOR },
  { username: "spcoanbar", password: "spcoanbar", fullName: "کارمند انبار", role: ROLE_SLUGS.WAREHOUSE_STAFF },
];

async function main() {
  for (const slug of Object.values(ROLE_SLUGS)) {
    await db.role.upsert({
      where: { name: slug },
      update: {},
      create: {
        name: slug,
        description: ROLE_LABELS_FA[slug],
      },
    });
    console.log(`Role ensured: ${slug} (${ROLE_LABELS_FA[slug]})`);
  }

  for (const account of INITIAL_ACCOUNTS) {
    const existing = await db.user.findUnique({ where: { username: account.username } });
    if (existing) {
      console.log(`Account already exists (${account.username}) — skipped.`);
      continue;
    }

    const role = await db.role.findUniqueOrThrow({ where: { name: account.role } });
    const passwordHash = await hashPassword(account.password);

    await db.user.create({
      data: {
        username: account.username,
        passwordHash,
        fullName: account.fullName,
        roleId: role.id,
        status: "active",
      },
    });
    console.log(`Account created: ${account.username} (${account.role})`);
  }

  await db.$disconnect();
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
