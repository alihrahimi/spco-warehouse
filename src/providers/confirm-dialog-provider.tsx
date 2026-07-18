"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogRoot,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, type ButtonProps } from "@/components/ui/button";

export type ConfirmDialogVariant = "confirmation" | "delete" | "warning" | "success";

export interface ConfirmDialogOptions {
  title: string;
  /** Should name exactly what will happen, per DESIGN-SYSTEM.md §12 — never a bare "مطمئن هستید؟". */
  description?: string;
  variant?: ConfirmDialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
}

type ConfirmFn = (options: ConfirmDialogOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmFn | null>(null);

const confirmButtonVariant: Record<ConfirmDialogVariant, ButtonProps["variant"]> = {
  confirmation: "primary",
  delete: "danger",
  warning: "danger",
  success: "success",
};

const defaultConfirmLabel: Record<ConfirmDialogVariant, string> = {
  confirmation: "تأیید",
  delete: "حذف",
  warning: "ادامه",
  success: "باشه",
};

/**
 * The single implementation behind every Confirmation/Delete/Warning/
 * Success dialog in the app (DESIGN-SYSTEM.md §12), exposed as one
 * imperative `confirm()` call instead of each feature managing its own
 * dialog open-state and JSX — per FRONTEND-ARCHITECTURE.md §5/§9, this is
 * what removes the duplication across the spec's many confirm-before-
 * destructive-action moments (cancel order, deactivate user, delete
 * category-in-use, and more to come).
 *
 * Mount once, near the root layout.
 */
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const resolveRef = useRef<((result: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((nextOptions) => {
    setOptions(nextOptions);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function close(result: boolean) {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOptions(null);
  }

  const variant = options?.variant ?? "confirmation";

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      <AlertDialogRoot
        open={options !== null}
        onOpenChange={(open) => {
          if (!open) close(false);
        }}
      >
        {options ? (
          <AlertDialogContent>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            {options.description ? <AlertDialogDescription>{options.description}</AlertDialogDescription> : null}
            <AlertDialogFooter>
              <AlertDialogAction asChild>
                <Button variant={confirmButtonVariant[variant]} onClick={() => close(true)}>
                  {options.confirmLabel ?? defaultConfirmLabel[variant]}
                </Button>
              </AlertDialogAction>
              <AlertDialogCancel asChild>
                <Button variant="ghost" onClick={() => close(false)}>
                  {options.cancelLabel ?? "انصراف"}
                </Button>
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        ) : null}
      </AlertDialogRoot>
    </ConfirmDialogContext.Provider>
  );
}

/** Returns `confirm(options)`, resolving `true` on confirm, `false` on cancel/dismiss. */
export function useConfirmDialog(): ConfirmFn {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within a ConfirmDialogProvider");
  }
  return context;
}
