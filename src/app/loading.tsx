import { Spinner } from "@/components/shared/spinner";

/**
 * Next.js `loading.tsx` convention — the automatic Suspense fallback shown
 * while a route segment's Server Components are fetching. Per
 * DESIGN-SYSTEM.md §14, a bare spinner with no context reads as "frozen"
 * for this audience once a wait exceeds ~1s, so it carries a label.
 */
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <Spinner size={40} />
      <p className="text-body text-foreground-secondary">در حال بارگذاری...</p>
    </div>
  );
}
