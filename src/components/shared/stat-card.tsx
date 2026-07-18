import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  /** Pre-formatted display value — e.g. `formatToman(...)` or a Persian-digit count. Never formatted inside this component, to keep it domain-agnostic. */
  value: string;
  icon?: LucideIcon;
  className?: string;
}

/**
 * DESIGN-SYSTEM.md §11: a large number + label, deliberately no
 * sparklines/trend charts — keeps the Dashboard glanceable, not a
 * reporting surface.
 */
export function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn("flex items-center gap-4", className)}>
      {Icon ? (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-medium bg-primary-light text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      ) : null}
      <div>
        <p className="text-currency-emphasis font-bold text-foreground">{value}</p>
        <p className="text-body-small text-foreground-secondary">{label}</p>
      </div>
    </Card>
  );
}
