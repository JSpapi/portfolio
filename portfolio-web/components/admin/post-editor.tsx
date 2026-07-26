"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  type Localized,
  type LocalizedField,
  type Post,
  type PostType,
} from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import { MDRenderer } from "@/components/blog/md-renderer";
import { MediaUploader } from "./media-uploader";

const types: PostType[] = ["weekly", "daily", "deep-dive", "til"];

type Lang = Locale;
// Authoring order (English first) differs from the URL locale order in
// routing.ts on purpose. The assertion below pins LANGS to Locale, so an
// invalid OR missing locale is a compile error — routing.ts stays the single
// source of truth without a second hardcoded list.
const LANGS = ["en", "ru", "uz"] as const;
type _AssertLangsMatchLocale =
  [Lang] extends [(typeof LANGS)[number]]
    ? [(typeof LANGS)[number]] extends [Lang]
      ? true
      : ["LANGS has a value that is not a Locale"]
    : ["LANGS is missing a Locale"];
const _langsCoverAllLocales: _AssertLangsMatchLocale = true;
void _langsCoverAllLocales;

const emptyLoc: Record<Lang, string> = { en: "", ru: "", uz: "" };

/** Strip empty locales so we never persist { "uz": "" } — lets fallback work. */
function locToObj(v: Record<Lang, string>): Localized {
  const o: Localized = {};
  for (const l of LANGS) {
    const t = v[l].trim();
    if (t) o[l] = t;
  }
  return o;
}

/** Escape a string for safe use inside a RegExp. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** ISO string -> value for a <input type="datetime-local"> (local time, no seconds). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** Hydrate the per-language form state from a wire value (object or legacy string). */
function objToLoc(v: LocalizedField): Record<Lang, string> {
  const o: Record<Lang, string> = { ...emptyLoc };
  if (typeof v === "string") {
    o.en = v;
  } else if (v) {
    for (const l of LANGS) o[l] = v[l] ?? "";
  }
  return o;
}

export function PostEditor({ existing }: { existing?: Post }) {
  const router = useRouter();
  const isEdit = Boolean(existing);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [type, setType] = useState<PostType>(existing?.type ?? "weekly");
  const [title, setTitle] = useState<Record<Lang, string>>(
    objToLoc(existing?.title)
  );
  const [summary, setSummary] = useState<Record<Lang, string>>(
    objToLoc(existing?.summary)
  );
  const [body, setBody] = useState<Record<Lang, string>>(
    objToLoc(existing?.body)
  );
  const [tags, setTags] = useState((existing?.tags ?? []).join(", "));
  // Optional custom publish date (datetime-local value). Empty = publish "now".
  // Pre-filled from an existing post's published_at so editing preserves it.
  const [publishAt, setPublishAt] = useState(
    existing?.published_at ? toLocalInput(existing.published_at) : ""
  );
  const [lang, setLang] = useState<Lang>("en");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setField(
    set: React.Dispatch<React.SetStateAction<Record<Lang, string>>>,
    value: string
  ) {
    set((prev) => ({ ...prev, [lang]: value }));
  }

  function insertAtCursor(snippet: string) {
    const ta = bodyRef.current;
    const current = body[lang];
    if (!ta) {
      setBody((b) => ({ ...b, [lang]: b[lang] + snippet }));
      return;
    }
    const start = ta.selectionStart;
    const next = current.slice(0, start) + snippet + current.slice(ta.selectionEnd);
    setBody((b) => ({ ...b, [lang]: next }));
  }

  // When media is deleted, strip any reference to its URL from every language
  // body so no broken ![](…) / <video> link is left behind. The same image URL
  // may have been pasted into EN/RU/UZ, so scrub all three.
  function removeUrlFromBodies(url: string) {
    const drop = (text: string): string => {
      // Remove a whole <video>…</video> block whose <source> points at the url.
      const videoBlock = new RegExp(
        `\\n?<video[^>]*>[\\s\\S]*?${escapeRegExp(url)}[\\s\\S]*?</video>\\n?`,
        "g"
      );
      // Remove any single line that contains the url (image, pdf link, bare url).
      const line = new RegExp(`^.*${escapeRegExp(url)}.*$\\n?`, "gm");
      return text.replace(videoBlock, "\n").replace(line, "");
    };
    setBody((b) => {
      const next = { ...b };
      for (const l of LANGS) next[l] = drop(next[l]);
      return next;
    });
  }

  async function save(publish: boolean) {
    setError("");
    setSaving(true);
    const payload = {
      slug: slug.trim(),
      type,
      title: locToObj(title),
      summary: locToObj(summary),
      body: locToObj(body),
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
        if (publishAt) {
          // Backdate (or forward-date) to the chosen datetime.
          await api.put(`/api/admin/posts/${payload.slug}/publish-at`, {
            published_at: new Date(publishAt).toISOString(),
          });
        } else {
          // No custom date → publish "now".
          await api.put(`/api/admin/posts/${payload.slug}/publish`);
        }
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
      setSaving(false);
    }
  }

  // Which languages already have any title text — a hint so you can see at a
  // glance what still needs translating. (title is the required field.)
  const filled = (v: Record<Lang, string>) =>
    LANGS.filter((l) => v[l].trim().length > 0);

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

      {/* Language tabs — title/summary/body are edited per language. */}
      <div className="mt-6 flex items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {LANGS.map((l) => {
            const has = filled(title).includes(l);
            return (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 font-mono text-xs uppercase transition-colors ${
                  lang === l
                    ? "bg-accent/15 text-accent"
                    : "text-foreground-faint hover:text-foreground"
                }`}
              >
                {l}
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    has ? "bg-highlight" : "bg-foreground-faint/40"
                  }`}
                  title={has ? "has content" : "empty"}
                />
              </button>
            );
          })}
        </div>
        <span className="font-mono text-xs text-foreground-faint">
          editing <span className="text-accent">{lang.toUpperCase()}</span> ·
          English is the fallback, so fill EN first
        </span>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 px-4 py-2 font-mono text-sm text-[#ff6b6b]">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: main editing surface */}
        <div className="space-y-4">
          <input
            value={title[lang]}
            onChange={(e) => setField(setTitle, e.target.value)}
            placeholder={`Post title (${lang})`}
            className="w-full bg-transparent font-serif text-3xl text-foreground placeholder:text-foreground-faint focus:outline-none"
          />
          <textarea
            value={summary[lang]}
            onChange={(e) => setField(setSummary, e.target.value)}
            placeholder={`Short summary (${lang}) — shown on the list page…`}
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-foreground-faint focus:border-accent focus:outline-none"
          />

          {preview ? (
            <div className="min-h-[400px] rounded-lg border border-border bg-surface p-6">
              <MDRenderer body={body[lang] || "_Nothing to preview yet._"} />
            </div>
          ) : (
            <textarea
              ref={bodyRef}
              value={body[lang]}
              onChange={(e) => setField(setBody, e.target.value)}
              placeholder={`Write in Markdown (${lang})…`}
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

          <Panel label="publish date (optional)">
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              className="input-mono"
            />
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-foreground-faint">
              {publishAt
                ? "Post will be dated to this. Controls list order (newest first)."
                : "Empty = publish now. Set a past date to backdate an older post."}
              {publishAt && (
                <button
                  type="button"
                  onClick={() => setPublishAt("")}
                  className="ml-2 text-accent underline"
                >
                  clear
                </button>
              )}
            </p>
          </Panel>

          <Panel label="tags (comma-separated)">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="go, postgres, r2"
              className="input-mono"
            />
          </Panel>

          <Panel label="media (shared across languages)">
            <MediaUploader
              slug={slug}
              onInsert={insertAtCursor}
              onDelete={removeUrlFromBodies}
              activeLang={lang}
            />
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
