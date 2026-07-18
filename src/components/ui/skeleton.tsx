import { cn } from "@/lib/utils";

/**
 * DESIGN-SYSTEM.md §14: preferred over a spinner specifically for list/
 * table/card loading, since it previews the eventual content's shape.
 * Composed with `size-*`/`w-*`/`h-*` utility classes at each call site
 * rather than fixed presets, since skeleton shapes are inherently specific
 * to whatever content they stand in for.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-medium bg-disabled", className)} />;
}
