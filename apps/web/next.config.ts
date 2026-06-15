import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer", "canvas"],
  transpilePackages: ["@saas/ui", "@saas/types"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // canvas is a native module required by @react-pdf/renderer — mark as external
      config.externals = [...(config.externals ?? []), "canvas"];
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
