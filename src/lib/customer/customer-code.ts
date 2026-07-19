import { db } from "@/lib/db";

const SEQUENCE_KEY = "customer";

/**
 * Draws the next value from the `CodeSequence` row keyed `"customer"` and
 * formats it as `C000001`. An application-level counter table — the same
 * upsert-then-increment-inside-a-transaction pattern `lib/order/order-
 * number.ts` already uses for order numbers — rather than a native
 * Postgres `SEQUENCE` object, so the same atomic-claim code works
 * uniformly across every counter this app needs. Gaps from a rolled-back
 * creation are acceptable (this is a permanent-identity code, not a
 * gapless invoice number), so a plain transactional increment is exactly
 * what Phase 11's "never reused" requirement needs.
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
