import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiGet } from "@/lib/api";
import type { PostList } from "@/lib/types";
import { PostCard } from "@/components/blog/post-card";

// Homepage is static, rebuilt on deploy; the latest posts tolerate a short
// revalidation window.
export const revalidate = 60;

async function getLatestPosts() {
  try {
    const list = await apiGet<PostList>("/api/posts?limit=3");
    return list.posts;
  } catch {
    return [];
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const posts = await getLatestPosts();

  return (
    <div className="wrap">
      {/* Hero */}
      <section className="relative pt-14 pb-14 sm:pt-24 lg:pt-32 sm:pb-16">
        <p className="kicker animate-fade-up">
          {t("kickerRole")}{" "}
          <span className="text-foreground-faint">{t("kickerStack")}</span>
        </p>
        <h1
          className="mt-5 max-w-3xl font-serif text-[2.6rem] leading-[1.05] tracking-tightest text-foreground animate-fade-up sm:mt-6 sm:text-6xl sm:leading-[1.02] lg:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          {t("headlinePre")}{" "}
          <em className="italic text-accent">{t("headlineAccent")}</em>{" "}
          {t("headlinePost")}
        </h1>
        <p
          className="mt-6 max-w-xl text-base leading-relaxed text-foreground-dim animate-fade-up sm:mt-8 sm:text-lg"
          style={{ animationDelay: "160ms" }}
        >
          {t("intro")}
        </p>

        <div
          className="mt-8 flex flex-col gap-3 animate-fade-up sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
          style={{ animationDelay: "240ms" }}
        >
          <Link
            href="/blog"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 font-mono text-sm text-background transition-transform hover:-translate-y-0.5 sm:py-3"
          >
            {t("ctaReadLog")}
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3.5 font-mono text-sm text-foreground transition-colors hover:border-foreground-faint sm:py-3"
          >
            {t("ctaSeeWork")}
          </Link>
        </div>
      </section>

      {/* "Currently working on" widget — the body is a translated UI string
          (rather than the DB value) so it switches with the language. */}
      <section
        className="relative my-8 animate-fade-up"
        style={{ animationDelay: "320ms" }}
      >
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
              <span className="ml-2 font-mono text-xs text-foreground-faint">
                {t("nowLabel")}
              </span>
            </div>
            <div className="px-5 py-5 font-mono text-sm leading-relaxed text-foreground">
              <span className="text-highlight">➜</span>{" "}
              <span className="text-foreground-dim">{t("nowBody")}</span>
              <span className="animate-blink ml-1 text-accent">▊</span>
            </div>
          </div>
      </section>

      {/* Latest posts */}
      <section className="mt-14 sm:mt-20">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-2xl tracking-tight text-foreground">
            {t("latestTitle")}
          </h2>
          <Link
            href="/blog"
            className="font-mono text-sm text-foreground-dim transition-colors hover:text-accent"
          >
            {t("allPosts")}
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="mt-8 font-mono text-sm text-foreground-faint">
            {t("noPosts")}
          </p>
        ) : (
          <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-1">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
