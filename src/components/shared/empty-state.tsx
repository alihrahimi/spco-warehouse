import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional call-to-action, e.g. a "مشتری جدید" button — rendered by the caller. */
  action?: ReactNode;
  className?: string;
}

/**
 * The shared shell behind every "No Data" / "No Results" / "No Internet"
 * screen in DESIGN-SYSTEM.md §14. Deliberately takes an `icon` prop instead
 * of a fixed set of named variants — each feature picks the Lucide icon
 * that fits (e.g. `Inbox` for no data, `SearchX` for no results, `WifiOff`
 * for no connection) rather than this component guessing per case.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-8 py-16 text-center", className)}>
      <Icon className="size-12 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
      <p className="text-body-large font-medium text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-body text-foreground-secondary">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
