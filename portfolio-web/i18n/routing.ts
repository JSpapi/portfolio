import { defineRouting } from "next-intl/routing";

/**
 * Supported locales. English is the default and shows NO url prefix
 * (jspapi.dev/blog === English). Russian and Uzbek are prefixed
 * (/ru/blog, /uz/blog) — the "as-needed" strategy.
 *
 * localeDetection is off so everyone lands on English, whatever their
 * browser language says. Switching language still works; it just isn't
 * remembered between visits.
 *
 * localeCookie is off because a Set-Cookie on every response made every
 * page uncacheable. The cookie /private needs is written in the browser
 * instead (components/layout/locale-cookie.tsx).
 */
export const routing = defineRouting({
  locales: ["en", "ru", "uz"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
