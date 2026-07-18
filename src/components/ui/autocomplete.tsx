"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command as CommandPrimitive } from "cmdk";
import { Check, ChevronDown, Search } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export interface AutocompleteOption {
  value: string;
  label: string;
  /** Secondary line under the label — e.g. a customer's mobile number. */
  description?: string;
}

export interface AutocompleteProps {
  options: AutocompleteOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Single-select searchable combobox — the pattern behind the Customer/
 * Product pickers in SCREEN-SPECS.md §3/§11 (search-as-you-type, no
 * separate submit button). Built on Radix Popover + `cmdk`'s Command for
 * the filtering/keyboard-navigation behavior, styled to our tokens.
 */
export function Autocomplete({
  options,
  value,
  onValueChange,
  placeholder = "انتخاب کنید",
  searchPlaceholder = "جستجو...",
  emptyMessage = "نتیجه‌ای یافت نشد",
  disabled,
  className,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-[52px] w-full items-center justify-between rounded-medium border border-border bg-surface px-4 text-body-large text-foreground disabled:bg-disabled disabled:text-disabled-foreground",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
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
              {options.map((option) => (
                <CommandPrimitive.Item
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-small px-3 py-2 text-body-large text-foreground data-[selected=true]:bg-hover"
                >
                  <span className="flex flex-col">
                    <span>{option.label}</span>
                    {option.description ? (
                      <span className="text-body-small text-muted-foreground">{option.description}</span>
                    ) : null}
                  </span>
                  {option.value === value ? <Check className="size-4 shrink-0 text-primary" /> : null}
                </CommandPrimitive.Item>
              ))}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
