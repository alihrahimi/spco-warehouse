"use client";

import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";

import { cn } from "@/lib/utils";

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

export function ContextMenuContent({ className, ...props }: ContextMenuPrimitive.ContextMenuContentProps) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        className={cn(
          "z-50 min-w-[10rem] overflow-hidden rounded-medium border border-border bg-surface p-1 shadow-[var(--shadow-elevation-3)]",
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

export function ContextMenuItem({ className, ...props }: ContextMenuPrimitive.ContextMenuItemProps) {
  return (
    <ContextMenuPrimitive.Item
      className={cn(
        "flex h-11 cursor-pointer select-none items-center rounded-small px-3 text-body-large text-foreground outline-none data-[highlighted]:bg-hover data-[disabled]:pointer-events-none data-[disabled]:text-disabled-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function ContextMenuSeparator({ className, ...props }: ContextMenuPrimitive.ContextMenuSeparatorProps) {
  return <ContextMenuPrimitive.Separator className={cn("my-1 h-px bg-divider", className)} {...props} />;
}
