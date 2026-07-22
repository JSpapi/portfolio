"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface UploadResult {
  url: string;
  mime_type: string;
  size_bytes: number;
}

/**
 * Drag-drop / click media uploader. On success it calls onInsert with a Markdown
 * snippet (image syntax for images, <video> for mp4) to splice into the body.
 */
export function MediaUploader({
  slug,
  onInsert,
  accept = "image/jpeg,image/png,image/webp,image/gif,video/mp4",
}: {
  slug: string;
  onInsert: (snippet: string) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    if (!slug.trim()) {
      setError("Set a slug first — media is stored under posts/<slug>/.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("slug", slug.trim());
      const r = await api.upload<UploadResult>("/api/admin/upload", form);
      const snippet = r.mime_type.startsWith("video/")
        ? `\n<video controls width="100%" preload="metadata">\n  <source src="${r.url}" type="video/mp4">\n</video>\n`
        : r.mime_type === "application/pdf"
        ? `\n[${file.name}](${r.url})\n`
        : `\n![${file.name}](${r.url})\n`;
      onInsert(snippet);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border border-dashed px-4 py-6 text-center font-mono text-xs transition-colors ${
          dragging
            ? "border-amber bg-amber/10 text-amber"
            : "border-ink-line text-paper-faint hover:border-paper-faint"
        }`}
      >
        {uploading
          ? "uploading…"
          : dragging
          ? "drop to upload"
          : "drag image / mp4 here, or click"}
        <div className="mt-1 text-paper-faint/70">
          images ≤ 10MB · mp4 ≤ 50MB
        </div>
      </div>
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
      {error && <p className="mt-2 font-mono text-xs text-[#ff6b6b]">{error}</p>}
    </div>
  );
}
