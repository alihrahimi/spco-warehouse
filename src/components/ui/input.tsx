import { Search } from "lucide-react";
import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * DESIGN-SYSTEM.md §8. Default height matches Button (52px) for shared
 * visual rhythm; `compact` (44px) for dense contexts.
 */
const baseInputClasses =
  "h-[52px] w-full rounded-medium border border-border bg-surface px-4 text-body-large text-foreground placeholder:text-muted-foreground focus-visible:border-primary disabled:bg-disabled disabled:text-disabled-foreground disabled:border-disabled-border aria-invalid:border-danger";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Marks the field invalid and switches its border to the Danger token. */
  invalid?: boolean;
}

/** The base text input. Every other text-like input (Search, Password, Number) builds on this. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input ref={ref} aria-invalid={invalid} className={cn(baseInputClasses, className)} {...props} />
  );
});

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  /** Persian validation message shown below the field, e.g. "این فیلد الزامی است." */
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Label + field + inline error wrapper, per DESIGN-SYSTEM.md §8: the label
 * sits above the field and aligns right by natural RTL text flow — no
 * alignment override is applied here, since that alignment falls out of
 * `dir="rtl"` on the root automatically.
 */
export function FormField({ label, htmlFor, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-body font-medium text-foreground">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-body-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  invalid?: boolean;
}

/**
 * Search field per DESIGN-SYSTEM.md §8: icon at the right (leading) edge —
 * the mirror of an LTR search field's left-side icon, achieved here simply
 * by placing the icon first in DOM order under `dir="rtl"`, not by a
 * manual position override.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className, placeholder = "جستجو...", invalid, ...props },
  ref,
) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute inset-y-0 end-4 my-auto size-5 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        ref={ref}
        type="search"
        placeholder={placeholder}
        aria-invalid={invalid}
        className={cn(baseInputClasses, "pe-11", className)}
        {...props}
      />
    </div>
  );
});

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  invalid?: boolean;
}

/** Password field with a show/hide toggle, per the Login screen spec. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, invalid, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const fieldId = useId();

  return (
    <div className="relative">
      <input
        ref={ref}
        id={props.id ?? fieldId}
        type={visible ? "text" : "password"}
        aria-invalid={invalid}
        className={cn(baseInputClasses, "pe-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
        aria-pressed={visible}
        className="absolute inset-y-0 end-3 my-auto text-body-small font-medium text-foreground-secondary"
      >
        {visible ? "پنهان" : "نمایش"}
      </button>
    </div>
  );
});

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value: number | "";
  onChange: (value: number | "") => void;
  min?: number;
  max?: number;
  step?: number;
  invalid?: boolean;
}

/**
 * Plain integer input with large +/− steppers, per DESIGN-SYSTEM.md §8 —
 * used for small-integer fields like pack size, not for money (see
 * `CurrencyInput` in `components/form/` for Toman amounts).
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { className, value, onChange, min, max, step = 1, invalid, ...props },
  ref,
) {
  function clamp(next: number): number {
    if (min !== undefined && next < min) return min;
    if (max !== undefined && next > max) return max;
    return next;
  }

  function handleStep(direction: 1 | -1) {
    const current = value === "" ? 0 : value;
    onChange(clamp(current + direction * step));
  }

  return (
    <div
      className={cn(
        "flex h-[52px] items-stretch overflow-hidden rounded-medium border border-border bg-surface",
        invalid && "border-danger",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => handleStep(-1)}
        aria-label="کاهش"
        // w-9 below sm: at 48px each, the two steppers alone consumed the
        // narrow quantity columns of the order grid, leaving the input
        // itself 0px wide — typing a number was impossible on phones.
        className="w-9 shrink-0 border-e border-border text-h3 text-foreground-secondary hover:bg-hover disabled:text-disabled-foreground sm:w-12"
        disabled={props.disabled || (min !== undefined && value !== "" && value <= min)}
      >
        −
      </button>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        aria-invalid={invalid}
        value={value === "" ? "" : String(value)}
        onChange={(event) => {
          const raw = event.target.value.replace(/[^0-9-]/g, "");
          onChange(raw === "" ? "" : clamp(Number.parseInt(raw, 10)));
        }}
        // min-w-9: guarantees a typeable field even inside a grid's 1fr
        // column (1fr can shrink to the content minimum, and without a
        // minimum the flexible input is the first thing squeezed to zero).
        className="w-full min-w-9 flex-1 bg-transparent text-center text-body-large text-foreground focus-visible:outline-none"
        {...props}
      />
      <button
        type="button"
        onClick={() => handleStep(1)}
        aria-label="افزایش"
        className="w-9 shrink-0 border-s border-border text-h3 text-foreground-secondary hover:bg-hover disabled:text-disabled-foreground sm:w-12"
        disabled={props.disabled || (max !== undefined && value !== "" && value >= max)}
      >
        +
      </button>
    </div>
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid}
      className={cn(
        "min-h-24 w-full resize-y rounded-medium border border-border bg-surface px-4 py-3 text-body-large text-foreground placeholder:text-muted-foreground focus-visible:border-primary disabled:bg-disabled disabled:text-disabled-foreground aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  );
});
