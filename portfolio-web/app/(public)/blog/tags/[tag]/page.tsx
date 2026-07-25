import Link from "next/link";
import type { Metadata } from "next";
import { apiGet } from "@/lib/api";
import type { PostList } from "@/lib/types";
import { PostCard } from "@/components/blog/post-card";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${decodeURIComponent(tag)}` };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  let list: PostList = { posts: [], page: 1, limit: 50, total: 0 };
  try {
    list = await apiGet<PostList>(
      `/api/posts?tag=${encodeURIComponent(decoded)}&limit=50`,
      { next: { revalidate: 60 } }
    );
  } catch {
    /* fall through to empty state */
  }

  return (
    <div className="wrap max-w-3xl pt-14 sm:pt-20">
      <Link
        href="/blog"
        className="font-mono text-sm text-foreground-dim transition-colors hover:text-accent"
      >
        ← all posts
      </Link>
      <h1 className="mt-6 font-serif text-3xl tracking-tightest text-foreground sm:text-4xl">
        Tagged <span className="text-accent">#{decoded}</span>
      </h1>

      {list.posts.length === 0 ? (
        <p className="mt-12 font-mono text-sm text-foreground-faint">
          No posts under this tag.
        </p>
      ) : (
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border">
          {list.posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
