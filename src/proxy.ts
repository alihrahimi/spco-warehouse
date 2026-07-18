import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

import { hasPermission, type Permission } from "@/lib/auth/permissions";

/**
 * Path-prefix → required permission. Checked in addition to plain
 * authentication (below). Neither `/settings` nor `/users` exists as a
 * page yet (Phase 10 builds Authentication only), but the *protection
 * mechanism* is real and general: any future route added under one of
 * these prefixes is automatically permission-gated the moment it exists,
 * with no further middleware change needed.
 */
const ROUTE_PERMISSIONS: Array<[prefix: string, permission: Permission]> = [
  ["/settings", "settings:manage"],
  ["/users", "users:manage"],
  ["/reports", "reports:view"],
  ["/utilities", "utilities:use"],
  ["/products/new", "products:edit"],
  ["/products/sizes", "products:edit"],
  ["/customers/new", "customers:edit"],
];

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    const requiredPermission = ROUTE_PERMISSIONS.find(([prefix]) => pathname.startsWith(prefix))?.[1];

    if (requiredPermission && token && !hasPermission(token.role, requiredPermission)) {
      return NextResponse.redirect(new URL("/access-denied", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Returning false here is what makes an unauthenticated request to
      // any matched path redirect to `pages.signIn` automatically.
      authorized: ({ token }) => Boolean(token),
    },
    pages: {
      signIn: "/login",
    },
  },
);

/**
 * Everything requires authentication by default (secure-by-default) except
 * this explicit allowlist: NextAuth's own API routes (must stay reachable
 * to log in at all), the login/access-denied/offline pages themselves,
 * Next's static/internal assets, and the PWA install surface
 * (`manifest.webmanifest` + `/icons/*`) — browsers fetch those on the
 * login page too, and an auth redirect there breaks installability
 * (Phase 14). `/offline` must stay public: it exists precisely for the
 * moment connectivity can't complete an auth check. `/uploads/*`
 * (product/company images) deliberately stays protected. Future protected
 * Route Handlers (e.g. an invoice PDF download) are deliberately *not*
 * excluded — they inherit protection automatically.
 */
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|login|access-denied|offline).*)"],
};
