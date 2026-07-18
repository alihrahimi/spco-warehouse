import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Trailing (left-edge) action slot — e.g. a primary "+ افزودن" button. */
  actions?: ReactNode;
}

/** The heading block at the top of a page's content area — distinct from `TopNav`, which is the app-level chrome above it. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-h2 font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-body text-foreground-secondary">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
