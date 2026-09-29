import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiGet } from "@/lib/api";
import type { PostList } from "@/lib/types";
import { PostCard } from "@/components/blog/post-card";

export const revalidate = 3600;
export const dynamicParams = true;

// Nothing prebuilt; each tag renders on first visit and is then cached.
// Without this function the route stays fully dynamic.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${decodeURIComponent(tag)}` };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale, tag } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const decoded = decodeURIComponent(tag);
  // Throws on API failure so a refresh keeps the last good page.
  const list = await apiGet<PostList>(
    `/api/posts?tag=${encodeURIComponent(decoded)}&limit=50`,
    { next: { revalidate: 3600 } },
  );

  return (
    <div className="wrap max-w-3xl pt-14 sm:pt-20">
      <Link
        href="/blog"
        className="font-mono text-sm text-foreground-dim transition-colors hover:text-accent"
      >
        {t("allPostsLink")}
      </Link>
      <h1 className="mt-6 font-serif text-3xl tracking-tightest text-foreground sm:text-4xl">
        {t("taggedPre")} <span className="text-accent">#{decoded}</span>
      </h1>

      {list.posts.length === 0 ? (
        <p className="mt-12 font-mono text-sm text-foreground-faint">
          {t("noTagPosts")}
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
