import { BarChart3, ClipboardList, Home, Package, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Avatar } from "@/components/ui/avatar";
import { TopNav } from "@/components/layout/top-nav";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { GlobalSearch } from "@/features/search/components/global-search";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { ROLE_LABELS_FA, isRoleSlug } from "@/lib/auth/roles";
import { getCompanySettings } from "@/features/settings/services";

/**
 * Server-side session check, in addition to `proxy.ts` — defense in
 * depth (a Server Component render isn't guaranteed to always go through
 * the proxy in every edge case, e.g. certain caching/prefetch paths), not
 * redundant.
 *
 * Final-revision requirement #1/#4: the Administrator Dashboard and
 * Warehouse Dashboard are two different applications sharing this one
 * shell — the nav rendered here branches on the session's permissions
 * rather than showing one universal link set, and both branches always
 * carry a Home affordance (this file's explicit Home button, plus the
 * company logo/title area wired as a link to "/" via `TopNav`'s
 * `titleHref`) back to whichever Dashboard their role renders at "/".
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  const roleLabel = isRoleSlug(role) ? ROLE_LABELS_FA[role] : role;
  const companySettings = await getCompanySettings();

  const canViewProducts = hasPermission(role, "products:view");
  const canViewCustomers = hasPermission(role, "customers:view");
  const canViewReports = hasPermission(role, "reports:view");

  return (
    <div className="flex min-h-screen flex-col bg-background print:bg-white">
      {/* App chrome never prints — report/list pages print only their content area. */}
      <div className="print:hidden">
        <TopNav
          title={session.user.name ?? session.user.username}
          titleHref="/"
          logoSrc={companySettings?.logoFilePath ?? null}
          actions={
            <>
              <GlobalSearch />
              <Link
                href="/"
                aria-label="داشبورد"
                className="flex items-center gap-1.5 text-body-small font-medium text-foreground-secondary hover:text-foreground"
              >
                <Home className="size-4" />
                داشبورد
              </Link>
              <Link
                href="/orders"
                className="flex items-center gap-1.5 text-body-small font-medium text-foreground-secondary hover:text-foreground"
              >
                <ClipboardList className="size-4" />
                سفارش‌ها
              </Link>
              {canViewProducts ? (
                <Link
                  href="/products"
                  className="flex items-center gap-1.5 text-body-small font-medium text-foreground-secondary hover:text-foreground"
                >
                  <Package className="size-4" />
                  محصولات
                </Link>
              ) : null}
              {canViewCustomers ? (
                <Link
                  href="/customers"
                  className="flex items-center gap-1.5 text-body-small font-medium text-foreground-secondary hover:text-foreground"
                >
                  <Users className="size-4" />
                  مشتریان
                </Link>
              ) : null}
              {canViewReports ? (
                <Link
                  href="/reports"
                  className="flex items-center gap-1.5 text-body-small font-medium text-foreground-secondary hover:text-foreground"
                >
                  <BarChart3 className="size-4" />
                  گزارش‌ها
                </Link>
              ) : null}
              <span className="text-body-small text-foreground-secondary">{roleLabel}</span>
              <Link href="/account" aria-label="حساب کاربری">
                <Avatar name={session.user.name ?? session.user.username} size={36} />
              </Link>
              <LogoutButton />
            </>
          }
        />
      </div>
      <OfflineBanner />
      <main className="flex-1 p-6 print:p-0">{children}</main>
    </div>
  );
}
