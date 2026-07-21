import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep the gated page and admin out of indexes.
        disallow: ["/private", "/private/", "/admin", "/admin/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
