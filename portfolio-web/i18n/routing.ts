import { defineRouting } from "next-intl/routing";

/**
 * Supported locales. Russian is the default and shows NO url prefix
 * (jspapi.dev/blog === Russian). English and Uzbek are prefixed
 * (/en/blog, /uz/blog) — the "as-needed" strategy.
 */
export const routing = defineRouting({
  locales: ["ru", "en", "uz"],
  defaultLocale: "ru",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
