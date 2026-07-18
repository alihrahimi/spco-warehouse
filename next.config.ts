import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type-checks route strings (e.g. <Link href>) at build time.
  typedRoutes: true,
};

export default nextConfig;
