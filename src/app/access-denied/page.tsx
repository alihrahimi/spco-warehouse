import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

/**
 * Reached only when `middleware.ts` blocks an *authenticated* request that
 * lacks the required permission for a route (e.g. Warehouse Staff hitting
 * `/settings`) — distinct from being redirected to `/login`, which is for
 * requests with no session at all.
 */
export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <EmptyState
        icon={ShieldAlert}
        title="دسترسی مجاز نیست"
        description="شما اجازه دسترسی به این صفحه را ندارید. در صورت نیاز با مدیر سیستم تماس بگیرید."
        action={
          <Button asChild>
            <Link href="/">بازگشت به داشبورد</Link>
          </Button>
        }
      />
    </div>
  );
}
