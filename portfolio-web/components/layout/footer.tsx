import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-border/70 sm:mt-32">
      <div className="wrap flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:py-12">
        <div className="font-mono text-xs leading-relaxed text-foreground-faint">
          <span className="text-accent">$</span> built with go · next.js · postgres
          · r2
          <br />© {year}{" "}
          <span className="text-foreground">
            <span className="text-accent">JS</span>papi.dev
          </span>{" "}
          — all rights reserved
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 font-mono text-xs">
          <a
            href="/api/feed.rss"
            className="text-foreground-dim transition-colors hover:text-accent"
          >
            rss
          </a>
          <Link
            href="/request-access"
            className="text-foreground-dim transition-colors hover:text-accent"
          >
            private profile
          </Link>
          <a
            href="https://github.com/JSpapi"
            target="_blank"
            rel="noreferrer"
            className="text-foreground-dim transition-colors hover:text-accent"
          >
            github
          </a>
          <a
            href="https://www.linkedin.com/in/axror-kurbanov-react-ts/"
            target="_blank"
            rel="noreferrer"
            className="text-foreground-dim transition-colors hover:text-accent"
          >
            linkedin
          </a>
          <a
            href="https://t.me/AKcoder7L"
            target="_blank"
            rel="noreferrer"
            className="text-foreground-dim transition-colors hover:text-accent"
          >
            telegram
          </a>
          <a
            href="https://www.instagram.com/jspapi365"
            target="_blank"
            rel="noreferrer"
            className="text-foreground-dim transition-colors hover:text-accent"
          >
            instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
