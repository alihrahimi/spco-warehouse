import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PageContainer } from "@/components/shared/page-container";
import { requirePermission } from "@/lib/auth/session";
import { AccountingHelper } from "@/features/accounting-helper/components/accounting-helper";

/**
 * Tools hub entry, gated the same as every other utility (`/utilities`
 * prefix → `utilities:use`, enforced by proxy.ts). Prepares a clean,
 * code-only entry sheet for an external accounting system from the
 * existing Products catalog — never touches Orders/Pre-Invoices/Warehouse
 * state, and persists nothing server-side; the sheet lives only in the
 * client component's state until exported.
 */
export default async function AccountingHelperPage() {
  await requirePermission("utilities:use");

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <div className="print:hidden">
          <Breadcrumb items={[{ label: "ابزارها", href: "/utilities" }, { label: "دستیار حسابداری" }]} />
          <h1 className="mt-2 text-h2 font-semibold text-foreground">دستیار حسابداری</h1>
          <p className="mt-1 text-body text-foreground-secondary">
            آماده‌سازی سریع برگه ورود اطلاعات برای نرم‌افزار حسابداری — مستقل از سفارش‌ها و پیش‌فاکتورها.
          </p>
        </div>
        <AccountingHelper />
      </div>
    </PageContainer>
  );
}
