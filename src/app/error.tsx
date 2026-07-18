"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { EmptyState } from "@/components/shared/empty-state";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-segment error boundary (Next.js `error.tsx` convention). Per
 * DESIGN-SYSTEM.md §12/§19: never a raw stack trace shown to a warehouse
 * user — a clear Persian explanation and a retry action instead. The
 * underlying error is still logged for diagnosis.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={AlertTriangle}
        title="خطایی رخ داد"
        description="مشکلی در نمایش این صفحه پیش آمد. می‌توانید دوباره تلاش کنید."
        action={
          <button
            type="button"
            onClick={reset}
            className="rounded-medium bg-primary px-6 py-3 text-body font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            تلاش دوباره
          </button>
        }
      />
    </div>
  );
}
