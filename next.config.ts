import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type-checks route strings (e.g. <Link href>) at build time.
  typedRoutes: true,
  // Loaded at runtime, never bundled: @napi-rs/canvas ships a native .node
  // binding, and pdfjs-dist's legacy build resolves it dynamically (invoice
  // PNG export).
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
