import { db } from "@/lib/db";

const SEQUENCE_KEY = "customer";

/**
 * Draws the next value from the `CodeSequence` row keyed `"customer"` and
 * formats it as `C000001`. Portable replacement for a native Postgres
 * sequence (SQLite has no such object) — an upsert-then-increment inside a
 * transaction, the same atomic-claim pattern `lib/order/order-number.ts`
 * already uses for order numbers. Gaps from a rolled-back creation are
 * acceptable (this is a permanent-identity code, not a gapless invoice
 * number), so a plain transactional increment is exactly what Phase 11's
 * "never reused" requirement needs.
 */
export async function generateCustomerCode(): Promise<string> {
  const nextNumber = await db.$transaction(async (tx) => {
    await tx.codeSequence.upsert({
      where: { key: SEQUENCE_KEY },
      update: {},
      create: { key: SEQUENCE_KEY, lastNumber: 0 },
    });
    const sequence = await tx.codeSequence.update({
      where: { key: SEQUENCE_KEY },
      data: { lastNumber: { increment: 1 } },
    });
    return sequence.lastNumber;
  });

  return `C${nextNumber.toString().padStart(6, "0")}`;
}
