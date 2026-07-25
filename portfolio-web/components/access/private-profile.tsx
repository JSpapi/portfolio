import { MDRenderer } from "@/components/blog/md-renderer";
import type { PrivateProfile } from "@/lib/types";

export function PrivateProfileView({ profile }: { profile: PrivateProfile }) {
  const refs = Array.isArray(profile.references) ? profile.references : [];

  return (
    <div className="wrap max-w-3xl py-10 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-ink-line pb-5 sm:pb-6">
        <p className="kicker">private profile · confidential</p>
        <form action="/api/private/logout" method="post">
          <LogoutButton />
        </form>
      </div>

      {profile.resume_url && (
        <a
          href={profile.resume_url}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-5 py-3 font-mono text-sm text-amber transition-colors hover:bg-amber hover:text-ink sm:w-auto sm:py-2.5"
        >
          ↓ download resume (pdf)
        </a>
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
                className="rounded-lg border border-ink-line bg-ink-soft p-4"
              >
                <div className="font-serif text-lg text-paper">{r.name}</div>
                <div className="font-mono text-xs text-paper-faint">
                  {r.relation}
                </div>
                <div className="mt-2 font-mono text-sm text-amber">
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
      <h2 className="mb-5 font-mono text-sm uppercase tracking-[0.2em] text-paper-faint sm:mb-6">
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
      className="font-mono text-xs text-paper-dim transition-colors hover:text-amber"
    >
      end session ↗
    </button>
  );
}
