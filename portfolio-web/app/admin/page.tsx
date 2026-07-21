"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { PostSummary } from "@/lib/types";

export default function AdminDashboard() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const r = await api.get<{ posts: PostSummary[] }>("/api/admin/posts");
    setPosts(r.posts);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function togglePublish(p: PostSummary) {
    setBusy(p.slug);
    const action = p.published_at ? "unpublish" : "publish";
    try {
      await api.put(`/api/admin/posts/${p.slug}/${action}`);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function del(slug: string) {
    if (!confirm(`Delete "${slug}" and its media? This cannot be undone.`))
      return;
    setBusy(slug);
    try {
      await api.del(`/api/admin/posts/${slug}`);
      await load();
    } finally {
      setBusy(null);
    }
  }

  const published = posts.filter((p) => p.published_at).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl tracking-tight text-paper">
          Dashboard
        </h1>
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-amber px-5 py-2 font-mono text-sm text-ink"
        >
          + new post
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-ink-line bg-ink-line">
        <Stat label="total posts" value={posts.length} />
        <Stat label="published" value={published} />
        <Stat label="drafts" value={posts.length - published} />
      </div>

      <h2 className="mt-12 font-mono text-sm uppercase tracking-[0.2em] text-paper-faint">
        // all posts
      </h2>

      {loading ? (
        <p className="mt-6 font-mono text-sm text-paper-faint">loading…</p>
      ) : posts.length === 0 ? (
        <p className="mt-6 font-mono text-sm text-paper-faint">
          No posts yet. Create your first one.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-ink-line overflow-hidden rounded-xl border border-ink-line">
          {posts.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-3 bg-ink-soft px-5 py-4"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  p.published_at ? "bg-moss" : "bg-paper-faint"
                }`}
                title={p.published_at ? "published" : "draft"}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-serif text-lg text-paper">
                  {p.title}
                </div>
                <div className="font-mono text-xs text-paper-faint">
                  {p.slug} · {p.type}
                </div>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <Link
                  href={`/admin/posts/${p.slug}/edit`}
                  className="rounded border border-ink-line px-3 py-1.5 text-paper-dim hover:text-paper"
                >
                  edit
                </Link>
                <button
                  disabled={busy === p.slug}
                  onClick={() => togglePublish(p)}
                  className="rounded border border-ink-line px-3 py-1.5 text-amber hover:bg-amber/10 disabled:opacity-50"
                >
                  {p.published_at ? "unpublish" : "publish"}
                </button>
                <button
                  disabled={busy === p.slug}
                  onClick={() => del(p.slug)}
                  className="rounded border border-ink-line px-3 py-1.5 text-[#ff6b6b] hover:bg-[#ff6b6b]/10 disabled:opacity-50"
                >
                  del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-ink-soft p-6">
      <div className="font-serif text-4xl text-paper">{value}</div>
      <div className="mt-1 font-mono text-xs uppercase tracking-wider text-paper-faint">
        {label}
      </div>
    </div>
  );
}
