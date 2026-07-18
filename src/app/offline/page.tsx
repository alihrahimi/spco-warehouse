import { WifiOff } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

/**
 * Static fallback at `/offline` (Phase 14's "Offline" error page). v1 has
 * no service worker / offline data mode by design (Phase 01) — a fully
 * disconnected browser cannot fetch ANY new route from this server, so
 * this page is reachable only in the one case that matters: a stale tab
 * still holds the app shell and a client-side navigation lands here while
 * offline. It states the real limitation honestly rather than promising
 * offline capability the architecture doesn't have. The persistent
 * `OfflineBanner` in the dashboard layout is the primary offline signal —
 * this route is the fallback destination, not the main mechanism.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <EmptyState
        icon={WifiOff}
        title="اتصال اینترنت برقرار نیست"
        description="این سامانه بدون اتصال اینترنت کار نمی‌کند. پس از برقراری مجدد اتصال، دوباره تلاش کنید."
      />
    </div>
  );
}
