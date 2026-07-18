import { create } from "zustand";

/**
 * Cross-step state of the New Order builder (FRONTEND-ARCHITECTURE.md §6
 * reserved this exact store): the draft's identity, selected customer,
 * and the full line map keyed by productPieceSizeId. Display metadata
 * (names, price, pack size) rides along with each line so the review list
 * and live summary render without re-fetching.
 *
 * Auto-save (Phase 13) hangs off `dirty`: every mutation marks the store
 * dirty, and the builder's debounced effect persists dirty state via
 * `saveDraftAction`, then records the returned orderId — so an
 * unexpectedly closed tab loses at most a few seconds of taps, and the
 * draft reappears in the order list for recovery.
 */

export interface BuilderCustomer {
  id: string;
  customerCode: string;
  name: string;
  mobile: string;
}

export interface BuilderLine {
  productPieceSizeId: string;
  productId: string;
  productName: string;
  productCode: string;
  pieceName: string;
  sizeLabel: string;
  packQuantity: number;
  unitQuantity: number;
  packSize: number;
  unitPrice: number;
}

export interface BuilderTotals {
  productCount: number;
  pieceCount: number;
  totalPacks: number;
  totalUnits: number;
  totalAmount: number;
}

interface OrderBuilderState {
  orderId: string | null;
  /** `draft` for the normal flow; `versioned_edit` when editing a generated order (updateOrderAction path). */
  mode: "draft" | "versioned_edit";
  customer: BuilderCustomer | null;
  lines: Record<string, BuilderLine>;
  notes: string;
  customerNotes: string;
  dirty: boolean;
  saving: boolean;
  lastSavedAt: Date | null;

  setCustomer: (customer: BuilderCustomer) => void;
  setLine: (line: BuilderLine) => void;
  removeLine: (productPieceSizeId: string) => void;
  removeProduct: (productId: string) => void;
  setNotes: (notes: string) => void;
  setCustomerNotes: (customerNotes: string) => void;
  markSaved: (orderId: string) => void;
  setSaving: (saving: boolean) => void;
  loadExisting: (state: {
    orderId: string;
    mode: "draft" | "versioned_edit";
    customer: BuilderCustomer;
    lines: BuilderLine[];
    notes: string;
    customerNotes: string;
  }) => void;
  reset: () => void;
}

const EMPTY = {
  orderId: null as string | null,
  mode: "draft" as const,
  customer: null as BuilderCustomer | null,
  lines: {} as Record<string, BuilderLine>,
  notes: "",
  customerNotes: "",
  dirty: false,
  saving: false,
  lastSavedAt: null as Date | null,
};

export const useOrderBuilderStore = create<OrderBuilderState>((set) => ({
  ...EMPTY,

  setCustomer: (customer) => set({ customer, dirty: true }),

  setLine: (line) =>
    set((state) => {
      if (line.packQuantity === 0 && line.unitQuantity === 0) {
        return {
          lines: Object.fromEntries(Object.entries(state.lines).filter(([key]) => key !== line.productPieceSizeId)),
          dirty: true,
        };
      }
      return { lines: { ...state.lines, [line.productPieceSizeId]: line }, dirty: true };
    }),

  removeLine: (productPieceSizeId) =>
    set((state) => ({
      lines: Object.fromEntries(Object.entries(state.lines).filter(([key]) => key !== productPieceSizeId)),
      dirty: true,
    })),

  removeProduct: (productId) =>
    set((state) => ({
      lines: Object.fromEntries(Object.entries(state.lines).filter(([, line]) => line.productId !== productId)),
      dirty: true,
    })),

  setNotes: (notes) => set({ notes, dirty: true }),
  setCustomerNotes: (customerNotes) => set({ customerNotes, dirty: true }),

  markSaved: (orderId) => set({ orderId, dirty: false, saving: false, lastSavedAt: new Date() }),
  setSaving: (saving) => set({ saving }),

  loadExisting: ({ orderId, mode, customer, lines, notes, customerNotes }) =>
    set({
      ...EMPTY,
      orderId,
      mode,
      customer,
      notes,
      customerNotes,
      lines: Object.fromEntries(lines.map((line) => [line.productPieceSizeId, line])),
    }),

  reset: () => set({ ...EMPTY }),
}));

/** Phase 13's live summary, derived on every render from the line map — never cached state that could drift. */
export function computeTotals(lines: Record<string, BuilderLine>): BuilderTotals {
  const all = Object.values(lines);
  const products = new Set(all.map((line) => line.productId));
  const pieces = new Set(all.map((line) => `${line.productId}:${line.pieceName}`));

  let totalPacks = 0;
  let totalUnits = 0;
  let totalAmount = 0;
  for (const line of all) {
    const units = line.packQuantity * line.packSize + line.unitQuantity;
    totalPacks += line.packQuantity;
    totalUnits += units;
    totalAmount += units * line.unitPrice;
  }

  return { productCount: products.size, pieceCount: pieces.size, totalPacks, totalUnits, totalAmount };
}
