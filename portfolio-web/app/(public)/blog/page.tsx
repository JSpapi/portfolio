import Link from "next/link";
import type { Metadata } from "next";
import { apiGet } from "@/lib/api";
import type { PostList, TagCount } from "@/lib/types";
import { PostCard } from "@/components/blog/post-card";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Log",
  description: "Weekly logs, daily notes, deep dives, and things I learned.",
};

async function getData(page: number) {
  const [list, tags] = await Promise.allSettled([
    apiGet<PostList>(`/api/posts?page=${page}&limit=10`),
    apiGet<{ tags: TagCount[] }>("/api/posts/tags"),
  ]);
  return {
    list:
      list.status === "fulfilled"
        ? list.value
        : { posts: [], page, limit: 10, total: 0 },
    tags: tags.status === "fulfilled" ? tags.value.tags : [],
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const { list, tags } = await getData(page);
  const totalPages = Math.max(1, Math.ceil(list.total / list.limit));

  return (
    <div className="wrap pt-14 sm:pt-20">
      <header className="max-w-2xl">
        <p className="kicker">the working log</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tightest text-foreground sm:text-5xl">
          Field notes
        </h1>
        <p className="mt-4 text-base text-foreground-dim sm:text-lg">
          Raw entries from real work — decisions, dead ends, and the fixes that
          stuck.
        </p>
      </header>

      {tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link
              key={t.tag}
              href={`/blog/tags/${encodeURIComponent(t.tag)}`}
              className="rounded-full border border-border px-3 py-1 font-mono text-xs text-foreground-dim transition-colors hover:border-accent hover:text-accent"
            >
              #{t.tag}
              <span className="ml-1.5 text-foreground-faint">{t.count}</span>
            </Link>
          ))}
        </div>
      )}

      {list.posts.length === 0 ? (
        <p className="mt-16 font-mono text-sm text-foreground-faint">
          Nothing published yet.
        </p>
      ) : (
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border">
          {list.posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-between font-mono text-sm">
          {page > 1 ? (
            <Link
              href={`/blog?page=${page - 1}`}
              className="text-foreground-dim hover:text-accent"
            >
              ← newer
            </Link>
          ) : (
            <span className="text-foreground-faint/40">← newer</span>
          )}
          <span className="text-foreground-faint">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/blog?page=${page + 1}`}
              className="text-foreground-dim hover:text-accent"
            >
              older →
            </Link>
          ) : (
            <span className="text-foreground-faint/40">older →</span>
          )}
        </nav>
      )}
    </div>
  );
}
