import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/format/persian-digits";

/**
 * DESIGN-SYSTEM.md §9: no numbered page-jump list, by design — just large
 * Prev/Next controls and a "صفحه X از Y" label. Because RTL reading
 * progresses right-to-left, "next" (forward) points *left* and "previous"
 * points *right* — the reverse of an LTR pager, called out explicitly
 * since it's easy to get backwards.
 */
export function DataTablePagination<TData>({ table }: { table: Table<TData> }) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="ghost"
        size="compact"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
        قبلی
      </Button>
      <span className="text-body-small text-foreground-secondary">
        صفحه {toPersianDigits(pageIndex + 1)} از {toPersianDigits(pageCount)}
      </span>
      <Button variant="ghost" size="compact" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
        بعدی
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
