import type { Metadata } from "next";
import { apiGet } from "@/lib/api";
import type { Project } from "@/lib/types";

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

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="wrap pt-20">
      <header className="max-w-2xl">
        <p className="kicker">selected work</p>
        <h1 className="mt-4 font-serif text-5xl tracking-tightest text-paper">
          Things I&apos;ve built
        </h1>
        <p className="mt-4 text-lg text-paper-dim">
          A few projects worth showing. The full case studies live behind the{" "}
          <a href="/request-access" className="text-amber underline underline-offset-4">
            private profile
          </a>
          .
        </p>
      </header>

      {projects.length === 0 ? (
        <p className="mt-16 font-mono text-sm text-paper-faint">
          No projects listed yet.
        </p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {projects.map((p, i) => (
            <article
              key={p.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-ink-line bg-ink-soft p-6 transition-colors hover:border-paper-faint/50"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs text-paper-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {p.featured && (
                  <span className="rounded border border-amber/40 bg-amber/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber">
                    featured
                  </span>
                )}
              </div>

              <h2 className="mt-4 font-serif text-2xl tracking-tight text-paper transition-colors group-hover:text-amber">
                {p.title}
              </h2>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-paper-dim">
                {p.description}
              </p>

              {p.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-ink-line px-2.5 py-0.5 font-mono text-[11px] text-paper-faint"
                    >
                      {t}
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
                    className="text-amber transition-colors hover:text-amber-soft"
                  >
                    live ↗
                  </a>
                )}
                {p.url_repo && (
                  <a
                    href={p.url_repo}
                    target="_blank"
                    rel="noreferrer"
                    className="text-paper-dim transition-colors hover:text-paper"
                  >
                    code ↗
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
