/**
 * Role identifiers stored in `roles.name` (stable, English, code-facing —
 * never shown to a user directly). Persian display labels are kept here,
 * in code, deliberately separate from the DB row: `roles.description` is
 * free text for admin notes, not a structured display-label column, and
 * adding one is an easy future migration if role labels ever need to be
 * editable — not "absolutely required" for Phase 10, so not done now.
 */
export const ROLE_SLUGS = {
  ADMINISTRATOR: "administrator",
  MANAGER: "manager",
  WAREHOUSE_STAFF: "warehouse_staff",
} as const;

export type RoleSlug = (typeof ROLE_SLUGS)[keyof typeof ROLE_SLUGS];

export const ROLE_LABELS_FA: Record<RoleSlug, string> = {
  [ROLE_SLUGS.ADMINISTRATOR]: "مدیر کل",
  [ROLE_SLUGS.MANAGER]: "مدیر",
  [ROLE_SLUGS.WAREHOUSE_STAFF]: "کارمند انبار",
};

export function isRoleSlug(value: string): value is RoleSlug {
  return Object.values(ROLE_SLUGS).includes(value as RoleSlug);
}
