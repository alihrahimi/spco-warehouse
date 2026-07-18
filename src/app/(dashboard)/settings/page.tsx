// Settings read live database state per request — never prerendered at build time.
export const dynamic = "force-dynamic";

import Link from "next/link";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { CompanySettingsForm } from "@/features/settings/components/company-settings-form";
import { getCompanySettings } from "@/features/settings/services";

/** Admin-only (enforced by proxy.ts's /settings permission gate since Phase 10 — this page needed zero extra wiring to be protected). */
export default async function CompanySettingsPage() {
  const settings = await getCompanySettings();

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Breadcrumb items={[{ label: "تنظیمات" }]} />
        <PageHeader
          title="تنظیمات شرکت"
          actions={
            <nav className="flex items-center gap-4 text-body-small font-medium">
              <Link href="/settings/system" className="text-primary hover:underline">
                تنظیمات سیستم
              </Link>
              <Link href="/settings/notifications" className="text-primary hover:underline">
                اعلان‌ها
              </Link>
            </nav>
          }
        />
        <CompanySettingsForm initial={settings} />
      </div>
    </PageContainer>
  );
}
