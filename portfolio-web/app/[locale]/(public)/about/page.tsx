import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "About",
  description: "Who I am, what I work with, and how I got here.",
};

const skills: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["TypeScript", "JavaScript", "PHP", "Go", "SQL", "Dart"] },
  {
    group: "Backend",
    items: ["Node.js", "Express", "Yii2", "Gin", "REST", "gRPC"],
  },
  { group: "Frontend", items: ["Vue", "Nuxt.js", "Next.js", "React"] },
  {
    group: "UI",
    items: ["PrimeVue", "Ant Design", "MUI", "shadcn/ui", "Tailwind"],
  },
  {
    group: "Maps & geo",
    items: ["Yandex Maps", "Google Maps", "MapLibre", "Nominatim", "ORS"],
  },
  { group: "Data", items: ["PostgreSQL", "Redis"] },
  { group: "Infra", items: ["Docker", "GCP", "Fly.io", "GitHub Actions"] },
  { group: "Mobile", items: ["Flutter", "Dart"] },
];

type TimelineEntry = { when: string; what: string; detail: string };

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const timeline = t.raw("timeline") as TimelineEntry[];
  return (
    <div className="wrap max-w-4xl pt-14 sm:pt-20">
      <p className="kicker">{t("kicker")}</p>
      <h1 className="mt-4 max-w-3xl font-serif text-[2.4rem] leading-[1.08] tracking-tightest text-foreground sm:text-5xl sm:leading-[1.05] lg:text-6xl">
        {t("title")}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground-dim sm:text-lg">
        {t("intro")}
      </p>

      {/* Skills */}
      <section className="mt-14 sm:mt-20">
        <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-foreground-faint">
          {t("stackHeading")}
        </h2>
        <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          {skills.map((s) => (
            <div key={s.group} className="bg-surface p-6">
              <h3 className="font-serif text-lg text-accent">{s.group}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {s.items.map((i) => (
                  <span
                    key={i}
                    className="rounded-md border border-border px-2.5 py-1 font-mono text-xs text-foreground-dim"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="mt-20">
        <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-foreground-faint">
          {t("trajectoryHeading")}
        </h2>
        <ol className="mt-6 space-y-0">
          {timeline.map((entry, i) => (
            <li
              key={i}
              className="relative border-l border-border pb-10 pl-6 last:pb-0 sm:flex sm:gap-6 sm:pl-8"
            >
              <span className="absolute -left-[6px] top-1.5 h-3 w-3 rounded-full border-2 border-accent bg-background" />
              <div className="pt-0.5 font-mono text-xs uppercase tracking-wider text-accent sm:w-20 sm:shrink-0">
                {entry.when}
              </div>
              <div className="mt-1 sm:mt-0">
                <h3 className="font-serif text-lg text-foreground sm:text-xl">
                  {entry.what}
                </h3>
                <p className="mt-1 text-foreground-dim">{entry.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA to private profile */}
      <section className="mt-14 overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/[0.08] to-transparent p-6 sm:mt-20 sm:p-10">
        <p className="kicker">{t("ctaKicker")}</p>
        <h2 className="mt-3 font-serif text-2xl tracking-tight text-foreground sm:text-3xl">
          {t("ctaTitle")}
        </h2>
        <p className="mt-3 max-w-xl text-foreground-dim">{t("ctaBody")}</p>
        <Link
          href="/request-access"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 font-mono text-sm text-background transition-transform hover:-translate-y-0.5 sm:w-auto sm:py-3"
        >
          {t("ctaButton")}
        </Link>
      </section>
    </div>
  );
}
