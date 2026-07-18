import type { ReactNode } from "react";

/** Centered, chrome-free shell for unauthenticated screens (just Login for now) — no TopNav/Sidebar, since there's no session yet to build one around. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">{children}</div>;
}
