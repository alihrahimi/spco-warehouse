"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * TanStack Query client provider (FRONTEND-ARCHITECTURE.md §6). The client
 * is created inside `useState` rather than as a module-level singleton —
 * in a server-rendered app a module-level client would be shared across
 * unrelated requests, leaking cached data between users. `useState`'s
 * lazy initializer gives each render tree its own instance instead.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data fetched from the server is rarely stale-on-arrival for
            // this app's usage pattern; per-feature query hooks override
            // this where a screen needs fresher data (e.g. Order List).
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
