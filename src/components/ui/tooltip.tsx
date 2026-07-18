"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

export const TooltipProvider = TooltipPrimitive.Provider;

export interface TooltipProps {
  content: string;
  children: ReactNode;
}

/** Wraps `children` with a Persian-text tooltip. Requires `<TooltipProvider>` mounted once near the root (see `AppProviders`). */
export function Tooltip({ content, children }: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={300}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={6}
          className="z-50 max-w-xs rounded-small border border-border bg-foreground px-3 py-1.5 text-body-small text-surface shadow-[var(--shadow-elevation-2)]"
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-foreground" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
