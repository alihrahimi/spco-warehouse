import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { ROLE_SLUGS } from "@/lib/auth/roles";
import { getDashboardStats, getWarehouseDashboardData } from "@/features/dashboard/services";
import { AdministratorDashboard } from "@/features/dashboard/components/administrator-dashboard";
import { WarehouseDashboard } from "@/features/dashboard/components/warehouse-dashboard";

/**
 * "/" branches into one of two completely different applications sharing
 * this one route (final-revision requirement #1): Warehouse Staff get the
 * order-entry-focused `WarehouseDashboard`; every other role gets the full
 * `AdministratorDashboard`. Branching on the literal role (not a
 * permission) because this is an identity fork, not a feature-visibility
 * fork — a warehouse session should never even fetch the management
 * dashboard's report-shaped aggregates, let alone render them with pieces
 * hidden.
 */
export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  if (session.user.role === ROLE_SLUGS.WAREHOUSE_STAFF) {
    const data = await getWarehouseDashboardData();
    return <WarehouseDashboard data={data} />;
  }

  const stats = await getDashboardStats();
  const canManageSettings = hasPermission(session.user.role, "settings:manage");
  return <AdministratorDashboard stats={stats} canManageSettings={canManageSettings} />;
}
