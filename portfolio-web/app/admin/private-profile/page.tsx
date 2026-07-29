"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { PrivateProfile, Reference } from "@/lib/types";
import { MediaUploader } from "@/components/admin/media-uploader";

const RESUME_LANGS = ["en", "ru", "uz"] as const;
type ResumeLang = (typeof RESUME_LANGS)[number];
const emptyResumes: Record<ResumeLang, string> = { en: "", ru: "", uz: "" };

export default function PrivateProfileAdminPage() {
  const [cv, setCv] = useState("");
  const [projects, setProjects] = useState("");
  const [contact, setContact] = useState("");
  const [resumes, setResumes] =
    useState<Record<ResumeLang, string>>(emptyResumes);
  const [refs, setRefs] = useState<Reference[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    api.get<PrivateProfile>("/api/admin/private-profile").then((p) => {
      setCv(p.cv_markdown);
      setProjects(p.projects_markdown);
      setContact(p.contact_markdown);
      // resume_url is localized ({en,ru,uz}); legacy rows may be a bare string.
      const r = { ...emptyResumes };
      if (typeof p.resume_url === "string") r.en = p.resume_url;
      else if (p.resume_url)
        for (const l of RESUME_LANGS) r[l] = p.resume_url[l] ?? "";
      setResumes(r);
      setRefs(Array.isArray(p.references) ? p.references : []);
      setLoaded(true);
    });
  }, []);

  async function save() {
    setSaving(true);
    setNote("");
    try {
      const resumeOut: Partial<Record<ResumeLang, string>> = {};
      for (const l of RESUME_LANGS) {
        const v = resumes[l].trim();
        if (v) resumeOut[l] = v;
      }
      await api.put("/api/admin/private-profile", {
        cv_markdown: cv,
        projects_markdown: projects,
        contact_markdown: contact,
        resume_url: resumeOut,
        references: refs.filter((r) => r.name.trim()),
      });
      setNote("✓ saved");
    } catch (e) {
      setNote(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded)
    return <p className="font-mono text-sm text-foreground-faint">loading…</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl tracking-tight text-foreground">
          Private profile
        </h1>
        <div className="flex items-center gap-4">
          {note && (
            <span className="font-mono text-sm text-highlight">{note}</span>
          )}
          <button
            disabled={saving}
            onClick={save}
            className="rounded-full bg-accent px-6 py-2.5 font-mono text-sm text-background disabled:opacity-50"
          >
            {saving ? "saving…" : "save"}
          </button>
        </div>
      </div>
      <p className="mt-2 text-foreground-dim">
        This is the gated content shown on <code className="text-accent">/private</code>.
        Markdown supported.
      </p>

      <Block label="Career / CV (markdown)">
        <Area v={cv} set={setCv} rows={12} />
      </Block>

      <Block label="Project deep-dives (markdown)">
        <Area v={projects} set={setProjects} rows={12} />
      </Block>

      <Block label="Contact & availability (markdown)">
        <Area v={contact} set={setContact} rows={6} />
      </Block>

      <Block label="Resume PDFs (per language)">
        <p className="mb-4 font-mono text-[11px] leading-relaxed text-foreground-faint">
          Visitors get the resume matching their site language; English is the
          fallback, and the other languages show as secondary links. Upload a
          PDF (max 20MB) into each slot, or paste a URL.
        </p>
        <div className="space-y-5">
          {RESUME_LANGS.map((l) => (
            <div key={l}>
              <div className="mb-1.5 font-mono text-xs uppercase tracking-wider text-accent">
                {l}
              </div>
              <input
                value={resumes[l]}
                onChange={(e) =>
                  setResumes((r) => ({ ...r, [l]: e.target.value }))
                }
                placeholder={`https://…/resume-${l}.pdf (or upload below)`}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground-faint focus:border-accent focus:outline-none"
              />
              <div className="mt-2">
                <MediaUploader
                  slug="private/resume"
                  accept="application/pdf"
                  onInsert={(snippet) => {
                    // Extract the URL from the generated markdown/HTML snippet.
                    const m = /\((https?:[^)]+)\)|src="([^"]+)"/.exec(snippet);
                    const url = m?.[1] || m?.[2];
                    if (url) setResumes((r) => ({ ...r, [l]: url }));
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block label="References">
        <div className="space-y-3">
          {refs.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
              <RefInp
                v={r.name}
                set={(v) => updateRef(i, { ...r, name: v })}
                ph="name"
              />
              <RefInp
                v={r.relation}
                set={(v) => updateRef(i, { ...r, relation: v })}
                ph="relation"
              />
              <RefInp
                v={r.contact}
                set={(v) => updateRef(i, { ...r, contact: v })}
                ph="contact"
              />
              <button
                onClick={() => setRefs(refs.filter((_, j) => j !== i))}
                className="rounded border border-border px-3 font-mono text-xs text-[#ff6b6b]"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setRefs([...refs, { name: "", relation: "", contact: "" }])
            }
            className="rounded border border-border px-4 py-2 font-mono text-xs text-foreground-dim hover:text-foreground"
          >
            + add reference
          </button>
        </div>
      </Block>
    </div>
  );

  function updateRef(i: number, r: Reference) {
    setRefs(refs.map((x, j) => (j === i ? r : x)));
  }
}

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 font-mono text-xs uppercase tracking-wider text-foreground-faint">
        {label}
      </div>
      {children}
    </section>
  );
}

function Area({
  v,
  set,
  rows,
}: {
  v: string;
  set: (v: string) => void;
  rows: number;
}) {
  return (
    <textarea
      value={v}
      onChange={(e) => set(e.target.value)}
      rows={rows}
      className="w-full resize-y rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground focus:border-accent focus:outline-none"
    />
  );
}

function RefInp({
  v,
  set,
  ph,
}: {
  v: string;
  set: (v: string) => void;
  ph: string;
}) {
  return (
    <input
      value={v}
      onChange={(e) => set(e.target.value)}
      placeholder={ph}
      className="rounded border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-foreground-faint focus:border-accent focus:outline-none"
    />
  );
}
