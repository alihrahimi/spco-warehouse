/**
 * Bulk Price Update's "configurable upward rounding" (Phase 12) — always
 * rounds up (`ceil`), never down, since rounding a price down after an
 * increase would silently undercut the intended change. `roundTo <= 1`
 * (or omitted) means no rounding is applied.
 */
export function roundPriceUp(price: number, roundTo: number): number {
  if (!roundTo || roundTo <= 1) return price;
  return Math.ceil(price / roundTo) * roundTo;
}

export type PriceAdjustment =
  | { type: "percentage_increase"; value: number }
  | { type: "percentage_decrease"; value: number }
  | { type: "fixed_increase"; value: number }
  | { type: "fixed_decrease"; value: number };

export function applyPriceAdjustment(currentPrice: number, adjustment: PriceAdjustment, roundTo: number): number {
  let next: number;
  switch (adjustment.type) {
    case "percentage_increase":
      next = currentPrice * (1 + adjustment.value / 100);
      break;
    case "percentage_decrease":
      next = currentPrice * (1 - adjustment.value / 100);
      break;
    case "fixed_increase":
      next = currentPrice + adjustment.value;
      break;
    case "fixed_decrease":
      next = currentPrice - adjustment.value;
      break;
  }
  // Never let a decrease push a price to zero or below — Phase 12's
  // "Invalid Prices" validation rule applies here too, not just on manual
  // entry.
  const floored = Math.max(next, 1);
  return roundPriceUp(floored, roundTo);
}
