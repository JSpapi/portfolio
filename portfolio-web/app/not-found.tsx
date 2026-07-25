import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="font-mono text-sm text-accent">404</div>
      <h1 className="mt-4 font-serif text-5xl tracking-tightest text-foreground">
        Not here.
      </h1>
      <p className="mt-3 font-mono text-sm text-foreground-dim">
        <span className="text-[#ff6b6b]">$</span> cat page.txt · no such file or
        directory
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-border px-6 py-3 font-mono text-sm text-foreground hover:border-accent hover:text-accent"
      >
        ← back home
      </Link>
    </div>
  );
}
