"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root-level catch-all (Next.js `global-error.tsx` convention) — only
 * triggers if the root layout itself throws, which `error.tsx` cannot
 * catch. Must render its own `<html>`/`<body>` since it replaces the root
 * layout entirely; kept deliberately minimal and self-contained (no
 * external font/provider dependency) so it can render even if the failure
 * originated in one of those.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body style={{ fontFamily: "Tahoma, sans-serif", padding: "4rem", textAlign: "center" }}>
        <p style={{ fontSize: "1.125rem", marginBottom: "1.5rem" }}>خطای غیرمنتظره‌ای رخ داد.</p>
        <button
          type="button"
          onClick={reset}
          style={{ padding: "0.75rem 1.5rem", fontSize: "1rem", cursor: "pointer" }}
        >
          تلاش دوباره
        </button>
      </body>
    </html>
  );
}
