"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query, e.g. `useMediaQuery("(min-width: 1280px)")`.
 *
 * Built on `useSyncExternalStore` rather than a `useEffect` + `useState`
 * pair: it is the React-recommended primitive for subscribing to external,
 * mutable browser state (here, `matchMedia`), and it avoids the
 * server/client hydration mismatch that an effect-based version would
 * produce on first render (the server has no `window` to evaluate the query
 * against, so `getServerSnapshot` explicitly reports `false`).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onStoreChange);
      return () => mediaQueryList.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
