import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Content-area width rule from FRONTEND-ARCHITECTURE.md §9: full-width on
 * tablet (the primary target), constrained and centered on desktop so
 * tables and forms don't sprawl across a large monitor.
 *
 * Tailwind's default `xl` breakpoint (1280px) is used directly rather than
 * a custom one — it already matches the desktop threshold fixed in
 * DESIGN-SYSTEM.md §16, so no separate breakpoint config is needed.
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn("w-full xl:mx-auto xl:max-w-6xl", className)}>{children}</div>;
}
