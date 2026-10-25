import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  /**
   * Run the i18n middleware only on the PUBLIC, localized surface. Everything
   * excluded below is intentionally NOT localized:
   *  - /admin           (private CMS, single-language, only the owner uses it)
   *  - /api             (JSON + revalidation endpoints)
   *  - /_next, static assets, files with an extension (og-image.png, etc.)
   */
  matcher: [
    "/((?!admin|api|_next|_vercel|.*\\..*).*)",
  ],
};
