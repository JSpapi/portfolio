"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Project } from "@/lib/types";

type Draft = {
  slug: string;
  title: string;
  description: string;
  tags: string;
  url_live: string;
  url_repo: string;
  featured: boolean;
};

const empty: Draft = {
  slug: "",
  title: "",
  description: "",
  tags: "",
  url_live: "",
  url_repo: "",
  featured: false,
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [draft, setDraft] = useState<Draft>(empty);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
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
      title: d.title.trim(),
      description: d.description.trim(),
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
      title: p.title,
      description: p.description,
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
        <h1 className="font-serif text-3xl tracking-tight text-paper">
          Projects
        </h1>
        <div className="mt-6 space-y-3">
          {projects.length === 0 && (
            <p className="font-mono text-sm text-paper-faint">
              No projects yet.
            </p>
          )}
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-ink-line bg-ink-soft px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-serif text-lg text-paper">
                    {p.title}
                  </span>
                  {p.featured && (
                    <span className="rounded border border-amber/40 bg-amber/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-amber">
                      featured
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-paper-faint">
                  {p.slug}
                </div>
              </div>
              <div className="flex gap-2 font-mono text-xs">
                <button
                  onClick={() => edit(p)}
                  className="rounded border border-ink-line px-3 py-1.5 text-paper-dim hover:text-paper"
                >
                  edit
                </button>
                <button
                  onClick={() => del(p.slug)}
                  className="rounded border border-ink-line px-3 py-1.5 text-[#ff6b6b] hover:bg-[#ff6b6b]/10"
                >
                  del
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="rounded-xl border border-ink-line bg-ink-soft p-6">
        <h2 className="font-mono text-sm uppercase tracking-wider text-paper-faint">
          {editingSlug ? `edit ${editingSlug}` : "new project"}
        </h2>
        <div className="mt-4 space-y-3">
          <Inp
            v={draft.slug}
            set={(v) => setDraft({ ...draft, slug: v })}
            ph="slug"
            disabled={!!editingSlug}
          />
          <Inp
            v={draft.title}
            set={(v) => setDraft({ ...draft, title: v })}
            ph="title"
          />
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="description"
            rows={3}
            className="w-full resize-none rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-paper-faint focus:border-amber focus:outline-none"
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
          <label className="flex items-center gap-2 font-mono text-xs text-paper-dim">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(e) =>
                setDraft({ ...draft, featured: e.target.checked })
              }
              className="accent-amber"
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
            className="rounded-full bg-amber px-5 py-2 font-mono text-sm text-ink"
          >
            {editingSlug ? "update" : "create"}
          </button>
          {editingSlug && (
            <button
              onClick={() => {
                setEditingSlug(null);
                setDraft(empty);
              }}
              className="rounded-full border border-ink-line px-5 py-2 font-mono text-sm text-paper-dim"
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
      className="w-full rounded-lg border border-ink-line bg-ink px-3 py-2 font-mono text-sm text-paper placeholder:text-paper-faint focus:border-amber focus:outline-none disabled:opacity-60"
    />
  );
}
