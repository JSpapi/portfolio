"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const links = [
  { href: "/", key: "home", match: (p: string) => p === "/" },
  { href: "/blog", key: "blog", match: (p: string) => p.startsWith("/blog") },
  {
    href: "/projects",
    key: "work",
    match: (p: string) => p.startsWith("/projects"),
  },
  { href: "/about", key: "about", match: (p: string) => p.startsWith("/about") },
] as const;

/**
 * Desktop nav links with an active-page highlight. usePathname (from next-intl)
 * returns the locale-stripped path, so matching works the same in every language.
 */
export function NavLinks() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const profileActive =
    pathname.startsWith("/request-access") || pathname.startsWith("/private");

  return (
    <>
      {links.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded px-3 py-1.5 transition-colors ${
              active
                ? "bg-accent/10 font-medium text-accent"
                : "text-foreground-dim hover:bg-raised hover:text-foreground"
            }`}
          >
            {t(l.key)}
          </Link>
        );
      })}
      <Link
        href="/request-access"
        aria-current={profileActive ? "page" : undefined}
        className={`ml-2 rounded border px-3 py-1.5 transition-colors ${
          profileActive
            ? "border-accent bg-accent text-background"
            : "border-accent/40 bg-accent/10 text-accent hover:bg-accent hover:text-background"
        }`}
      >
        {t("profile")}
      </Link>
    </>
  );
}
