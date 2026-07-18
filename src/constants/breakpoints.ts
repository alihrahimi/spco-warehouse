/**
 * Responsive breakpoints, per DESIGN-SYSTEM.md §16.
 * Tablet is the primary design target; mobile and desktop are secondary.
 */
export const breakpoints = {
  /** Below this width: mobile layout. */
  mobile: 360,
  /** Tablet layout starts here — the primary design target. */
  tablet: 768,
  /** Desktop layout starts here — gains the persistent sidebar (FRONTEND-ARCHITECTURE.md §9). */
  desktop: 1280,
} as const;

export type Breakpoint = keyof typeof breakpoints;
