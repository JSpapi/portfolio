import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "pub-*.r2.dev" },
      // Add your custom R2 domain here, e.g.:
      // { protocol: "https", hostname: "assets.yourdomain.com" },
    ],
  },
  async headers() {
    return [
      {
        // Keep the gated page out of search indexes.
        source: "/private/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default withNextIntl(config);
