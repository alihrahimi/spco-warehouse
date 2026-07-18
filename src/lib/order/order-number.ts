import type { Prisma } from "@prisma/client";

import { getCurrentJalaliYear } from "@/lib/format/date";

type TransactionClient = Prisma.TransactionClient;

/**
 * Draws the next yearly-sequential order number (`1405-000001`, resetting
 * each Persian year) from the `InvoiceSequence` table designed for exactly
 * this in the Database Phase. Must be called INSIDE the same transaction
 * that persists the order — the `upsert` + `update` pair on the unique
 * `jalaliYear` row serializes concurrent claimants via row locking, so two
 * tablets converting drafts simultaneously can never receive the same
 * number, and a rolled-back conversion re-uses nothing (the sequence row
 * update rolls back with it, unlike a native Postgres sequence — gapless
 * numbering is what the business expects of invoice numbers).
 *
 * If an `InvoiceSettings` row exists with a non-empty prefix, it is
 * prepended (`INV-1405-000001`); with no Settings module yet (Phase 14),
 * no row exists and the bare `1405-000001` format from the Phase 13 brief
 * is what's produced.
 */
export async function generateOrderNumber(tx: TransactionClient): Promise<{ orderNumber: string; jalaliYear: number }> {
  const jalaliYear = getCurrentJalaliYear();

  await tx.invoiceSequence.upsert({
    where: { jalaliYear },
    update: {},
    create: { jalaliYear, lastNumber: 0 },
  });

  const sequence = await tx.invoiceSequence.update({
    where: { jalaliYear },
    data: { lastNumber: { increment: 1 } },
  });

  const settings = await tx.invoiceSettings.findFirst();
  const prefix = settings?.numberPrefix?.trim();

  const core = `${jalaliYear}-${sequence.lastNumber.toString().padStart(6, "0")}`;
  return { orderNumber: prefix ? `${prefix}-${core}` : core, jalaliYear };
}
