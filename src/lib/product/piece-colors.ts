/**
 * Deterministic pastel color per Piece name — same name always maps to the
 * same color, everywhere a piece is shown (Product Details, Accounting
 * Helper), so an admin can visually recognize "بدنه" or "آستین" at a
 * glance without reading the label. Keyed by name (not id): two products
 * that both have a "بلوز" piece get the same color, which is the point —
 * fast recognition works because the mapping is consistent across the
 * whole catalog, not just within one product.
 */
const PALETTE = [
  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-400" },
  { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-400" },
  { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-400" },
  { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200", dot: "bg-yellow-400" },
  { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-400" },
  { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", dot: "bg-pink-400" },
  { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-400" },
  { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-400" },
] as const;

export interface PieceColor {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

/** Simple, stable string hash (djb2) — no crypto needed, just needs to be deterministic across renders/sessions. */
function hashString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return Math.abs(hash);
}

export function getPieceColor(pieceName: string): PieceColor {
  const index = hashString(pieceName.trim().toLowerCase()) % PALETTE.length;
  // PALETTE[0] fallback is unreachable in practice (index is always < PALETTE.length) — only here to satisfy noUncheckedIndexedAccess.
  return PALETTE[index] ?? PALETTE[0];
}
