import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="font-mono text-sm text-amber">404</div>
      <h1 className="mt-4 font-serif text-5xl tracking-tightest text-paper">
        Not here.
      </h1>
      <p className="mt-3 font-mono text-sm text-paper-dim">
        <span className="text-[#ff6b6b]">$</span> cat page.txt · no such file or
        directory
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-ink-line px-6 py-3 font-mono text-sm text-paper hover:border-amber hover:text-amber"
      >
        ← back home
      </Link>
    </div>
  );
}
