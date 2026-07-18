import { db } from "@/lib/db";

const SEQUENCE_KEY = "product";

/** Same mechanism as `lib/customer/customer-code.ts` — see that file's comment for why a transactional `CodeSequence` row replaces a native Postgres sequence. */
export async function generateProductCode(): Promise<string> {
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

  return `P${nextNumber.toString().padStart(6, "0")}`;
}
