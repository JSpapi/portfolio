import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { NowWidget, PostList } from "@/lib/types";
import { PostCard } from "@/components/blog/post-card";

// Homepage is static, rebuilt on deploy; the "now" widget + latest posts
// tolerate a short revalidation window.
export const revalidate = 60;

async function getData() {
  const [now, latest] = await Promise.allSettled([
    apiGet<NowWidget>("/api/now"),
    apiGet<PostList>("/api/posts?limit=3"),
  ]);
  return {
    now: now.status === "fulfilled" ? now.value : null,
    posts: latest.status === "fulfilled" ? latest.value.posts : [],
  };
}

export default async function HomePage() {
  const { now, posts } = await getData();

  return (
    <div className="wrap">
      {/* Hero */}
      <section className="relative pt-24 pb-16 sm:pt-32">
        <p className="kicker animate-fade-up">full-stack engineer · typescript · node · react · go · flutter</p>
        <h1
          className="mt-6 max-w-3xl font-serif text-5xl leading-[1.02] tracking-tightest text-paper animate-fade-up sm:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          I build the{" "}
          <em className="italic text-amber">quiet machinery</em> behind
          products people rely on every day.
        </h1>
        <p
          className="mt-8 max-w-xl text-lg leading-relaxed text-paper-dim animate-fade-up"
          style={{ animationDelay: "160ms" }}
        >
          Right now I&apos;m shipping features across the web app of one of
          Uzbekistan&apos;s biggest insurers. Before that, ~3 years building an
          ELD fleet-compliance platform from zero. Front to back: Node.js &amp;
          Express, Vue &amp; Nuxt, plus PHP/Yii and Go — and a lot of maps. This
          is my working log.
        </p>

        <div
          className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up"
          style={{ animationDelay: "240ms" }}
        >
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-mono text-sm text-ink transition-transform hover:-translate-y-0.5"
          >
            read the log
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-full border border-ink-line px-6 py-3 font-mono text-sm text-paper transition-colors hover:border-paper-faint"
          >
            see the work
          </Link>
        </div>
      </section>

      {/* "Currently working on" widget */}
      {now && (
        <section
          className="relative my-8 animate-fade-up"
          style={{ animationDelay: "320ms" }}
        >
          <div className="overflow-hidden rounded-xl border border-ink-line bg-ink-soft">
            <div className="flex items-center gap-2 border-b border-ink-line px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
              <span className="ml-2 font-mono text-xs text-paper-faint">
                ~/now — currently working on
              </span>
            </div>
            <div className="px-5 py-5 font-mono text-sm leading-relaxed text-paper">
              <span className="text-moss">➜</span>{" "}
              <span className="text-paper-dim">{now.body}</span>
              <span className="animate-blink ml-1 text-amber">▊</span>
            </div>
          </div>
        </section>
      )}

      {/* Latest posts */}
      <section className="mt-20">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl tracking-tight text-paper">
            Latest field notes
          </h2>
          <Link
            href="/blog"
            className="font-mono text-sm text-paper-dim transition-colors hover:text-amber"
          >
            all posts →
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="mt-8 font-mono text-sm text-paper-faint">
            No posts yet. The first entry is being written.
          </p>
        ) : (
          <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-ink-line bg-ink-line sm:grid-cols-1">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
