import { MDRenderer } from "@/components/blog/md-renderer";
import type { LocalizedField, PrivateProfile } from "@/lib/types";

// Resume button/link labels per language. The private page UI itself is
// English-only by design; only the resume artifact is language-aware.
const RESUME_LABELS: Record<string, { button: string; short: string }> = {
  en: { button: "↓ download resume (pdf) — english", short: "english" },
  ru: { button: "↓ скачать резюме (pdf) — русский", short: "русский" },
  uz: { button: "↓ rezyumeni yuklab olish (pdf) — o'zbekcha", short: "o'zbekcha" },
};
const RESUME_ORDER = ["en", "ru", "uz"] as const;

/** Normalize the wire value (object | legacy string | null) to lang → url. */
function resumeMap(value: LocalizedField): Partial<Record<string, string>> {
  if (!value) return {};
  if (typeof value === "string") return { en: value };
  return value;
}

export function PrivateProfileView({
  profile,
  locale,
}: {
  profile: PrivateProfile;
  /** Visitor's site language from the NEXT_LOCALE cookie; "en" when unknown. */
  locale: string;
}) {
  const refs = Array.isArray(profile.references) ? profile.references : [];

  const resumes = resumeMap(profile.resume_url);
  const available = RESUME_ORDER.filter((l) => resumes[l]);
  // Main button: the visitor's language when we have that PDF, else English,
  // else whatever exists.
  const primary = available.includes(locale as (typeof RESUME_ORDER)[number])
    ? locale
    : available.includes("en")
    ? "en"
    : available[0];
  const others = available.filter((l) => l !== primary);

  return (
    <div className="wrap max-w-3xl py-10 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border pb-5 sm:pb-6">
        <p className="kicker">private profile · confidential</p>
        <form action="/api/private/logout" method="post">
          <LogoutButton />
        </form>
      </div>

      {primary && (
        <div className="mt-8">
          <a
            href={resumes[primary]}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-5 py-3 font-mono text-sm text-accent transition-colors hover:bg-accent hover:text-background sm:w-auto sm:py-2.5"
          >
            {RESUME_LABELS[primary]?.button ?? "↓ download resume (pdf)"}
          </a>
          {others.length > 0 && (
            <p className="mt-3 font-mono text-xs text-foreground-faint">
              also available:{" "}
              {others.map((l, i) => (
                <span key={l}>
                  {i > 0 && " · "}
                  <a
                    href={resumes[l]}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground-dim underline underline-offset-4 transition-colors hover:text-accent"
                  >
                    {RESUME_LABELS[l]?.short ?? l}
                  </a>
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      <Section title="Career">
        <MDRenderer body={profile.cv_markdown || "_Not filled in yet._"} />
      </Section>

      <Section title="Project deep-dives">
        <MDRenderer
          body={profile.projects_markdown || "_Not filled in yet._"}
        />
      </Section>

      <Section title="Contact & availability">
        <MDRenderer body={profile.contact_markdown || "_Not filled in yet._"} />
      </Section>

      {refs.length > 0 && (
        <Section title="References">
          <ul className="grid gap-4 sm:grid-cols-2">
            {refs.map((r, i) => (
              <li
                key={i}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <div className="font-serif text-lg text-foreground">{r.name}</div>
                <div className="font-mono text-xs text-foreground-faint">
                  {r.relation}
                </div>
                <div className="mt-2 font-mono text-sm text-accent">
                  {r.contact}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
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
    <section className="mt-12 sm:mt-14">
      <h2 className="mb-5 font-mono text-sm uppercase tracking-[0.2em] text-foreground-faint sm:mb-6">
        // {title}
      </h2>
      {children}
    </section>
  );
}

// A plain form submit button; logout posts to the API which clears the cookie.
function LogoutButton() {
  return (
    <button
      type="submit"
      className="font-mono text-xs text-foreground-dim transition-colors hover:text-accent"
    >
      end session ↗
    </button>
  );
}
