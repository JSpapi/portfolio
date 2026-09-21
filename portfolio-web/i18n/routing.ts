import { defineRouting } from "next-intl/routing";

/**
 * Supported locales. English is the default and shows NO url prefix
 * (jspapi.dev/blog === English). Russian and Uzbek are prefixed
 * (/ru/blog, /uz/blog) — the "as-needed" strategy.
 *
 * localeDetection is off so everyone lands on English, whatever their
 * browser language says. Switching language still works; it just isn't
 * remembered between visits.
 */
export const routing = defineRouting({
  locales: ["en", "ru", "uz"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
