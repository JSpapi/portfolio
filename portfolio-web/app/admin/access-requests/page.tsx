"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { AccessRequest } from "@/lib/types";

const filters = ["pending", "approved", "denied", "revoked", "all"] as const;
type Filter = (typeof filters)[number];

const statusColor: Record<string, string> = {
  pending: "text-amber border-amber/40 bg-amber/10",
  approved: "text-moss border-moss/40 bg-moss/10",
  denied: "text-paper-faint border-ink-line bg-paper/5",
  revoked: "text-[#ff6b6b] border-[#ff6b6b]/40 bg-[#ff6b6b]/10",
};

export default function AccessRequestsPage() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [rows, setRows] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const q = filter === "all" ? "" : `?status=${filter}`;
    const r = await api.get<{ requests: AccessRequest[] }>(
      `/api/admin/access-requests${q}`
    );
    setRows(r.requests);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "approve" | "deny" | "revoke") {
    setBusy(id);
    setNote("");
    try {
      await api.post(`/api/admin/access-requests/${id}/${action}`);
      setNote(
        action === "approve"
          ? "Approved — magic link emailed (or logged in dev)."
          : `Request ${action}d.`
      );
      await load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  function fmt(iso: string | null) {
    return iso ? new Date(iso).toLocaleString() : "—";
  }

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight text-paper">
        Access requests
      </h1>
      <p className="mt-2 text-paper-dim">
        Approve to email a magic link. Revoke to kill an active session
        instantly.
      </p>

      <div className="mt-6 flex flex-wrap gap-2 font-mono text-xs">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1.5 transition-colors ${
              filter === f
                ? "border-amber bg-amber/10 text-amber"
                : "border-ink-line text-paper-dim hover:text-paper"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {note && (
        <p className="mt-4 rounded-lg border border-ink-line bg-ink-soft px-4 py-2 font-mono text-sm text-paper-dim">
          {note}
        </p>
      )}

      {loading ? (
        <p className="mt-8 font-mono text-sm text-paper-faint">loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 font-mono text-sm text-paper-faint">
          No {filter === "all" ? "" : filter} requests.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-ink-line bg-ink-soft p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-lg text-paper">
                      {r.name}
                    </span>
                    <span
                      className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                        statusColor[r.status] ?? ""
                      }`}
                    >
                      {r.status}
                    </span>
                    {r.has_active_session && (
                      <span className="rounded border border-moss/40 bg-moss/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-moss">
                        active session
                      </span>
                    )}
                  </div>
                  <a
                    href={`mailto:${r.email}`}
                    className="mt-1 block font-mono text-sm text-amber"
                  >
                    {r.email}
                  </a>
                  {r.reason && (
                    <p className="mt-2 max-w-xl text-sm text-paper-dim">
                      {r.reason}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-xs text-paper-faint">
                    requested {fmt(r.created_at)}
                    {r.decided_at &&
                      ` · decided ${fmt(r.decided_at)} (${r.decided_by})`}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 font-mono text-xs">
                  {(r.status === "pending" || r.status === "denied") && (
                    <button
                      disabled={busy === r.id}
                      onClick={() => act(r.id, "approve")}
                      className="rounded border border-moss/40 px-3 py-1.5 text-moss hover:bg-moss/10 disabled:opacity-50"
                    >
                      approve
                    </button>
                  )}
                  {r.status === "approved" && (
                    <button
                      disabled={busy === r.id}
                      onClick={() => act(r.id, "approve")}
                      className="rounded border border-ink-line px-3 py-1.5 text-paper-dim hover:text-paper disabled:opacity-50"
                    >
                      resend link
                    </button>
                  )}
                  {r.status === "pending" && (
                    <button
                      disabled={busy === r.id}
                      onClick={() => act(r.id, "deny")}
                      className="rounded border border-ink-line px-3 py-1.5 text-paper-dim hover:text-paper disabled:opacity-50"
                    >
                      deny
                    </button>
                  )}
                  {(r.has_active_session || r.status === "approved") && (
                    <button
                      disabled={busy === r.id}
                      onClick={() => act(r.id, "revoke")}
                      className="rounded border border-[#ff6b6b]/40 px-3 py-1.5 text-[#ff6b6b] hover:bg-[#ff6b6b]/10 disabled:opacity-50"
                    >
                      revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
