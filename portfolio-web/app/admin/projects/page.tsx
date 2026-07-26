"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  pickLocalized,
  type Localized,
  type LocalizedField,
  type Project,
} from "@/lib/types";
import type { Locale } from "@/i18n/routing";

type Lang = Locale;

// Authoring order (English first) differs from the URL locale order in
// routing.ts on purpose. `LANGS` is the only literal here; the assertion below
// pins it to `Locale`, so an invalid OR missing locale is a compile error —
// keeping routing.ts the single source of truth without a second hardcoded list.
const LANGS = ["en", "ru", "uz"] as const;
// Fails to compile unless LANGS lists every Locale exactly (no extras, none missing).
type _AssertLangsMatchLocale =
  [Lang] extends [(typeof LANGS)[number]]
    ? [(typeof LANGS)[number]] extends [Lang]
      ? true
      : ["LANGS has a value that is not a Locale"]
    : ["LANGS is missing a Locale"];
const _langsCoverAllLocales: _AssertLangsMatchLocale = true;
void _langsCoverAllLocales;

type Draft = {
  slug: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  tags: string;
  url_live: string;
  url_repo: string;
  featured: boolean;
};

const emptyLoc: Record<Lang, string> = { en: "", ru: "", uz: "" };

const empty: Draft = {
  slug: "",
  title: { ...emptyLoc },
  description: { ...emptyLoc },
  tags: "",
  url_live: "",
  url_repo: "",
  featured: false,
};

function locToObj(v: Record<Lang, string>): Localized {
  const o: Localized = {};
  for (const l of LANGS) {
    const t = v[l].trim();
    if (t) o[l] = t;
  }
  return o;
}

function objToLoc(v: LocalizedField): Record<Lang, string> {
  const o: Record<Lang, string> = { ...emptyLoc };
  if (typeof v === "string") {
    o.en = v;
  } else if (v) {
    for (const l of LANGS) o[l] = v[l] ?? "";
  }
  return o;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [draft, setDraft] = useState<Draft>(empty);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [formLang, setFormLang] = useState<Lang>("en");
  const [error, setError] = useState("");

  async function load() {
    const r = await api.get<{ projects: Project[] }>("/api/projects");
    setProjects(r.projects);
  }
  useEffect(() => {
    load();
  }, []);

  function toPayload(d: Draft) {
    return {
      slug: d.slug.trim(),
      title: locToObj(d.title),
      description: locToObj(d.description),
      tags: d.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      url_live: d.url_live.trim() || null,
      url_repo: d.url_repo.trim() || null,
      featured: d.featured,
      sort_order: 0,
    };
  }

  async function submit() {
    setError("");
    try {
      if (editingSlug) {
        await api.put(`/api/admin/projects/${editingSlug}`, toPayload(draft));
      } else {
        await api.post("/api/admin/projects", toPayload(draft));
      }
      setDraft(empty);
      setEditingSlug(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Save failed");
    }
  }

  function edit(p: Project) {
    setEditingSlug(p.slug);
    setDraft({
      slug: p.slug,
      title: objToLoc(p.title),
      description: objToLoc(p.description),
      tags: p.tags.join(", "),
      url_live: p.url_live ?? "",
      url_repo: p.url_repo ?? "",
      featured: p.featured,
    });
  }

  async function del(slug: string) {
    if (!confirm(`Delete project "${slug}"?`)) return;
    await api.del(`/api/admin/projects/${slug}`);
    await load();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="font-serif text-3xl tracking-tight text-foreground">
          Projects
        </h1>
        <div className="mt-6 space-y-3">
          {projects.length === 0 && (
            <p className="font-mono text-sm text-foreground-faint">
              No projects yet.
            </p>
          )}
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-serif text-lg text-foreground">
                    {pickLocalized(p.title, "en")}
                  </span>
                  {p.featured && (
                    <span className="rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-accent">
                      featured
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-foreground-faint">
                  {p.slug}
                </div>
              </div>
              <div className="flex gap-2 font-mono text-xs">
                <button
                  onClick={() => edit(p)}
                  className="rounded border border-border px-3 py-1.5 text-foreground-dim hover:text-foreground"
                >
                  edit
                </button>
                <button
                  onClick={() => del(p.slug)}
                  className="rounded border border-border px-3 py-1.5 text-[#ff6b6b] hover:bg-[#ff6b6b]/10"
                >
                  del
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-mono text-sm uppercase tracking-wider text-foreground-faint">
          {editingSlug ? `edit ${editingSlug}` : "new project"}
        </h2>
        <div className="mt-4 space-y-3">
          <Inp
            v={draft.slug}
            set={(v) => setDraft({ ...draft, slug: v })}
            ph="slug"
            disabled={!!editingSlug}
          />
          {/* Language tabs for title + description */}
          <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setFormLang(l)}
                className={`flex-1 rounded px-2 py-1 font-mono text-xs uppercase transition-colors ${
                  formLang === l
                    ? "bg-accent/15 text-accent"
                    : "text-foreground-faint hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <Inp
            v={draft.title[formLang]}
            set={(v) =>
              setDraft({
                ...draft,
                title: { ...draft.title, [formLang]: v },
              })
            }
            ph={`title (${formLang})`}
          />
          <textarea
            value={draft.description[formLang]}
            onChange={(e) =>
              setDraft({
                ...draft,
                description: { ...draft.description, [formLang]: e.target.value },
              })
            }
            placeholder={`description (${formLang})`}
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-faint focus:border-accent focus:outline-none"
          />
          <Inp
            v={draft.tags}
            set={(v) => setDraft({ ...draft, tags: v })}
            ph="tags, comma, separated"
          />
          <Inp
            v={draft.url_live}
            set={(v) => setDraft({ ...draft, url_live: v })}
            ph="https://live-url (optional)"
          />
          <Inp
            v={draft.url_repo}
            set={(v) => setDraft({ ...draft, url_repo: v })}
            ph="https://github.com/… (optional)"
          />
          <label className="flex items-center gap-2 font-mono text-xs text-foreground-dim">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(e) =>
                setDraft({ ...draft, featured: e.target.checked })
              }
              className="accent-accent"
            />
            featured
          </label>
        </div>

        {error && (
          <p className="mt-3 font-mono text-xs text-[#ff6b6b]">{error}</p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={submit}
            className="rounded-full bg-accent px-5 py-2 font-mono text-sm text-background"
          >
            {editingSlug ? "update" : "create"}
          </button>
          {editingSlug && (
            <button
              onClick={() => {
                setEditingSlug(null);
                setDraft(empty);
              }}
              className="rounded-full border border-border px-5 py-2 font-mono text-sm text-foreground-dim"
            >
              cancel
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

function Inp({
  v,
  set,
  ph,
  disabled,
}: {
  v: string;
  set: (v: string) => void;
  ph: string;
  disabled?: boolean;
}) {
  return (
    <input
      value={v}
      disabled={disabled}
      onChange={(e) => set(e.target.value)}
      placeholder={ph}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground-faint focus:border-accent focus:outline-none disabled:opacity-60"
    />
  );
}
