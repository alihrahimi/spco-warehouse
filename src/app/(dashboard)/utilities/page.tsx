import { Calculator, FileOutput } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

/**
 * Utilities hub (SCREEN-SPECS.md §17): one tile per tool, purpose-built to
 * absorb future tools without touching the Dashboard — adding a utility is
 * adding an entry here plus its page, nothing else.
 */
export default function UtilitiesPage() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <PageHeader title="ابزارها" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/utilities/xps-to-pdf">
            <Card interactive className="flex h-full items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-medium bg-primary-light text-primary">
                <FileOutput className="size-6" />
              </span>
              <div>
                <p className="text-body-large font-semibold text-foreground">تبدیل XPS به PDF</p>
                <p className="mt-1 text-body-small text-foreground-secondary">فایل XPS را انتخاب کنید و خروجی PDF دریافت کنید.</p>
              </div>
            </Card>
          </Link>
          <Link href="/utilities/accounting-helper">
            <Card interactive className="flex h-full items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-medium bg-primary-light text-primary">
                <Calculator className="size-6" />
              </span>
              <div>
                <p className="text-body-large font-semibold text-foreground">دستیار حسابداری</p>
                <p className="mt-1 text-body-small text-foreground-secondary">
                  آماده‌سازی برگه ورود اطلاعات فاکتورهای رسمی برای نرم‌افزار حسابداری.
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
