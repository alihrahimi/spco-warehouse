"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

/** The audit-log entry for this is written server-side by `events.signOut` in `auth-options.ts`, not here. */
export function LogoutButton() {
  return (
    <Button variant="ghost" size="compact" onClick={() => signOut({ callbackUrl: "/login" })}>
      <LogOut className="size-4" aria-hidden="true" />
      خروج
    </Button>
  );
}
