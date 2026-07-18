import { ChevronLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Fragment } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * FRONTEND-ARCHITECTURE.md §9: reads right-to-left, root at the right,
 * current page at the left — e.g. `محصولات ‹ خرس آبی ‹ ویرایش`. The first
 * array item renders rightmost simply because it's first in DOM order
 * under `dir="rtl"`; the separator points left (`ChevronLeft`), continuing
 * the same reading direction the trail itself reads in.
 *
 * `item.href` is cast to `Route`: this is a feature-agnostic UI-library
 * component (Phase 08 explicitly excludes any page/route knowledge), so it
 * cannot statically know the app's real route set the way `typedRoutes`
 * wants — the officially documented pattern for a reusable `Link`-wrapping
 * component under `typedRoutes` is to accept `string` at the component
 * boundary and cast there, once, rather than losing type-checking on every
 * real call site that passes an actual literal route.
 */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="مسیر ناوبری" className="flex items-center gap-1 text-body-small text-foreground-secondary">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <ChevronLeft className="size-3.5 shrink-0" aria-hidden="true" /> : null}
            {item.href && !isLast ? (
              <Link href={item.href as Route} className="hover:text-foreground hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-foreground" : undefined}>
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
