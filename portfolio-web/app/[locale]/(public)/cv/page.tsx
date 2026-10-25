import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import {
  CV_LANG_NAMES,
  CV_LANGS,
  cvContact,
  getCv,
  resumePdf,
} from "@/content/cv";
import type { CvJob } from "@/content/cv";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { labels } = getCv(locale);
  return { title: labels.metaTitle, description: labels.metaDescription };
}

/** Pull the video id out of a watch, youtu.be, shorts or embed URL. */
function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

const linkClass =
  "underline decoration-border underline-offset-4 transition-colors hover:text-accent hover:decoration-accent";

export default async function CvPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const cv = getCv(locale);
  const l = cv.labels;
  const videoId = youtubeId(cvContact.videoUrl);
  const lang = CV_LANGS.find((x) => x === locale) ?? "en";
  const otherLangs = CV_LANGS.filter((x) => x !== lang);

  return (
    <div className="wrap max-w-3xl pt-14 sm:pt-20">
      <header className="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
        <div>
          <p className="kicker">{l.kicker}</p>
          <h1 className="mt-4 font-serif text-4xl leading-[1.08] tracking-tightest text-foreground sm:text-5xl">
            {cvContact.name}
          </h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground-faint">
            {cv.role}
          </p>
          <p className="mt-2 text-accent">{cvContact.headline}</p>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-foreground-dim">
            <li>{cv.location}</li>
            <li>
              <a href={`mailto:${cvContact.email}`} className={linkClass}>
                {cvContact.email}
              </a>
            </li>
            <li>
              <a href={cvContact.linkedin} target="_blank" rel="noopener noreferrer" className={linkClass}>
                LinkedIn
              </a>
            </li>
            <li>
              <a href={cvContact.github} target="_blank" rel="noopener noreferrer" className={linkClass}>
                GitHub
              </a>
            </li>
          </ul>
        </div>
        <Image
          src="/avatar.jpg"
          alt={cvContact.name}
          width={320}
          height={320}
          priority
          sizes="(min-width: 640px) 112px, 88px"
          className="h-[88px] w-[88px] shrink-0 rounded-full object-cover ring-1 ring-border sm:h-28 sm:w-28"
        />
      </header>

      <div className="mt-8">
        <a
          href={resumePdf(lang)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 font-mono text-sm text-background transition-transform hover:-translate-y-0.5 sm:w-auto sm:py-3"
        >
          ↓ {l.download}
        </a>
        <p className="mt-3 font-mono text-xs text-foreground-faint">
          {l.alsoIn}:{" "}
          {otherLangs.map((x, i) => (
            <span key={x}>
              {i > 0 && " · "}
              <a
                href={resumePdf(x)}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-foreground-dim ${linkClass}`}
              >
                {CV_LANG_NAMES[x]}
              </a>
            </span>
          ))}
        </p>
      </div>

      {videoId && (
        <Section title={l.video}>
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-surface">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title={l.video}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              className="h-full w-full"
            />
          </div>
        </Section>
      )}

      <Section title={l.profile}>
        <div className="space-y-4 text-base leading-relaxed text-foreground-dim">
          {cv.summary.map((p, i) => (
            <p key={i}>
              <Rich text={p} />
            </p>
          ))}
          <p>{cv.domainsIntro}</p>
          <Bullets
            items={cv.domains.map((d) => `**${d.name}** — ${d.text}`)}
          />
          <p>
            <Rich text={cv.summaryOutro} />
          </p>
        </div>
      </Section>

      <Section title={l.help}>
        <ul className="grid gap-x-8 gap-y-2 text-[15px] text-foreground-dim sm:grid-cols-2">
          {cv.help.map((h) => (
            <li key={h} className="flex gap-3">
              <Dot />
              {h}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={l.skills}>
        <Rows rows={cv.skills.map((s) => ({ label: s.group, text: s.items }))} />
      </Section>

      <Section title={l.experience}>
        <div className="space-y-10">
          {cv.jobs.map((job) => (
            <Job key={job.company} job={job} keyWork={l.keyWork} stack={l.stack} />
          ))}
        </div>
      </Section>

      <Section title={l.projects}>
        <div className="space-y-6">
          {cv.projects.map((p) => (
            <article
              key={p.name}
              className="rounded-xl border border-border bg-surface p-5 sm:p-6"
            >
              <h3 className="font-serif text-xl text-foreground">{p.name}</h3>
              <p className="mt-1 font-mono text-xs text-foreground-faint">
                {p.role}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground-dim">
                {p.intro}
              </p>
              <div className="mt-4">
                <Rows rows={p.rows} bare />
              </div>
              {p.note && (
                <p className="mt-4 text-[15px] leading-relaxed text-foreground-dim">
                  <span className="font-medium text-foreground">
                    {p.note.label}
                  </span>{" "}
                  <em>{p.note.text}</em>
                </p>
              )}
              {p.stack && <Stack label={l.stack} text={p.stack} />}
            </article>
          ))}
        </div>
      </Section>

      <Section title={l.additional}>
        {cv.extra.map((job) => (
          <Job key={job.company} job={job} keyWork={l.keyWork} stack={l.stack} />
        ))}
      </Section>

      <Section title={l.languages}>
        <ul className="flex flex-wrap gap-x-8 gap-y-2 text-[15px] text-foreground-dim">
          {cv.languages.map((x) => (
            <li key={x.name}>
              <span className="text-foreground">{x.name}</span> — {x.level}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={l.contact}>
        <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/[0.08] to-transparent p-6 sm:p-8">
          <p className="text-foreground-dim">{l.contactBody}</p>
          <a
            href={`mailto:${cvContact.email}`}
            className="mt-4 inline-block font-serif text-xl text-foreground transition-colors hover:text-accent sm:text-2xl"
          >
            {cvContact.email}
          </a>
          <p className="mt-4 flex gap-5 font-mono text-xs text-foreground-dim">
            <a href={cvContact.linkedin} target="_blank" rel="noopener noreferrer" className={linkClass}>
              LinkedIn ↗
            </a>
            <a href={cvContact.github} target="_blank" rel="noopener noreferrer" className={linkClass}>
              GitHub ↗
            </a>
          </p>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 sm:mt-16">
      <h2 className="mb-5 font-mono text-sm uppercase tracking-[0.2em] text-foreground-faint sm:mb-6">
        // {title}
      </h2>
      {children}
    </section>
  );
}

function Job({
  job,
  keyWork,
  stack,
}: {
  job: CvJob;
  keyWork: string;
  stack: string;
}) {
  return (
    <article>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <h3 className="font-serif text-xl text-foreground">
          {job.title} <span className="text-accent">— {job.company}</span>
        </h3>
        <p className="shrink-0 font-mono text-xs text-foreground-faint">
          {job.dates} · {job.place}
        </p>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-foreground-dim">
        <Rich text={job.intro} />
      </p>
      {job.work && (
        <>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground-faint">
            {keyWork}
          </p>
          <div className="mt-3">
            <Bullets items={job.work} />
          </div>
        </>
      )}
      {job.stack && <Stack label={stack} text={job.stack} />}
    </article>
  );
}

function Rows({
  rows,
  bare = false,
}: {
  rows: { label: string; text: string }[];
  bare?: boolean;
}) {
  return (
    <dl
      className={
        bare
          ? "divide-y divide-border border-y border-border"
          : "divide-y divide-border rounded-xl border border-border bg-surface"
      }
    >
      {rows.map((r) => (
        <div
          key={r.label}
          className={`grid gap-1 sm:grid-cols-[12rem_1fr] sm:gap-4 ${bare ? "py-3" : "p-4"}`}
        >
          <dt className="font-mono text-xs uppercase leading-relaxed tracking-wider text-accent">
            {r.label}
          </dt>
          <dd className="text-sm leading-relaxed text-foreground-dim">
            {r.text}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-[15px] leading-relaxed text-foreground-dim">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <Dot />
          <span>
            <Rich text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Stack({ label, text }: { label: string; text: string }) {
  return (
    <p className="mt-5 text-sm leading-relaxed text-foreground-faint">
      <span className="font-mono text-foreground-dim">{label}:</span> {text}
    </p>
  );
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70"
    />
  );
}

/** Renders **bold** parts of a CV string. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, i) =>
        i % 2 ? (
          <strong key={i} className="font-medium text-foreground">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
}
