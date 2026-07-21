import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api";
import type { Post } from "@/lib/types";
import { MDRenderer } from "@/components/blog/md-renderer";
import { TypeBadge } from "@/components/blog/type-badge";

export const revalidate = 60;
export const dynamicParams = true;

async function getPost(slug: string): Promise<Post | null> {
  try {
    return await apiGet<Post>(`/api/posts/${slug}`, { next: { revalidate: 60 } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Not found" };
  return { title: post.title, description: post.summary };
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="wrap max-w-3xl pt-16">
      <Link
        href="/blog"
        className="font-mono text-sm text-paper-dim transition-colors hover:text-amber"
      >
        ← back to log
      </Link>

      <header className="mt-8 border-b border-ink-line pb-8">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-paper-faint">
          <TypeBadge type={post.type} />
          <span>{formatDate(post.published_at)}</span>
          <span className="text-ink-line">/</span>
          <span>{post.reading_time} min read</span>
        </div>
        <h1 className="mt-5 font-serif text-4xl leading-tight tracking-tightest text-paper sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-paper-dim">
          {post.summary}
        </p>
      </header>

      <div className="mt-10">
        <MDRenderer body={post.body} />
      </div>

      {post.tags.length > 0 && (
        <div className="mt-14 flex flex-wrap gap-2 border-t border-ink-line pt-8">
          {post.tags.map((t) => (
            <Link
              key={t}
              href={`/blog/tags/${encodeURIComponent(t)}`}
              className="rounded-full border border-ink-line px-3 py-1 font-mono text-xs text-paper-dim transition-colors hover:border-amber hover:text-amber"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
