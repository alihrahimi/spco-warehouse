import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva("flex items-start gap-3 rounded-large border p-4", {
  variants: {
    variant: {
      success: "border-success/30 bg-success-light text-success",
      warning: "border-warning/30 bg-warning-light text-warning",
      danger: "border-danger/30 bg-danger-light text-danger",
      info: "border-info/30 bg-info-light text-info",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

const alertIcons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
} as const;

export interface AlertProps extends VariantProps<typeof alertVariants> {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * A persistent inline banner — for a page-level condition (e.g. "اطلاعات
 * شرکت کامل نیست") that should stay visible until resolved, unlike a
 * `Toast`, which is a transient notification about something that just
 * happened.
 */
export function Alert({ variant = "info", title, description, action, className }: AlertProps) {
  const Icon = alertIcons[variant ?? "info"];

  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-body font-medium text-foreground">{title}</p>
        {description ? <p className="mt-1 text-body-small text-foreground-secondary">{description}</p> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}
