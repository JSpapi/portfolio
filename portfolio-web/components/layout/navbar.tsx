import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { NavLinks } from "./nav-links";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="wrap flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="group flex items-center gap-2 font-mono text-sm tracking-tight"
        >
          <span className="text-accent">~/</span>
          <span className="text-foreground transition-colors group-hover:text-accent">
            Axror
          </span>
          <span className="animate-blink text-accent">▊</span>
        </Link>

        {/* Desktop/tablet inline nav; phones use the bottom tab bar instead. */}
        <nav className="hidden items-center gap-1 font-mono text-sm sm:flex">
          <NavLinks />
          <div className="ml-2">
            <LanguageSwitcher />
          </div>
        </nav>

        {/* On phones the switcher sits in the top bar (bottom bar has the tabs). */}
        <div className="sm:hidden">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
