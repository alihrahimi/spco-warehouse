"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cn } from "@/lib/utils";

/**
 * DESIGN-SYSTEM.md §12: dark 50% scrim, `radius-dialog` panel, elevation-4,
 * max-width ~560px on tablet. Footer button order is fixed by whoever
 * composes `Action`/`Cancel` inside `AlertDialogFooter` — see
 * `hooks/use-confirm-dialog.tsx` for the one place that matters, since it's
 * the single call site every dialog in the app renders through.
 */
export const AlertDialogRoot = AlertDialogPrimitive.Root;

export function AlertDialogContent({ children, ...props }: AlertDialogPrimitive.AlertDialogContentProps) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
      <AlertDialogPrimitive.Content
        className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-dialog border border-border bg-surface p-6 shadow-[var(--shadow-elevation-3)]"
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.AlertDialogTitleProps) {
  return <AlertDialogPrimitive.Title className={cn("text-h3 font-semibold text-foreground", className)} {...props} />;
}

export function AlertDialogDescription({ className, ...props }: AlertDialogPrimitive.AlertDialogDescriptionProps) {
  return (
    <AlertDialogPrimitive.Description
      className={cn("mt-2 text-body text-foreground-secondary", className)}
      {...props}
    />
  );
}

/**
 * Primary action at the far right (RTL leading edge), Cancel to its left —
 * per DESIGN-SYSTEM.md §12, the mirror of an LTR dialog's convention of
 * placing the primary action nearest the reading start. `flex-row-reverse`
 * on a row of `[Cancel, Action]` DOM children puts `Action` visually first
 * (rightmost) — deliberate, not the default row order, since here both
 * children need to be reachable this specific way regardless of the
 * consuming component's own DOM order.
 */
export function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex flex-row-reverse justify-start gap-3", className)} {...props} />;
}

export const AlertDialogAction = AlertDialogPrimitive.Action;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
