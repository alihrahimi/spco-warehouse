import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

export interface TopNavProps {
  title: string;
  /** Called when the back control is tapped. Omit to hide it (e.g. on a screen with no back destination, like Login). */
  onBack?: () => void;
  /** Rendered under the title — typically a `Breadcrumb`. */
  breadcrumb?: ReactNode;
  /** Right-side (trailing/left-in-RTL) slot — page actions, user identity, logout. */
  actions?: ReactNode;
  /** When set, the title/logo area becomes a link — the dashboard shell passes "/" so it doubles as the company logo's permanent Dashboard/Home affordance. */
  titleHref?: Route;
  /** Company logo (from CompanySettings), shown beside the title when set. */
  logoSrc?: string | null;
}

/**
 * SCREEN-SPECS.md's wireframe convention, rendered for real: back control
 * at the top-right with a right-pointing chevron (DESIGN-SYSTEM.md — "back"
 * is a backward/previous action, which points right under RTL, the mirror
 * of an LTR back button's left-pointing chevron), title beside it, and an
 * actions slot at the trailing (left) edge. The right-vs-left placement is
 * DOM order under `dir="rtl"`, not a manual position override — this
 * `title`+`onBack` group is first in the markup, `actions` second.
 */
export function TopNav({ title, onBack, breadcrumb, actions, titleHref, logoSrc }: TopNavProps) {
  const titleContent = (
    <div className="min-w-0">
      <h1 className="truncate text-h4 font-semibold text-foreground">{title}</h1>
      {breadcrumb}
    </div>
  );

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-4">
      <div className="flex min-w-0 items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="بازگشت"
            className="flex size-10 shrink-0 items-center justify-center rounded-medium text-foreground-secondary hover:bg-hover"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        ) : null}
        {titleHref ? (
          <Link href={titleHref} className="flex min-w-0 items-center gap-2" aria-label="بازگشت به داشبورد">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- external upload path, not a static asset next/image can optimize at build time
              <img src={logoSrc} alt="" className="size-9 shrink-0 rounded-small object-contain" />
            ) : null}
            {titleContent}
          </Link>
        ) : (
          titleContent
        )}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </header>
  );
}
