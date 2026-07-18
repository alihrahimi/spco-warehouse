import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";

import { siteConfig } from "@/config/site.config";
import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

/**
 * next/font/google downloads and self-hosts Vazirmatn at build time — the
 * font is served from this app's own origin, never fetched from Google's
 * CDN at runtime, satisfying DESIGN-SYSTEM.md's "self-hosted, never CDN"
 * requirement without needing to manually vendor font files.
 *
 * IRANSansX (the documented fallback) is NOT bundled: it is a commercially
 * licensed font, not available on Google Fonts or under an open license,
 * so it cannot be redistributed here without a purchased license. It
 * remains in the CSS `font-family` fallback chain (globals.css) and will
 * be used automatically if a user's device happens to have it installed;
 * self-hosting it requires the company's own licensed font files, which
 * have not been provided.
 */
const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: siteConfig.appName,
  description: "سامانه داخلی مدیریت انبار و ثبت سفارش",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
