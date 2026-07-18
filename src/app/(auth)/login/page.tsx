import { ClipboardList, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";
import { siteConfig } from "@/config/site.config";

export const metadata: Metadata = {
  title: `ورود | ${siteConfig.appName}`,
};

interface LoginChooserPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

/**
 * Entry point for both applications (final-revision requirement #1/#2):
 * the Administrator Dashboard (management) and the Warehouse Dashboard
 * (order entry) are separate login surfaces, `/login/admin` and
 * `/login/warehouse`, each accepting only its own account type
 * (`auth-options.ts`'s `roleBelongsOnSurface`). This page is just the
 * fork — it forwards `callbackUrl` (set by `proxy.ts` when an
 * unauthenticated request hits a protected route) to whichever surface
 * the user picks, so the original destination survives the extra step.
 */
export default async function LoginChooserPage({ searchParams }: LoginChooserPageProps) {
  const session = await getCurrentSession();
  if (session) redirect("/");

  const { callbackUrl } = await searchParams;
  const suffix = callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";

  return (
    <>
      <p className="mb-8 text-h3 font-semibold text-foreground">{siteConfig.appName}</p>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href={`/login/admin${suffix}` as Route}>
          <Card interactive className="flex h-full flex-col items-center gap-3 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary-light text-primary">
              <ShieldCheck className="size-7" />
            </span>
            <p className="text-h4 font-semibold text-foreground">ورود مدیریت</p>
            <p className="text-body-small text-foreground-secondary">مدیران و مسئولان فروش</p>
          </Card>
        </Link>
        <Link href={`/login/warehouse${suffix}` as Route}>
          <Card interactive className="flex h-full flex-col items-center gap-3 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-secondary-light text-secondary">
              <ClipboardList className="size-7" />
            </span>
            <p className="text-h4 font-semibold text-foreground">ورود انبار</p>
            <p className="text-body-small text-foreground-secondary">ثبت سریع سفارش</p>
          </Card>
        </Link>
      </div>
    </>
  );
}
