"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { NowWidget } from "@/lib/types";

export default function AdminNowPage() {
  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<NowWidget>("/api/now").then((n) => {
      setBody(n.body);
      setLoaded(true);
    });
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/api/admin/now", { body });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl tracking-tight text-paper">
        Currently working on
      </h1>
      <p className="mt-2 text-paper-dim">
        One line shown on the homepage terminal widget.
      </p>

      {!loaded ? (
        <p className="mt-8 font-mono text-sm text-paper-faint">loading…</p>
      ) : (
        <div className="mt-8">
          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setSaved(false);
            }}
            rows={4}
            className="w-full resize-none rounded-lg border border-ink-line bg-ink-soft px-4 py-3 font-mono text-sm text-paper focus:border-amber focus:outline-none"
          />
          <div className="mt-4 flex items-center gap-4">
            <button
              disabled={saving}
              onClick={save}
              className="rounded-full bg-amber px-6 py-2.5 font-mono text-sm text-ink disabled:opacity-50"
            >
              {saving ? "saving…" : "save"}
            </button>
            {saved && (
              <span className="font-mono text-sm text-moss">✓ saved</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
