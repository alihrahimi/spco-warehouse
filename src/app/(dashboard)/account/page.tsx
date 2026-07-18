import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { AccountStatusBadge } from "@/components/shared/account-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { getCurrentUserProfile } from "@/features/auth/services";
import { getCurrentSession } from "@/lib/auth/session";
import { formatJalaliDateTime, formatJalaliNumeric } from "@/lib/format/date";
import { ROLE_LABELS_FA, isRoleSlug } from "@/lib/auth/roles";

/**
 * Deliberately just the account-profile view Phase 10 asks for (full
 * name, username, role, status, last login, created date) plus a
 * password-change form — not the full tile-grid Dashboard from
 * SCREEN-SPECS.md §2, which has nothing real to link to yet (Customers/
 * Products/Orders don't exist until Phases 11–13).
 */
export default async function AccountPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile(session.user.id);
  if (!profile) {
    redirect("/login");
  }

  const roleLabel = isRoleSlug(profile.roleSlug) ? ROLE_LABELS_FA[profile.roleSlug] : profile.roleSlug;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="حساب کاربری" />

      <Card className="grid max-w-xl grid-cols-2 gap-4">
        <div>
          <p className="text-body-small text-foreground-secondary">نام کامل</p>
          <p className="text-body-large font-medium text-foreground">{profile.fullName}</p>
        </div>
        <div>
          <p className="text-body-small text-foreground-secondary">نام کاربری</p>
          <p dir="ltr" className="text-body-large font-medium text-foreground">
            {profile.username}
          </p>
        </div>
        <div>
          <p className="text-body-small text-foreground-secondary">نقش</p>
          <p className="text-body-large font-medium text-foreground">{roleLabel}</p>
        </div>
        <div>
          <p className="text-body-small text-foreground-secondary">وضعیت</p>
          <AccountStatusBadge status={profile.status} />
        </div>
        <div>
          <p className="text-body-small text-foreground-secondary">آخرین ورود</p>
          <p className="text-body-large font-medium text-foreground">
            {profile.lastLoginAt ? formatJalaliDateTime(profile.lastLoginAt) : "—"}
          </p>
        </div>
        <div>
          <p className="text-body-small text-foreground-secondary">تاریخ ایجاد حساب</p>
          <p className="text-body-large font-medium text-foreground">{formatJalaliNumeric(profile.createdAt)}</p>
        </div>
      </Card>

      <div>
        <h2 className="mb-4 text-h4 font-semibold text-foreground">تغییر رمز عبور</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
