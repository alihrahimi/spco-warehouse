import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site.config";

/**
 * PWA web app manifest (Phase 01: installable on tablets/desktop/mobile).
 * The SVG icon is the internal tool's own identity from `siteConfig` —
 * never the company's branding, which is database-driven. SVG icons with
 * `purpose: any` are supported by Chromium-based browsers, the Android
 * tablet target. No offline service worker in v1 by design (connectivity
 * required — Phase 01 decision); installability only.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.appName,
    short_name: siteConfig.appName,
    description: "سامانه داخلی مدیریت انبار و ثبت سفارش",
    start_url: "/",
    display: "standalone",
    dir: "rtl",
    lang: "fa",
    background_color: "#f7f7f5",
    theme_color: "#1e5a96",
    icons: [
      {
        src: "/icons/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
