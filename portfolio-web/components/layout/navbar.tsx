import Link from "next/link";

const links = [
  { href: "/", label: "index" },
  { href: "/blog", label: "log" },
  { href: "/projects", label: "work" },
  { href: "/about", label: "about" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="wrap flex h-16 items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2 font-mono text-sm tracking-tight"
        >
          <span className="text-accent">~/</span>
          <span className="text-foreground transition-colors group-hover:text-accent">
            axror
          </span>
          <span className="animate-blink text-accent">▊</span>
        </Link>

        {/* Desktop/tablet inline nav; phones use the bottom tab bar instead. */}
        <nav className="hidden items-center gap-1 font-mono text-sm sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded px-3 py-1.5 text-foreground-dim transition-colors hover:bg-raised hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/request-access"
            className="ml-2 rounded border border-accent/40 bg-accent/10 px-3 py-1.5 text-accent transition-colors hover:bg-accent hover:text-background"
          >
            request access
          </Link>
        </nav>
      </div>
    </header>
  );
}
