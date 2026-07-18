"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command as CommandPrimitive } from "cmdk";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

/** Same combobox pattern as `Autocomplete`, extended to multiple selections shown as removable chips. */
export function MultiSelect({
  options,
  values,
  onValuesChange,
  placeholder = "انتخاب کنید",
  searchPlaceholder = "جستجو...",
  emptyMessage = "نتیجه‌ای یافت نشد",
  disabled,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedOptions = options.filter((option) => values.includes(option.value));

  function toggle(value: string) {
    onValuesChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  }

  function remove(value: string) {
    onValuesChange(values.filter((v) => v !== value));
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex min-h-[52px] w-full flex-wrap items-center gap-1.5 rounded-medium border border-border bg-surface px-3 py-2 text-body-large disabled:bg-disabled",
            className,
          )}
        >
          {selectedOptions.length === 0 ? (
            <span className="px-1 text-muted-foreground">{placeholder}</span>
          ) : (
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className="flex items-center gap-1 rounded-full bg-primary-light px-3 py-1 text-body-small text-primary"
              >
                {option.label}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`حذف ${option.label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    remove(option.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.stopPropagation();
                      remove(option.value);
                    }
                  }}
                >
                  <X className="size-3.5" />
                </span>
              </span>
            ))
          )}
          <ChevronDown className="ms-auto size-5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-medium border border-border bg-surface shadow-[var(--shadow-elevation-3)]"
        >
          <CommandPrimitive className="flex flex-col" shouldFilter>
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <CommandPrimitive.Input
                autoFocus
                placeholder={searchPlaceholder}
                className="h-11 w-full bg-transparent text-body-large text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
              />
            </div>
            <CommandPrimitive.List className="max-h-72 overflow-y-auto p-1">
              <CommandPrimitive.Empty className="px-3 py-6 text-center text-body text-muted-foreground">
                {emptyMessage}
              </CommandPrimitive.Empty>
              {options.map((option) => {
                const isSelected = values.includes(option.value);
                return (
                  <CommandPrimitive.Item
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                    className="flex cursor-pointer items-center justify-between rounded-small px-3 py-2 text-body-large text-foreground data-[selected=true]:bg-hover"
                  >
                    <span>{option.label}</span>
                    {isSelected ? <Check className="size-4 shrink-0 text-primary" /> : null}
                  </CommandPrimitive.Item>
                );
              })}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
