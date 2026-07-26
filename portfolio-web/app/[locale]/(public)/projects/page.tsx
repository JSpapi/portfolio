import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { apiGet } from "@/lib/api";
import { pickLocalized, type Project } from "@/lib/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Work",
  description: "Selected projects — what they do, how they're built.",
};

async function getProjects(): Promise<Project[]> {
  try {
    const r = await apiGet<{ projects: Project[] }>("/api/projects", {
      next: { revalidate: 300 },
    });
    return r.projects;
  } catch {
    return [];
  }
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("projects");
  const projects = await getProjects();

  return (
    <div className="wrap pt-14 sm:pt-20">
      <header className="max-w-2xl">
        <p className="kicker">{t("kicker")}</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tightest text-foreground sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-base text-foreground-dim sm:text-lg">
          {t("subtitlePre")}{" "}
          <a href="/request-access" className="text-accent underline underline-offset-4">
            {t("subtitleLink")}
          </a>
          .
        </p>
      </header>

      {projects.length === 0 ? (
        <p className="mt-16 font-mono text-sm text-foreground-faint">
          {t("none")}
        </p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {projects.map((p, i) => (
            <article
              key={p.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface p-6 transition-colors hover:border-foreground-faint/50"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs text-foreground-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {p.featured && (
                  <span className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                    {t("featured")}
                  </span>
                )}
              </div>

              <h2 className="mt-4 font-serif text-2xl tracking-tight text-foreground transition-colors group-hover:text-accent">
                {pickLocalized(p.title, locale)}
              </h2>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-foreground-dim">
                {pickLocalized(p.description, locale)}
              </p>

              {p.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-foreground-faint"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 flex items-center gap-4 font-mono text-sm">
                {p.url_live && (
                  <a
                    href={p.url_live}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent transition-colors hover:text-accent-soft"
                  >
                    {t("live")}
                  </a>
                )}
                {p.url_repo && (
                  <a
                    href={p.url_repo}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground-dim transition-colors hover:text-foreground"
                  >
                    {t("code")}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
