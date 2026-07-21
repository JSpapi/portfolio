import Link from "next/link";

const links = [
  { href: "/", label: "index" },
  { href: "/blog", label: "log" },
  { href: "/projects", label: "work" },
  { href: "/about", label: "about" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-line/70 bg-ink/80 backdrop-blur-md">
      <div className="wrap flex h-16 items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2 font-mono text-sm tracking-tight"
        >
          <span className="text-amber">~/</span>
          <span className="text-paper transition-colors group-hover:text-amber">
            axror
          </span>
          <span className="animate-blink text-amber">▊</span>
        </Link>

        <nav className="flex items-center gap-1 font-mono text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded px-3 py-1.5 text-paper-dim transition-colors hover:bg-ink-raised hover:text-paper"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/request-access"
            className="ml-2 rounded border border-amber/40 bg-amber/10 px-3 py-1.5 text-amber transition-colors hover:bg-amber hover:text-ink"
          >
            request access
          </Link>
        </nav>
      </div>
    </header>
  );
}
