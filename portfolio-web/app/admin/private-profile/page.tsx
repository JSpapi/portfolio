"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { PrivateProfile, Reference } from "@/lib/types";
import { MediaUploader } from "@/components/admin/media-uploader";

export default function PrivateProfileAdminPage() {
  const [cv, setCv] = useState("");
  const [projects, setProjects] = useState("");
  const [contact, setContact] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [refs, setRefs] = useState<Reference[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    api.get<PrivateProfile>("/api/admin/private-profile").then((p) => {
      setCv(p.cv_markdown);
      setProjects(p.projects_markdown);
      setContact(p.contact_markdown);
      setResumeUrl(p.resume_url ?? "");
      setRefs(Array.isArray(p.references) ? p.references : []);
      setLoaded(true);
    });
  }, []);

  async function save() {
    setSaving(true);
    setNote("");
    try {
      await api.put("/api/admin/private-profile", {
        cv_markdown: cv,
        projects_markdown: projects,
        contact_markdown: contact,
        resume_url: resumeUrl.trim() || null,
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
    return <p className="font-mono text-sm text-paper-faint">loading…</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl tracking-tight text-paper">
          Private profile
        </h1>
        <div className="flex items-center gap-4">
          {note && (
            <span className="font-mono text-sm text-moss">{note}</span>
          )}
          <button
            disabled={saving}
            onClick={save}
            className="rounded-full bg-amber px-6 py-2.5 font-mono text-sm text-ink disabled:opacity-50"
          >
            {saving ? "saving…" : "save"}
          </button>
        </div>
      </div>
      <p className="mt-2 text-paper-dim">
        This is the gated content shown on <code className="text-amber">/private</code>.
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

      <Block label="Resume PDF">
        <input
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
          placeholder="https://…/resume.pdf (or upload below)"
          className="w-full rounded-lg border border-ink-line bg-ink px-3 py-2 font-mono text-sm text-paper placeholder:text-paper-faint focus:border-amber focus:outline-none"
        />
        <div className="mt-3">
          <MediaUploader
            slug="private/resume"
            onInsert={(snippet) => {
              // Extract the URL from the generated markdown/HTML snippet.
              const m = /\((https?:[^)]+)\)|src="([^"]+)"/.exec(snippet);
              const url = m?.[1] || m?.[2];
              if (url) setResumeUrl(url);
            }}
          />
          <p className="mt-1 font-mono text-[11px] text-paper-faint">
            Note: PDFs upload only if the API accepts application/pdf; otherwise
            paste a URL above.
          </p>
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
                className="rounded border border-ink-line px-3 font-mono text-xs text-[#ff6b6b]"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setRefs([...refs, { name: "", relation: "", contact: "" }])
            }
            className="rounded border border-ink-line px-4 py-2 font-mono text-xs text-paper-dim hover:text-paper"
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
      <div className="mb-3 font-mono text-xs uppercase tracking-wider text-paper-faint">
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
      className="w-full resize-y rounded-lg border border-ink-line bg-ink-soft px-4 py-3 font-mono text-sm leading-relaxed text-paper focus:border-amber focus:outline-none"
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
      className="rounded border border-ink-line bg-ink px-3 py-2 font-mono text-xs text-paper placeholder:text-paper-faint focus:border-amber focus:outline-none"
    />
  );
}
