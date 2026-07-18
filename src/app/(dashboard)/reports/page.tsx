import { BarChart3, CreditCard, Package, TrendingUp, Users, Wallet } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

const REPORTS: { href: string; title: string; description: string; icon: LucideIcon }[] = [
  { href: "/reports/sales", title: "فروش و سفارش‌ها", description: "لیست سفارش‌ها با جمع فروش، تعداد و پرداخت در بازه دلخواه", icon: BarChart3 },
  { href: "/reports/payments", title: "پرداخت‌ها", description: "همه پرداخت‌های نقدی و چکی در بازه دلخواه", icon: CreditCard },
  { href: "/reports/outstanding", title: "مانده حساب‌ها", description: "مشتریانی که مانده پرداخت دارند، به ترتیب بدهی", icon: Wallet },
  { href: "/reports/top-products", title: "پرفروش‌ترین محصولات", description: "محصولات و قطعه‌ها به ترتیب تعداد فروش", icon: TrendingUp },
  { href: "/reports/top-customers", title: "مشتریان برتر", description: "مشتریان به ترتیب مجموع خرید", icon: Users },
];

/**
 * Report hub. Customer and Product "reports" are their existing list pages
 * (search/filter/pagination already built in Phases 11–12) — linked here
 * rather than duplicated as near-identical report variants.
 */
export default function ReportsPage() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <PageHeader title="گزارش‌ها" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REPORTS.map((report) => (
            <Link key={report.href} href={report.href as Route}>
              <Card interactive className="flex h-full items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-medium bg-primary-light text-primary">
                  <report.icon className="size-6" />
                </span>
                <div>
                  <p className="text-body-large font-semibold text-foreground">{report.title}</p>
                  <p className="mt-1 text-body-small text-foreground-secondary">{report.description}</p>
                </div>
              </Card>
            </Link>
          ))}
          <Link href="/customers">
            <Card interactive className="flex h-full items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-medium bg-secondary-light text-secondary">
                <Users className="size-6" />
              </span>
              <div>
                <p className="text-body-large font-semibold text-foreground">مشتریان</p>
                <p className="mt-1 text-body-small text-foreground-secondary">لیست کامل مشتریان با جستجو، مانده حساب و آخرین سفارش</p>
              </div>
            </Card>
          </Link>
          <Link href="/products">
            <Card interactive className="flex h-full items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-medium bg-secondary-light text-secondary">
                <Package className="size-6" />
              </span>
              <div>
                <p className="text-body-large font-semibold text-foreground">محصولات</p>
                <p className="mt-1 text-body-small text-foreground-secondary">لیست کامل محصولات با جستجو و وضعیت</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
