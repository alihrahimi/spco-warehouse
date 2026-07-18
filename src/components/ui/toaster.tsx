"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * DESIGN-SYSTEM.md §13: top-center position; Success/Info auto-dismiss
 * (4s), Warning/Error persist until manually dismissed — set as the
 * `duration` default per toast type here so every call site (`toast.*`
 * from `@/components/ui/toast`) gets the right behavior automatically,
 * without repeating a duration argument at each call.
 *
 * Mount once, near the root layout — not per page.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      dir="rtl"
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: "rounded-large border border-border bg-surface text-body text-foreground shadow-[var(--shadow-elevation-4)] font-[var(--font-sans)]",
          title: "text-foreground font-medium",
          description: "text-foreground-secondary",
          success: "border-success/30 [&_[data-icon]]:text-success",
          error: "border-danger/30 [&_[data-icon]]:text-danger",
          warning: "border-warning/30 [&_[data-icon]]:text-warning",
          info: "border-info/30 [&_[data-icon]]:text-info",
          closeButton: "bg-surface border-border text-foreground-secondary",
        },
      }}
    />
  );
}
