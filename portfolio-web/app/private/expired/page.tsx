import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Link expired",
  robots: { index: false, follow: false },
};

export default function ExpiredPage() {
  return (
    <div className="wrap flex min-h-screen max-w-md flex-col items-center justify-center text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#ff6b6b]/40 font-mono text-2xl text-[#ff6b6b]">
        ✕
      </div>
      <h1 className="mt-6 font-serif text-3xl text-foreground">Link expired</h1>
      <p className="mt-3 text-foreground-dim">
        This access link is invalid, already used, or has expired. Magic links
        work once and last 24 hours.
      </p>
      <a
        href="/request-access"
        className="mt-8 inline-flex rounded-full bg-accent px-6 py-3 font-mono text-sm text-background"
      >
        request a new link →
      </a>
    </div>
  );
}
