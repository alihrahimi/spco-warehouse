"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronsUpDown, ChevronUp, ChevronDown, Inbox } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/table/data-table-pagination";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { useDebounce } from "@/hooks/use-debounce";
import { useMediaQuery } from "@/hooks/use-media-query";
import { breakpoints } from "@/constants/breakpoints";
import { cn } from "@/lib/utils";

export interface DataTableProps<TData> {
  /**
   * Declare columns in logical (primary-first) order. Combined with
   * `dir="rtl"` on the table root, visual RTL order (primary column right,
   * any actions column last-declared → left) falls out automatically —
   * FRONTEND-ARCHITECTURE.md §8.
   */
  columns: ColumnDef<TData>[];
  data: TData[];
  searchPlaceholder?: string;
  /** Enables the row-selection checkbox column. */
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  /**
   * Below the tablet breakpoint, this renders each row as a card instead
   * of a table row (DESIGN-SYSTEM.md §9 — "Responsive Layout"). If
   * omitted, the table stays a table and scrolls horizontally on narrow
   * screens instead of guessing a generic card layout from arbitrary
   * column definitions.
   */
  renderMobileCard?: (row: TData) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;

  /**
   * Server-driven mode (FRONTEND-ARCHITECTURE.md §8's documented seam,
   * exercised for the first time by Customer Management's "tens of
   * thousands of customers" requirement — too many rows to ever hold
   * client-side). When true, `data` is trusted as exactly the current
   * page's rows already filtered/sorted server-side; the caller owns
   * `pageIndex`/`searchValue`/`sorting` state and reacts to the `onChange`
   * callbacks by re-fetching. Client-side filtering/pagination/sorting
   * (the Phase 08 default) is unaffected when this stays `false`.
   */
  manual?: boolean;
  pageCount?: number;
  pageIndex?: number;
  onPageIndexChange?: (pageIndex: number) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sorting?: SortingState;
  onManualSortingChange?: (sorting: SortingState) => void;
  /** Shows skeleton rows instead of the table body while a server round-trip is in flight. */
  loading?: boolean;
}

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = "جستجو...",
  enableRowSelection = false,
  onRowSelectionChange,
  renderMobileCard,
  emptyTitle = "داده‌ای یافت نشد",
  emptyDescription,
  pageSize = 10,
  manual = false,
  pageCount,
  pageIndex,
  onPageIndexChange,
  searchValue,
  onSearchChange,
  sorting: controlledSorting,
  onManualSortingChange,
  loading = false,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [internalSearchInput, setInternalSearchInput] = useState("");
  const debouncedInternalSearch = useDebounce(internalSearchInput, 250);
  const isMobile = !useMediaQuery(`(min-width: ${breakpoints.tablet}px)`);

  const sorting = manual ? (controlledSorting ?? []) : internalSorting;
  const searchInput = manual ? (searchValue ?? "") : internalSearchInput;
  const globalFilter = manual ? undefined : debouncedInternalSearch;

  function handleSortingChange(updater: SortingState | ((old: SortingState) => SortingState)) {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    if (manual) onManualSortingChange?.(next);
    else setInternalSorting(next);
  }

  function handleSearchChange(value: string) {
    if (manual) onSearchChange?.(value);
    else setInternalSearchInput(value);
  }

  const selectionColumn: ColumnDef<TData> = {
    id: "__select",
    header: ({ table }) => (
      <Checkbox
        aria-label="انتخاب همه"
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="انتخاب ردیف"
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
      />
    ),
    enableSorting: false,
  };

  // react-compiler(incompatible-library): TanStack Table's returned `table`
  // object carries methods that can't be safely auto-memoized; this is a
  // known, accepted limitation of the library, not a bug here — React
  // Compiler simply skips optimizing this component.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: enableRowSelection ? [selectionColumn, ...columns] : columns,
    state: {
      sorting,
      rowSelection,
      globalFilter,
      ...(manual ? { pagination: { pageIndex: pageIndex ?? 0, pageSize } } : {}),
    },
    onSortingChange: handleSortingChange,
    onRowSelectionChange: setRowSelection,
    manualPagination: manual,
    manualSorting: manual,
    manualFiltering: manual,
    pageCount: manual ? (pageCount ?? -1) : undefined,
    onPaginationChange: manual
      ? (updater) => {
          const current = { pageIndex: pageIndex ?? 0, pageSize };
          const next = typeof updater === "function" ? updater(current) : updater;
          onPageIndexChange?.(next.pageIndex);
        }
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manual ? undefined : getSortedRowModel(),
    getFilteredRowModel: manual ? undefined : getFilteredRowModel(),
    getPaginationRowModel: manual ? undefined : getPaginationRowModel(),
    initialState: manual ? undefined : { pagination: { pageSize } },
  });

  useEffect(() => {
    if (!onRowSelectionChange) return;
    onRowSelectionChange(table.getSelectedRowModel().rows.map((row) => row.original));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar searchValue={searchInput} onSearchChange={handleSearchChange} placeholder={searchPlaceholder} />

      {loading ? (
        <div className="flex flex-col gap-2 rounded-large border border-border p-4">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
      ) : isMobile && renderMobileCard ? (
        <div className="flex flex-col gap-3">{rows.map((row) => <div key={row.id}>{renderMobileCard(row.original)}</div>)}</div>
      ) : (
        <div className="overflow-x-auto rounded-large border border-border">
          <table className="w-full border-collapse text-body">
            <thead className="sticky top-0 z-10 border-b border-border bg-surface">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortDirection = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className="h-14 px-4 text-start text-table-header font-medium text-foreground-secondary"
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-1.5 hover:text-foreground"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sortDirection === "asc" ? (
                              <ChevronUp className="size-3.5" aria-hidden="true" />
                            ) : sortDirection === "desc" ? (
                              <ChevronDown className="size-3.5" aria-hidden="true" />
                            ) : (
                              <ChevronsUpDown className="size-3.5 opacity-40" aria-hidden="true" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={cn(
                    "h-14 border-b border-divider last:border-0 hover:bg-hover",
                    row.getIsSelected() && "border-s-[3px] border-s-primary bg-primary-light",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rows.length > 0 ? <DataTablePagination table={table} /> : null}
    </div>
  );
}
