"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Fixed bottom tab bar shown on phones (hidden on lg+). Thumb-friendly, with
 * icon + label per destination and an active-state highlight. The public layout
 * adds bottom padding so content never hides behind it.
 */

type Item = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  match: (path: string) => boolean;
};

const stroke = {
  fill: "none",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const items: Item[] = [
  {
    href: "/",
    label: "Home",
    match: (p) => p === "/",
    icon: () => (
      <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" {...stroke}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20h14V9.5" />
      </svg>
    ),
  },
  {
    href: "/blog",
    label: "Log",
    match: (p) => p.startsWith("/blog"),
    icon: () => (
      <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" {...stroke}>
        <path d="M6 4h9l3 3v13H6z" />
        <path d="M9 9h6M9 13h6M9 17h4" />
      </svg>
    ),
  },
  {
    href: "/projects",
    label: "Work",
    match: (p) => p.startsWith("/projects"),
    icon: () => (
      <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" {...stroke}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
      </svg>
    ),
  },
  {
    href: "/about",
    label: "About",
    match: (p) => p.startsWith("/about"),
    icon: () => (
      <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" {...stroke}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
      </svg>
    ),
  },
  {
    href: "/request-access",
    label: "Access",
    match: (p) => p.startsWith("/request-access") || p.startsWith("/private"),
    icon: () => (
      <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" {...stroke}>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    ),
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-line bg-ink/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map((it) => {
          const active = it.match(pathname);
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-mono transition-colors ${
                  active ? "text-amber" : "text-paper-faint"
                }`}
              >
                <span className={active ? "text-amber" : "text-paper-dim"}>
                  {it.icon(active)}
                </span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
