"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Post, PostType } from "@/lib/types";
import { MDRenderer } from "@/components/blog/md-renderer";
import { MediaUploader } from "./media-uploader";

const types: PostType[] = ["weekly", "daily", "deep-dive", "til"];

export function PostEditor({ existing }: { existing?: Post }) {
  const router = useRouter();
  const isEdit = Boolean(existing);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [type, setType] = useState<PostType>(existing?.type ?? "weekly");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [tags, setTags] = useState((existing?.tags ?? []).join(", "));
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function insertAtCursor(snippet: string) {
    const ta = bodyRef.current;
    if (!ta) {
      setBody((b) => b + snippet);
      return;
    }
    const start = ta.selectionStart;
    const next = body.slice(0, start) + snippet + body.slice(ta.selectionEnd);
    setBody(next);
  }

  async function save(publish: boolean) {
    setError("");
    setSaving(true);
    const payload = {
      slug: slug.trim(),
      type,
      title: title.trim(),
      summary: summary.trim(),
      body,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      if (isEdit) {
        await api.put(`/api/admin/posts/${existing!.slug}`, payload);
      } else {
        await api.post("/api/admin/posts", payload);
      }
      if (publish) {
        await api.put(`/api/admin/posts/${payload.slug}/publish`);
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-2xl tracking-tight text-foreground sm:text-3xl">
          {isEdit ? "Edit post" : "New post"}
        </h1>
        <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
          <button
            onClick={() => setPreview((p) => !p)}
            className="rounded border border-border px-4 py-2 text-foreground-dim hover:text-foreground"
          >
            {preview ? "write" : "preview"}
          </button>
          <button
            disabled={saving}
            onClick={() => save(false)}
            className="rounded border border-border px-4 py-2 text-foreground hover:bg-raised disabled:opacity-50"
          >
            save draft
          </button>
          <button
            disabled={saving}
            onClick={() => save(true)}
            className="rounded-full bg-accent px-5 py-2 text-background disabled:opacity-50"
          >
            {saving ? "…" : "save & publish"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 px-4 py-2 font-mono text-sm text-[#ff6b6b]">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: main editing surface */}
        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            className="w-full bg-transparent font-serif text-3xl text-foreground placeholder:text-foreground-faint focus:outline-none"
          />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short summary (shown on the list page)…"
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-foreground-faint focus:border-accent focus:outline-none"
          />

          {preview ? (
            <div className="min-h-[400px] rounded-lg border border-border bg-surface p-6">
              <MDRenderer body={body || "_Nothing to preview yet._"} />
            </div>
          ) : (
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write in Markdown…"
              rows={22}
              className="w-full resize-y rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground placeholder:text-foreground-faint focus:border-accent focus:outline-none"
            />
          )}
        </div>

        {/* Right: meta + media */}
        <aside className="space-y-6">
          <Panel label="slug">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={isEdit}
              placeholder="week-14-auth"
              className="input-mono disabled:opacity-60"
            />
          </Panel>

          <Panel label="type">
            <div className="grid grid-cols-2 gap-2">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded border px-3 py-2 font-mono text-xs transition-colors ${
                    type === t
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-foreground-dim hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Panel>

          <Panel label="tags (comma-separated)">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="go, postgres, r2"
              className="input-mono"
            />
          </Panel>

          <Panel label="media">
            <MediaUploader slug={slug} onInsert={insertAtCursor} />
          </Panel>
        </aside>
      </div>

      <style jsx>{`
        :global(.input-mono) {
          width: 100%;
          background: #0b1120;
          border: 1px solid #243049;
          border-radius: 8px;
          padding: 0.6rem 0.8rem;
          color: #e6edf6;
          font-family: var(--font-mono);
          font-size: 0.85rem;
        }
        :global(.input-mono:focus) {
          outline: none;
          border-color: #3b82f6;
        }
        :global(.input-mono::placeholder) {
          color: #6b7a96;
        }
      `}</style>
    </div>
  );
}

function Panel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 font-mono text-xs uppercase tracking-wider text-foreground-faint">
        {label}
      </div>
      {children}
    </div>
  );
}
