import type { NotificationSettings } from "@prisma/client";

import { db } from "@/lib/db";
import { saveUploadedImage } from "@/lib/storage/local-storage-provider";
import { NOTIFICATION_EVENT_TYPES } from "@/features/settings/notification-event-types";
import type { PhoneKind } from "@/lib/enums";
import type { CompanySettingsInput, SystemSettingsInput } from "@/features/settings/schemas/settings.schema";

export type ServiceResult<T = void> = { success: true; data: T } | { success: false; error: string };

function emptyToNull(value: string | undefined): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

// ---------------------------------------------------------------------------
// Company settings (singleton row — created on first save)
// ---------------------------------------------------------------------------

export interface CompanySettingsView {
  companyName: string;
  managerName: string;
  logoFilePath: string | null;
  phoneNumbers: { phoneNumber: string; kind: PhoneKind; label: string }[];
  whatsappNumber: string;
  telegramHandle: string;
  instagramHandle: string;
  address: string;
  footerText: string;
}

export async function getCompanySettings(): Promise<CompanySettingsView | null> {
  const settings = await db.companySettings.findFirst({
    include: { phoneNumbers: { orderBy: { sortOrder: "asc" } } },
  });
  if (!settings) return null;

  return {
    companyName: settings.companyName,
    managerName: settings.managerName ?? "",
    logoFilePath: settings.logoFilePath,
    phoneNumbers: settings.phoneNumbers.map((phone) => ({
      phoneNumber: phone.phoneNumber,
      kind: phone.kind as PhoneKind,
      label: phone.label ?? "",
    })),
    whatsappNumber: settings.whatsappNumber ?? "",
    telegramHandle: settings.telegramHandle ?? "",
    instagramHandle: settings.instagramHandle ?? "",
    address: settings.address ?? "",
    footerText: settings.footerText ?? "",
  };
}

/**
 * Upserts the singleton row and fully replaces the phone-number list (the
 * form owns the whole list, same replace-all pattern as order items).
 * Changing anything here affects only FUTURE invoices — historical ones
 * read their frozen `InvoiceDocument` snapshots and never touch this row
 * (the Phase 03 guarantee, unchanged).
 */
export async function updateCompanySettings(input: CompanySettingsInput): Promise<ServiceResult> {
  await db.$transaction(async (tx) => {
    const existing = await tx.companySettings.findFirst();

    const settings = existing
      ? await tx.companySettings.update({
          where: { id: existing.id },
          data: {
            companyName: input.companyName,
            managerName: emptyToNull(input.managerName),
            whatsappNumber: emptyToNull(input.whatsappNumber),
            telegramHandle: emptyToNull(input.telegramHandle),
            instagramHandle: emptyToNull(input.instagramHandle),
            address: emptyToNull(input.address),
            footerText: emptyToNull(input.footerText),
          },
        })
      : await tx.companySettings.create({
          data: {
            companyName: input.companyName,
            managerName: emptyToNull(input.managerName),
            whatsappNumber: emptyToNull(input.whatsappNumber),
            telegramHandle: emptyToNull(input.telegramHandle),
            instagramHandle: emptyToNull(input.instagramHandle),
            address: emptyToNull(input.address),
            footerText: emptyToNull(input.footerText),
          },
        });

    await tx.companyPhoneNumber.deleteMany({ where: { companySettingsId: settings.id } });
    if (input.phoneNumbers.length > 0) {
      await tx.companyPhoneNumber.createMany({
        data: input.phoneNumbers.map((phone, index) => ({
          companySettingsId: settings.id,
          phoneNumber: phone.phoneNumber,
          kind: phone.kind,
          label: emptyToNull(phone.label),
          sortOrder: index,
        })),
      });
    }
  });

  return { success: true, data: undefined };
}

/**
 * Logo upload through the same StorageProvider as product images — a fresh
 * UUID filename every time, never overwriting the previous file. The old
 * logo file is deliberately NOT deleted: `InvoiceDocument.companyLogoSnapshot`
 * rows from already-generated invoices still point at it (the immutable-
 * file-path rule from the Design System — deleting it would corrupt
 * historical documents).
 */
export async function updateCompanyLogo(file: File): Promise<ServiceResult<{ logoFilePath: string }>> {
  const existing = await db.companySettings.findFirst();
  if (!existing) {
    return { success: false, error: "ابتدا اطلاعات شرکت را ذخیره کنید، سپس لوگو را بارگذاری کنید" };
  }

  const saved = await saveUploadedImage(file, "company");
  if (!saved.success) return { success: false, error: saved.error };

  await db.companySettings.update({ where: { id: existing.id }, data: { logoFilePath: saved.publicPath } });
  return { success: true, data: { logoFilePath: saved.publicPath } };
}

// ---------------------------------------------------------------------------
// System settings (invoice numbering + application_settings key-values)
// ---------------------------------------------------------------------------

const APP_SETTING_KEYS = {
  DEFAULT_PACK_SIZE: "default_pack_size",
  CURRENCY_LABEL: "currency_label",
} as const;

async function getAppSetting(key: string): Promise<string | null> {
  const row = await db.applicationSetting.findUnique({ where: { settingKey: key } });
  return row?.settingValue ?? null;
}

async function setAppSetting(key: string, value: string, valueType: "string" | "number", description: string): Promise<void> {
  await db.applicationSetting.upsert({
    where: { settingKey: key },
    update: { settingValue: value },
    create: { settingKey: key, settingValue: value, valueType, description },
  });
}

export interface SystemSettingsView {
  numberPrefix: string;
  invoiceFooterNote: string;
  showLogoOnInvoice: boolean;
  defaultPackSize: number;
  currencyLabel: string;
}

export async function getSystemSettings(): Promise<SystemSettingsView> {
  const [invoiceSettings, packSize, currency] = await Promise.all([
    db.invoiceSettings.findFirst(),
    getAppSetting(APP_SETTING_KEYS.DEFAULT_PACK_SIZE),
    getAppSetting(APP_SETTING_KEYS.CURRENCY_LABEL),
  ]);

  return {
    numberPrefix: invoiceSettings?.numberPrefix ?? "",
    invoiceFooterNote: invoiceSettings?.footerNote ?? "",
    showLogoOnInvoice: invoiceSettings?.showLogoOnInvoice ?? true,
    defaultPackSize: packSize ? Number.parseInt(packSize, 10) : 6,
    currencyLabel: currency ?? "تومان",
  };
}

export async function updateSystemSettings(input: SystemSettingsInput): Promise<ServiceResult> {
  const existing = await db.invoiceSettings.findFirst();
  const prefix = input.numberPrefix?.trim() ?? "";

  if (existing) {
    await db.invoiceSettings.update({
      where: { id: existing.id },
      data: {
        numberPrefix: prefix,
        footerNote: emptyToNull(input.invoiceFooterNote),
        showLogoOnInvoice: input.showLogoOnInvoice,
      },
    });
  } else {
    await db.invoiceSettings.create({
      data: {
        numberPrefix: prefix,
        footerNote: emptyToNull(input.invoiceFooterNote),
        showLogoOnInvoice: input.showLogoOnInvoice,
      },
    });
  }

  await setAppSetting(
    APP_SETTING_KEYS.DEFAULT_PACK_SIZE,
    String(input.defaultPackSize),
    "number",
    "سایز بسته پیش‌فرض برای سایزهای جدید محصول",
  );
  await setAppSetting(APP_SETTING_KEYS.CURRENCY_LABEL, input.currencyLabel, "string", "واحد پول نمایشی");

  return { success: true, data: undefined };
}

/** Read by Product Management when creating new size rows — falls back to the Phase 01 default of 6. */
export async function getDefaultPackSize(): Promise<number> {
  const value = await getAppSetting(APP_SETTING_KEYS.DEFAULT_PACK_SIZE);
  const parsed = value ? Number.parseInt(value, 10) : NaN;
  return Number.isNaN(parsed) || parsed <= 0 ? 6 : parsed;
}

// ---------------------------------------------------------------------------
// Notification settings + history (the internal framework's admin surface)
// ---------------------------------------------------------------------------

export async function getNotificationSettings(): Promise<NotificationSettings[]> {
  for (const { eventType } of NOTIFICATION_EVENT_TYPES) {
    await db.notificationSettings.upsert({
      where: { eventType },
      update: {},
      create: { eventType, isEnabled: false },
    });
  }
  return db.notificationSettings.findMany({ orderBy: { eventType: "asc" } });
}

export async function updateNotificationSetting(
  eventType: string,
  isEnabled: boolean,
  telegramChatId: string | undefined,
): Promise<ServiceResult> {
  await db.notificationSettings.upsert({
    where: { eventType },
    update: { isEnabled, telegramChatId: emptyToNull(telegramChatId) },
    create: { eventType, isEnabled, telegramChatId: emptyToNull(telegramChatId) },
  });
  return { success: true, data: undefined };
}

export async function getNotificationHistory(limit = 100) {
  return db.notificationEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { relatedOrder: { select: { id: true, orderNumber: true } } },
  });
}
