import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmDialogProvider } from "@/providers/confirm-dialog-provider";
import { QueryProvider } from "@/providers/query-provider";
import { SessionProvider } from "@/providers/session-provider";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Single composition point for every global provider. The root layout
 * imports only this component, so adding a provider later (a theme
 * provider if dark mode is ever added) is a one-line change here — not an
 * edit to `app/layout.tsx` every time.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <QueryProvider>
        <TooltipProvider>
          <ConfirmDialogProvider>
            {children}
            <Toaster />
          </ConfirmDialogProvider>
        </TooltipProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
