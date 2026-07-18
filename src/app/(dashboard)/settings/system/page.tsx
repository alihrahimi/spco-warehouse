// Settings read live database state per request — never prerendered at build time.
export const dynamic = "force-dynamic";

import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SystemSettingsForm } from "@/features/settings/components/system-settings-form";
import { getSystemSettings } from "@/features/settings/services";

export default async function SystemSettingsPage() {
  const settings = await getSystemSettings();

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Breadcrumb items={[{ label: "تنظیمات", href: "/settings" }, { label: "تنظیمات سیستم" }]} />
        <PageHeader title="تنظیمات سیستم" />
        <SystemSettingsForm initial={settings} />
      </div>
    </PageContainer>
  );
}
