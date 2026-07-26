import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PostSummary } from "@/lib/types";
import { TypeBadge } from "./type-badge";

const dateLocale: Record<string, string> = {
  ru: "ru-RU",
  en: "en-US",
  uz: "uz-UZ",
};

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "draft";
  return new Date(iso).toLocaleDateString(dateLocale[locale] ?? "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PostCard({ post }: { post: PostSummary }) {
  const t = useTranslations("blog");
  const locale = useLocale();
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-surface px-6 py-6 transition-colors hover:bg-raised sm:px-8"
    >
      <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-foreground-faint">
        <TypeBadge type={post.type} />
        <span>{formatDate(post.published_at, locale)}</span>
        <span className="text-border">/</span>
        <span>{t("min", { minutes: post.reading_time })}</span>
      </div>

      <h3 className="mt-3 font-serif text-2xl leading-snug tracking-tight text-foreground transition-colors group-hover:text-accent">
        {post.title}
      </h3>

      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-foreground-dim">
        {post.summary}
      </p>

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-foreground-faint"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
