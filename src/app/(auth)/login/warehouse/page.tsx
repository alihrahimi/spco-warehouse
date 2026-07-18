import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentSession } from "@/lib/auth/session";
import { siteConfig } from "@/config/site.config";

export const metadata: Metadata = {
  title: `ورود انبار | ${siteConfig.appName}`,
};

/** Warehouse Dashboard's login — accepts only Warehouse Staff accounts (`auth-options.ts`). */
export default async function WarehouseLoginPage() {
  const session = await getCurrentSession();
  if (session) redirect("/");

  return (
    <>
      <div className="mb-8 flex items-center gap-2">
        <ClipboardList className="size-6 text-secondary" />
        <p className="text-h3 font-semibold text-foreground">{siteConfig.appName} — انبار</p>
      </div>
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-h3 font-semibold text-foreground">ورود انبار</h1>
        <LoginForm surface="warehouse" />
      </Card>
    </>
  );
}
