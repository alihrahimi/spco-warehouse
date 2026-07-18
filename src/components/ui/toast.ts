import { toast as sonnerToast } from "sonner";

/**
 * Thin wrapper over `sonner`'s `toast`, enforcing DESIGN-SYSTEM.md §13's
 * dismiss rule at the call site instead of trusting every caller to
 * remember it: Success/Info use the 4s default set on `<Toaster />`,
 * Warning/Error persist (`Infinity`) until the user dismisses them, since
 * they often carry information a busy warehouse user shouldn't miss to a
 * timer.
 */
export const toast = {
  success: (message: string, description?: string) => sonnerToast.success(message, { description }),
  info: (message: string, description?: string) => sonnerToast.info(message, { description }),
  warning: (message: string, description?: string) =>
    sonnerToast.warning(message, { description, duration: Infinity }),
  error: (message: string, description?: string) =>
    sonnerToast.error(message, { description, duration: Infinity }),
};
