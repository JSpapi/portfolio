import Link from "next/link";
import type { Metadata } from "next";

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
  { group: "Infra", items: ["Docker", "Fly.io", "GitHub Actions"] },
  { group: "Mobile", items: ["Flutter", "Dart"] },
];

const timeline: { when: string; what: string; detail: string }[] = [
  {
    when: "now",
    what: "Full-stack Engineer · Gross Insurance",
    detail:
      "On the tech team of one of Uzbekistan's top insurers, shipping end-to-end features on the gross.uz web app and its customer cabinet — Vue 3 + Nuxt + PrimeVue on the front, PHP/Yii2 + PostgreSQL on the back.",
  },
  {
    when: "~3 yrs",
    what: "Full-stack Engineer · Primex",
    detail:
      "Built the Logitex ELD fleet-compliance platform from zero — dashboard, landing, and backend. Lead frontend on the dashboard (#1 contributor); built the Node.js/Express email-document and integration services.",
  },
  {
    when: "focus",
    what: "Maps, real-time & full-stack",
    detail:
      "TypeScript everywhere — Node.js/Express services and Vue/Nuxt & React/Next front-ends; also ship in PHP/Yii2 and Go. Live tracking, ORS routing, Nominatim geocoding, geofencing; a bit of Flutter/Dart on mobile.",
  },
];

export default function AboutPage() {
  return (
    <div className="wrap max-w-4xl pt-14 sm:pt-20">
      <p className="kicker">the short version</p>
      <h1 className="mt-4 max-w-3xl font-serif text-[2.4rem] leading-[1.08] tracking-tightest text-paper sm:text-5xl sm:leading-[1.05] lg:text-6xl">
        Engineer who cares about the parts nobody sees.
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-paper-dim sm:text-lg">
        I&apos;m a full-stack engineer who lives in TypeScript — <span className="text-paper">Node.js
        / Express</span> services on the back and Vue/Nuxt or React/Next on the
        front — and also ships real product in PHP/Yii2 and Go. Today I&apos;m
        on the tech team at <span className="text-paper">Gross</span>, one of
        Uzbekistan&apos;s leading insurers, shipping features across their
        gross.uz web app. Before that I spent ~3 years building an ELD
        fleet-compliance platform from the ground up — the dashboards fleets
        live in, plus the Node.js services behind them. I&apos;m happiest deep
        in maps, real-time data, and code that reads like it was meant to be
        read. I write here to keep an honest record of the work — the wins and
        the stuff that took three tries.
      </p>

      {/* Skills */}
      <section className="mt-14 sm:mt-20">
        <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-paper-faint">
          // stack
        </h2>
        <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-ink-line bg-ink-line sm:grid-cols-2">
          {skills.map((s) => (
            <div key={s.group} className="bg-ink-soft p-6">
              <h3 className="font-serif text-lg text-amber">{s.group}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {s.items.map((i) => (
                  <span
                    key={i}
                    className="rounded-md border border-ink-line px-2.5 py-1 font-mono text-xs text-paper-dim"
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
        <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-paper-faint">
          // trajectory
        </h2>
        <ol className="mt-6 space-y-0">
          {timeline.map((t, i) => (
            <li
              key={i}
              className="relative border-l border-ink-line pb-10 pl-6 last:pb-0 sm:flex sm:gap-6 sm:pl-8"
            >
              <span className="absolute -left-[6px] top-1.5 h-3 w-3 rounded-full border-2 border-amber bg-ink" />
              <div className="pt-0.5 font-mono text-xs uppercase tracking-wider text-amber sm:w-20 sm:shrink-0">
                {t.when}
              </div>
              <div className="mt-1 sm:mt-0">
                <h3 className="font-serif text-lg text-paper sm:text-xl">
                  {t.what}
                </h3>
                <p className="mt-1 text-paper-dim">{t.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA to private profile */}
      <section className="mt-14 overflow-hidden rounded-2xl border border-amber/30 bg-gradient-to-br from-amber/[0.08] to-transparent p-6 sm:mt-20 sm:p-10">
        <p className="kicker">for recruiters &amp; close contacts</p>
        <h2 className="mt-3 font-serif text-2xl tracking-tight text-paper sm:text-3xl">
          Want the detailed version?
        </h2>
        <p className="mt-3 max-w-xl text-paper-dim">
          My full CV, deep project breakdowns, availability, and references live
          on a private page. Request access — I approve every request
          personally.
        </p>
        <Link
          href="/request-access"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3.5 font-mono text-sm text-ink transition-transform hover:-translate-y-0.5 sm:w-auto sm:py-3"
        >
          request access →
        </Link>
      </section>
    </div>
  );
}
