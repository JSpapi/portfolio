"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface UploadResult {
  id: string;
  url: string;
  mime_type: string;
  size_bytes: number;
}

/** One upload made during this editing session. */
interface SessionUpload {
  id: string; // media row id — used to delete the row + R2 object together
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  lang: string; // language body it was first inserted into
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Build the Markdown/HTML snippet for a given media URL + mime + name. */
function snippetFor(url: string, mime: string, filename: string): string {
  if (mime.startsWith("video/")) {
    return `\n<video controls width="100%" preload="metadata">\n  <source src="${url}" type="video/mp4">\n</video>\n`;
  }
  if (mime === "application/pdf") {
    return `\n[${filename}](${url})\n`;
  }
  return `\n![${filename}](${url})\n`;
}

/**
 * Drag-drop / click media uploader with visible feedback:
 *  - a success card after each upload (thumbnail, name, size, which language),
 *  - a running list of this session's uploads (copy URL + re-insert),
 *  - a duplicate-filename warning so the same file isn't uploaded twice.
 */
export function MediaUploader({
  slug,
  onInsert,
  onDelete,
  activeLang,
  accept = "image/jpeg,image/png,image/webp,image/gif,video/mp4",
}: {
  slug: string;
  onInsert: (snippet: string) => void;
  /** Called with the media URL after it's deleted, so the parent can strip any
   *  reference to it from the post body. Optional (e.g. the resume uploader). */
  onDelete?: (url: string) => void;
  /** The post language body uploads insert into. Omit where there are no
   *  language tabs (e.g. the single-PDF resume uploader). */
  activeLang?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploads, setUploads] = useState<SessionUpload[]>([]);
  const [lastUrl, setLastUrl] = useState<string | null>(null); // highlights the success card
  const [copied, setCopied] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // A file whose name matches an earlier upload — awaiting the user's decision.
  const [dupPending, setDupPending] = useState<{
    file: File;
    existing: SessionUpload;
  } | null>(null);

  function recordAndInsert(u: SessionUpload) {
    setUploads((prev) => {
      // De-dupe the list by URL (re-inserts shouldn't add rows).
      if (prev.some((p) => p.url === u.url)) return prev;
      return [u, ...prev];
    });
    setLastUrl(u.url);
    onInsert(snippetFor(u.url, u.mimeType, u.filename));
  }

  async function doUpload(file: File) {
    if (!slug.trim()) {
      setError("Set a slug first — media is stored under posts/<slug>/.");
      return;
    }
    setError("");
    setDupPending(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("slug", slug.trim());
      const r = await api.upload<UploadResult>("/api/admin/upload", form);
      recordAndInsert({
        id: r.id,
        url: r.url,
        filename: file.name,
        mimeType: r.mime_type,
        sizeBytes: r.size_bytes,
        lang: activeLang ?? "",
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  /** Entry point for a picked/dropped file — guards against duplicate names. */
  function handleFile(file: File) {
    setError("");
    const existing = uploads.find((u) => u.filename === file.name);
    if (existing) {
      setDupPending({ file, existing });
      return;
    }
    doUpload(file);
  }

  function reInsert(u: SessionUpload) {
    setLastUrl(u.url);
    onInsert(snippetFor(u.url, u.mimeType, u.filename));
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied((c) => (c === url ? null : c)), 1500);
    } catch {
      /* clipboard may be blocked; the URL is still visible in the list */
    }
  }

  /** Delete both the R2 object and the DB row, drop it from the list, and strip
   *  any reference to its URL from the post bodies (via onDelete). */
  async function deleteMedia(u: SessionUpload) {
    setError("");
    setDeletingId(u.id);
    try {
      await api.del(`/api/admin/media/${u.id}`);
      setUploads((prev) => prev.filter((p) => p.id !== u.id));
      setLastUrl((cur) => (cur === u.url ? null : cur));
      onDelete?.(u.url);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not delete media"
      );
    } finally {
      setDeletingId(null);
    }
  }

  const isVideo = (m: string) => m.startsWith("video/");
  const langLabel = activeLang ? activeLang.toUpperCase() : "";

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          if (uploading) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (uploading) return;
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        aria-busy={uploading}
        className={`rounded-lg border border-dashed px-4 py-6 text-center font-mono text-xs transition-colors ${
          uploading
            ? "cursor-wait border-accent/50 text-accent"
            : dragging
            ? "cursor-pointer border-accent bg-accent/10 text-accent"
            : "cursor-pointer border-border text-foreground-faint hover:border-foreground-faint"
        }`}
      >
        {uploading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            uploading…
          </span>
        ) : dragging ? (
          "drop to upload"
        ) : (
          "drag image / mp4 here, or click"
        )}
        <div className="mt-1 text-foreground-faint/70">
          images ≤ 10MB · mp4 ≤ 50MB{langLabel && ` · inserts into ${langLabel}`}
        </div>
      </div>

      {error && (
        <p className="mt-2 rounded border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 px-3 py-2 font-mono text-xs text-[#ff6b6b]">
          {error}
        </p>
      )}

      {/* Duplicate-filename warning */}
      {dupPending && (
        <div className="mt-3 rounded-lg border border-highlight/40 bg-highlight/10 p-3">
          <p className="font-mono text-xs text-highlight">
            ⚠ You already uploaded{" "}
            <span className="font-semibold">{dupPending.existing.filename}</span>{" "}
            this session.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                reInsert(dupPending.existing);
                setDupPending(null);
              }}
              className="rounded bg-accent px-3 py-1.5 font-mono text-xs text-background"
            >
              insert existing instead
            </button>
            <button
              type="button"
              onClick={() => doUpload(dupPending.file)}
              className="rounded border border-border px-3 py-1.5 font-mono text-xs text-foreground-dim hover:text-foreground"
            >
              upload a new copy
            </button>
            <button
              type="button"
              onClick={() => setDupPending(null)}
              className="rounded border border-border px-3 py-1.5 font-mono text-xs text-foreground-faint hover:text-foreground"
            >
              cancel
            </button>
          </div>
        </div>
      )}

      {/* Success card — the most recent upload */}
      {lastUrl &&
        !dupPending &&
        (() => {
          const u = uploads.find((x) => x.url === lastUrl);
          if (!u) return null;
          return (
            <div className="mt-3 flex items-start gap-3 rounded-lg border border-highlight/40 bg-highlight/[0.08] p-3">
              <Thumb u={u} isVideo={isVideo(u.mimeType)} />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-highlight">
                  ✓ Uploaded &amp; inserted
                  {u.lang && ` into ${u.lang.toUpperCase()}`}
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-foreground-dim">
                  {u.filename} · {humanSize(u.sizeBytes)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyUrl(u.url)}
                    className="rounded border border-border px-2 py-1 font-mono text-[11px] text-foreground-dim hover:text-foreground"
                  >
                    {copied === u.url ? "copied ✓" : "copy URL"}
                  </button>
                  <button
                    type="button"
                    onClick={() => reInsert(u)}
                    className="rounded border border-border px-2 py-1 font-mono text-[11px] text-foreground-dim hover:text-foreground"
                  >
                    re-insert
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMedia(u)}
                    disabled={deletingId === u.id}
                    className="rounded border border-[#ff6b6b]/40 px-2 py-1 font-mono text-[11px] text-[#ff6b6b] hover:bg-[#ff6b6b]/10 disabled:opacity-50"
                  >
                    {deletingId === u.id ? "deleting…" : "delete"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Session upload list (everything except the one already shown as the card) */}
      {uploads.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-foreground-faint">
            this session · {uploads.length}
          </div>
          <ul className="space-y-2">
            {uploads.map((u) => (
              <li
                key={u.url}
                className="flex items-center gap-2 rounded-lg border border-border bg-background p-2"
              >
                <Thumb u={u} isVideo={isVideo(u.mimeType)} small />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[11px] text-foreground-dim">
                    {u.filename}
                  </p>
                  <p className="font-mono text-[10px] text-foreground-faint">
                    {humanSize(u.sizeBytes)}
                    {u.url === lastUrl && " · just inserted"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => copyUrl(u.url)}
                    className="rounded border border-border px-2 py-1 font-mono text-[10px] text-foreground-faint hover:text-foreground"
                    title="Copy URL"
                  >
                    {copied === u.url ? "✓" : "copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => reInsert(u)}
                    className="rounded border border-border px-2 py-1 font-mono text-[10px] text-foreground-faint hover:text-foreground"
                    title="Insert into the current language body"
                  >
                    re-insert
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMedia(u)}
                    disabled={deletingId === u.id}
                    className="rounded border border-[#ff6b6b]/40 px-2 py-1 font-mono text-[10px] text-[#ff6b6b] hover:bg-[#ff6b6b]/10 disabled:opacity-50"
                    title="Delete file + record from storage"
                  >
                    {deletingId === u.id ? "…" : "del"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Small preview: an <img> for images, a film glyph for video/other. */
function Thumb({
  u,
  isVideo,
  small,
}: {
  u: SessionUpload;
  isVideo: boolean;
  small?: boolean;
}) {
  const box = small ? "h-9 w-9" : "h-14 w-14";
  if (isVideo || !u.mimeType.startsWith("image/")) {
    return (
      <div
        className={`flex ${box} shrink-0 items-center justify-center rounded border border-border bg-surface font-mono text-[10px] text-foreground-faint`}
      >
        {isVideo ? "▶" : "doc"}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={u.url}
      alt={u.filename}
      className={`${box} shrink-0 rounded border border-border object-cover`}
    />
  );
}
