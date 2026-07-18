import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentSession } from "@/lib/auth/session";
import { siteConfig } from "@/config/site.config";

export const metadata: Metadata = {
  title: `ورود مدیریت | ${siteConfig.appName}`,
};

/** Administrator Dashboard's login — accepts only Administrator/Manager accounts (`auth-options.ts`). */
export default async function AdminLoginPage() {
  const session = await getCurrentSession();
  if (session) redirect("/");

  return (
    <>
      <div className="mb-8 flex items-center gap-2">
        <ShieldCheck className="size-6 text-primary" />
        <p className="text-h3 font-semibold text-foreground">{siteConfig.appName} — مدیریت</p>
      </div>
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-h3 font-semibold text-foreground">ورود مدیریت</h1>
        <LoginForm surface="admin" />
      </Card>
    </>
  );
}
