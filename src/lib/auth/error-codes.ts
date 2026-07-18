/**
 * Split out from `auth-options.ts` deliberately: that file imports
 * `lib/db.ts` (Prisma + `pg`, both Node-only), and the login form is a
 * Client Component that needs these codes to map `signIn()`'s result to
 * Persian copy. Importing them from `auth-options.ts` directly would pull
 * the whole server-only auth config — and `pg`'s Node built-ins (`fs`,
 * `net`, `tls`) — into the browser bundle, which fails to compile.
 */
export const AUTH_ERROR_CODES = {
  INVALID_USERNAME: "INVALID_USERNAME",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  ACCOUNT_INACTIVE: "ACCOUNT_INACTIVE",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  /** The account exists and the password is correct, but the role doesn't belong on the login surface (`/login/admin` vs `/login/warehouse`) it was submitted from. */
  WRONG_LOGIN_SURFACE: "WRONG_LOGIN_SURFACE",
} as const;

export type LoginSurface = "admin" | "warehouse";
