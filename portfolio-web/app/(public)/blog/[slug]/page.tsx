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
    <article className="wrap max-w-3xl pt-12 sm:pt-16">
      <Link
        href="/blog"
        className="font-mono text-sm text-foreground-dim transition-colors hover:text-accent"
      >
        ← back to log
      </Link>

      <header className="mt-6 border-b border-border pb-6 sm:mt-8 sm:pb-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs text-foreground-faint">
          <TypeBadge type={post.type} />
          <span>{formatDate(post.published_at)}</span>
          <span className="text-border">/</span>
          <span>{post.reading_time} min read</span>
        </div>
        <h1 className="mt-5 font-serif text-3xl leading-tight tracking-tightest text-foreground sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-foreground-dim sm:text-lg">
          {post.summary}
        </p>
      </header>

      <div className="mt-8 sm:mt-10">
        <MDRenderer body={post.body} />
      </div>

      {post.tags.length > 0 && (
        <div className="mt-14 flex flex-wrap gap-2 border-t border-border pt-8">
          {post.tags.map((t) => (
            <Link
              key={t}
              href={`/blog/tags/${encodeURIComponent(t)}`}
              className="rounded-full border border-border px-3 py-1 font-mono text-xs text-foreground-dim transition-colors hover:border-accent hover:text-accent"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
