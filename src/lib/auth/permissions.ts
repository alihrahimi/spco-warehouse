import { ROLE_SLUGS, type RoleSlug } from "@/lib/auth/roles";

/**
 * The permission catalog. Every permission check in the app goes through
 * this file's `hasPermission()` — never a raw role-name comparison scattered
 * at call sites — so that when permissions become database-driven (Phase
 * 10's brief explicitly asks for this to be "architecture-ready", not
 * built now), only this file's internals change: `ROLE_PERMISSIONS` below
 * gets replaced by a query against a future `role_permissions` table, and
 * every caller of `hasPermission()` keeps working unmodified.
 */
export const PERMISSIONS = {
  PRODUCTS_VIEW: "products:view",
  PRODUCTS_EDIT: "products:edit",
  PRODUCTS_DELETE: "products:delete",
  CUSTOMERS_VIEW: "customers:view",
  CUSTOMERS_EDIT: "customers:edit",
  ORDERS_VIEW: "orders:view",
  ORDERS_CREATE: "orders:create",
  ORDERS_EDIT: "orders:edit",
  ORDERS_DELETE: "orders:delete",
  /** Changing an order's lifecycle status (draft→...→completed) — deliberately separate from ORDERS_EDIT (line-item/version edits): the final-revision brief grants warehouse staff status changes but never line-item editing. */
  ORDERS_STATUS: "orders:status",
  PAYMENTS_VIEW: "payments:view",
  PAYMENTS_CREATE: "payments:create",
  USERS_MANAGE: "users:manage",
  SETTINGS_MANAGE: "settings:manage",
  /** Decoupled from ORDERS_VIEW/PAYMENTS_VIEW on purpose: granting warehouse staff order/payment visibility for their own order-entry work must never imply report access. */
  REPORTS_VIEW: "reports:view",
  UTILITIES_USE: "utilities:use",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * The in-code role → permission mapping. This is the seam described above:
 * a real deployment's actual permission grants will eventually live in the
 * database so an admin can adjust them without a code change, but v1 ships
 * with these fixed defaults, matching Phase 01's three approved roles.
 */
const ROLE_PERMISSIONS: Record<RoleSlug, Permission[]> = {
  [ROLE_SLUGS.ADMINISTRATOR]: ALL_PERMISSIONS,
  [ROLE_SLUGS.MANAGER]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_EDIT,
    PERMISSIONS.ORDERS_DELETE,
    PERMISSIONS.ORDERS_STATUS,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.UTILITIES_USE,
  ],
  /**
   * Originally a closed list (create orders, continue drafts, view/search
   * customers and products, generate/print pre-invoices, update order
   * status) that explicitly excluded customer management. A later, direct
   * instruction amended exactly that one exclusion: Warehouse Staff now
   * gets full customer management (create/edit/delete-via-status/search)
   * alongside it — CUSTOMERS_EDIT is the only addition. Still never user
   * management, product management/prices, reports, company settings,
   * utilities, or audit logs.
   */
  [ROLE_SLUGS.WAREHOUSE_STAFF]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_STATUS,
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const grants = ROLE_PERMISSIONS[role as RoleSlug];
  return grants?.includes(permission) ?? false;
}

export function getPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as RoleSlug] ?? [];
}
