"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

// Inline SVG flags — render reliably on every OS (unlike emoji flags on Windows).
const flags: Record<Locale, React.ReactNode> = {
  uz: (
    <svg viewBox="0 0 24 16" width="22" height="15" className="rounded-[2px]">
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="5" fill="#0099b5" />
      <rect y="11" width="24" height="5" fill="#1eb53a" />
      <rect y="5" width="24" height="1" fill="#ce1126" />
      <rect y="10" width="24" height="1" fill="#ce1126" />
      <circle cx="4.5" cy="2.6" r="1.7" fill="#fff" />
      <circle cx="5.1" cy="2.6" r="1.7" fill="#0099b5" />
    </svg>
  ),
  ru: (
    <svg viewBox="0 0 24 16" width="22" height="15" className="rounded-[2px]">
      <rect width="24" height="16" fill="#fff" />
      <rect y="5.33" width="24" height="5.34" fill="#0039a6" />
      <rect y="10.67" width="24" height="5.33" fill="#d52b1e" />
    </svg>
  ),
  en: (
    <svg viewBox="0 0 24 16" width="22" height="15" className="rounded-[2px]">
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0l24 16M24 0L0 16" stroke="#fff" strokeWidth="3" />
      <path d="M0 0l24 16M24 0L0 16" stroke="#c8102e" strokeWidth="1.6" />
      <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5" />
      <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="3" />
    </svg>
  ),
};

const names: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  uz: "O'zbekcha",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function switchTo(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    // Re-render the SAME path under the new locale (next-intl adds/strips prefix).
    router.replace(pathname, { locale: next });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Change language"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 font-mono text-xs text-foreground-dim transition-colors hover:border-foreground-faint hover:text-foreground"
      >
        {flags[locale]}
        <span className="hidden uppercase sm:inline">{locale}</span>
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-xl shadow-black/40">
          {routing.locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                onClick={() => switchTo(l)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left font-mono text-sm transition-colors hover:bg-raised ${
                  l === locale ? "text-accent" : "text-foreground-dim"
                }`}
              >
                {flags[l]}
                <span>{names[l]}</span>
                {l === locale && (
                  <span className="ml-auto text-accent">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
