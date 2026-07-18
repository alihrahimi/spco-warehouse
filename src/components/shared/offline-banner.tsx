"use client";

import { WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

/**
 * The v1 "Offline" state (Phase 14): a persistent banner, not an offline
 * mode — Phase 01 fixed v1 as connectivity-required, so the honest UX is
 * telling staff clearly that saving won't work until the connection
 * returns, rather than pretending at offline capability the architecture
 * doesn't have. Same `useSyncExternalStore` pattern as `useMediaQuery`
 * (SSR-safe: the server snapshot reports online).
 */
export function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  if (isOnline) return null;

  return (
    <div role="alert" className="flex items-center justify-center gap-2 bg-danger px-4 py-2.5 text-body-small font-medium text-primary-foreground print:hidden">
      <WifiOff className="size-4" />
      اتصال اینترنت برقرار نیست — تا برقراری مجدد اتصال، تغییرات ذخیره نمی‌شوند.
    </div>
  );
}
