"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * General-purpose modal for arbitrary content (e.g. the Create Customer
 * overlay launched mid-order — UX-FLOW.md's Order Creation Flow). For the
 * confirm/delete/warning/success pattern, use `useConfirmDialog()` instead
 * of composing this directly — it already implements DESIGN-SYSTEM.md
 * §12's footer button order and variant styling in one place.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({ children, className, ...props }: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-dialog border border-border bg-surface p-6 shadow-[var(--shadow-elevation-3)]",
          className,
        )}
        {...props}
      >
        {children}
        {/* Close control at the top-left (trailing edge), per DESIGN-SYSTEM.md §12. */}
        <DialogPrimitive.Close
          aria-label="بستن"
          className="absolute start-4 top-4 rounded-small p-1 text-foreground-secondary hover:bg-hover"
        >
          <X className="size-5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ className, ...props }: DialogPrimitive.DialogTitleProps) {
  return <DialogPrimitive.Title className={cn("text-h3 font-semibold text-foreground", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: DialogPrimitive.DialogDescriptionProps) {
  return <DialogPrimitive.Description className={cn("mt-2 text-body text-foreground-secondary", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex flex-row-reverse justify-start gap-3", className)} {...props} />;
}
