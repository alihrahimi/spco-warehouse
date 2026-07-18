import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

import { logAuthEvent } from "@/lib/auth/audit-log";
import { db } from "@/lib/db";
import { AUTH_ERROR_CODES, type LoginSurface } from "@/lib/auth/error-codes";
import { verifyPassword } from "@/lib/auth/password";
import { ROLE_SLUGS } from "@/lib/auth/roles";
import type { UserStatus } from "@/lib/enums";

/** `/login/admin` accepts Administrator and Manager (both office/management roles); `/login/warehouse` accepts only Warehouse Staff. */
function roleBelongsOnSurface(role: string, surface: LoginSurface): boolean {
  if (surface === "warehouse") return role === ROLE_SLUGS.WAREHOUSE_STAFF;
  return role === ROLE_SLUGS.ADMINISTRATOR || role === ROLE_SLUGS.MANAGER;
}

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12h — a full shift, per UX-FLOW.md's "no aggressive logout mid-shift", while still satisfying Phase 10's "automatic session expiration".

export const authOptions: NextAuthOptions = {
  session: {
    // JWT is required here, not a choice: NextAuth v4's Credentials
    // provider does not support the "database" session strategy (there is
    // no OAuth-style persisted session row to key off of).
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: 60 * 60, // refresh the token's expiry on activity at most once an hour
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "نام کاربری", type: "text" },
        password: { label: "رمز عبور", type: "password" },
        // Not user-facing input — each login page (`/login/admin`,
        // `/login/warehouse`) sets this itself so the two forms genuinely
        // gate different account types, per the final-revision brief's
        // "two completely separate applications" requirement.
        surface: { label: "surface", type: "text" },
      },
      async authorize(credentials, req) {
        const username = credentials?.username?.trim();
        const password = credentials?.password;
        const surface = credentials?.surface;

        const ipAddress = (req?.headers as Record<string, string> | undefined)?.["x-forwarded-for"]?.split(",")[0]?.trim() ?? null;
        const userAgent = (req?.headers as Record<string, string> | undefined)?.["user-agent"] ?? null;

        if (!username || !password) {
          throw new Error(AUTH_ERROR_CODES.INVALID_USERNAME);
        }

        const user = await db.user.findUnique({
          where: { username },
          include: { role: true },
        });

        if (!user || user.deletedAt) {
          await logAuthEvent({
            eventType: "login_failed",
            attemptedUsername: username,
            ipAddress,
            userAgent,
          });
          throw new Error(AUTH_ERROR_CODES.INVALID_USERNAME);
        }

        if (user.status === "suspended") {
          await logAuthEvent({
            eventType: "login_failed",
            userId: user.id,
            attemptedUsername: username,
            ipAddress,
            userAgent,
          });
          throw new Error(AUTH_ERROR_CODES.ACCOUNT_SUSPENDED);
        }

        if (user.status === "inactive") {
          await logAuthEvent({
            eventType: "login_failed",
            userId: user.id,
            attemptedUsername: username,
            ipAddress,
            userAgent,
          });
          throw new Error(AUTH_ERROR_CODES.ACCOUNT_INACTIVE);
        }

        const passwordMatches = await verifyPassword(password, user.passwordHash);
        if (!passwordMatches) {
          await logAuthEvent({
            eventType: "login_failed",
            userId: user.id,
            attemptedUsername: username,
            ipAddress,
            userAgent,
          });
          throw new Error(AUTH_ERROR_CODES.INVALID_PASSWORD);
        }

        if ((surface === "admin" || surface === "warehouse") && !roleBelongsOnSurface(user.role.name, surface)) {
          await logAuthEvent({
            eventType: "login_failed",
            userId: user.id,
            attemptedUsername: username,
            ipAddress,
            userAgent,
          });
          throw new Error(AUTH_ERROR_CODES.WRONG_LOGIN_SURFACE);
        }

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await logAuthEvent({
          eventType: "login_success",
          userId: user.id,
          attemptedUsername: username,
          ipAddress,
          userAgent,
        });

        return {
          id: user.id,
          name: user.fullName,
          username: user.username,
          role: user.role.name,
          status: user.status as UserStatus,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      session.user.status = token.status;
      return session;
    },
  },
  events: {
    // NextAuth v4's `signOut` event (JWT strategy) receives only `{ token }`
    // — no request object, so unlike `authorize()`'s login-time logging,
    // this can't capture IP/user-agent. Still a real, complete audit
    // record of *who* logged out and *when*, just without those two
    // best-effort fields for this one event type.
    async signOut({ token }) {
      if (!token?.id) return;
      await logAuthEvent({
        eventType: "logout",
        userId: token.id,
      });
    },
  },
};
