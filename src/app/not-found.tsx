import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

/** Next.js `not-found.tsx` convention — renders for any unmatched route. */
export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={FileQuestion}
        title="صفحه‌ای یافت نشد"
        description="آدرس مورد نظر وجود ندارد."
        action={
          <Button asChild>
            <Link href="/">بازگشت به داشبورد</Link>
          </Button>
        }
      />
    </div>
  );
}
