import type { UserStatus } from "@/lib/enums";
import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

/**
 * Extends NextAuth's built-in types with the fields this app's
 * `authorize()`/`jwt()`/`session()` callbacks actually carry (see
 * `lib/auth/auth-options.ts`). Without this, every read of
 * `session.user.role` etc. would be a TypeScript error.
 */
declare module "next-auth" {
  interface User extends DefaultUser {
    username: string;
    /** Role slug (e.g. `"administrator"`) — see `lib/auth/roles.ts`. */
    role: string;
    status: UserStatus;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
      status: UserStatus;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    username: string;
    role: string;
    status: UserStatus;
  }
}
