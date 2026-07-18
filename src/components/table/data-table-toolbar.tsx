"use client";

import { SearchInput } from "@/components/ui/input";

export interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

/** DataTable's search row — kept as its own component so a screen can render extra filter chips beside it without editing DataTable itself. */
export function DataTableToolbar({ searchValue, onSearchChange, placeholder }: DataTableToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      <SearchInput
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={placeholder}
        className="max-w-sm"
      />
    </div>
  );
}
