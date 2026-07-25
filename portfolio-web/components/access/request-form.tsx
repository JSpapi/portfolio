"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";

type State = "idle" | "submitting" | "done" | "error";

export function RequestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setError("");
    try {
      await api.post("/api/access/request", { name, email, reason });
      setState("done");
    } catch (err) {
      setState("error");
      setError(
        err instanceof ApiError ? err.message : "Something went wrong."
      );
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-xl border border-moss/40 bg-moss/10 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-moss/50 font-mono text-xl text-moss">
          ✓
        </div>
        <h2 className="mt-5 font-serif text-2xl text-paper">Request received</h2>
        <p className="mx-auto mt-3 max-w-sm text-paper-dim">
          If it&apos;s approved, you&apos;ll get an email with a private link.
          Approvals are manual, so it may take a little while.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-ink-line bg-ink-soft p-6 sm:p-8"
    >
      <div className="space-y-5">
        <Field label="name" htmlFor="name">
          <input
            id="name"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="input"
          />
        </Field>

        <Field label="email" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="input"
          />
        </Field>

        <Field label="why do you want access?" htmlFor="reason">
          <textarea
            id="reason"
            rows={4}
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. HR at Acme, considering you for a backend role."
            className="input resize-none"
          />
        </Field>
      </div>

      {state === "error" && (
        <p className="mt-4 font-mono text-sm text-[#ff6b6b]">{error}</p>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="mt-7 w-full rounded-full bg-amber px-6 py-3 font-mono text-sm text-ink transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "submitting" ? "sending…" : "request access →"}
      </button>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          background: #0d0c0b;
          border: 1px solid #2a2723;
          border-radius: 8px;
          padding: 0.8rem 0.9rem;
          color: #f4efe6;
          font-family: var(--font-sans);
          /* 16px min prevents iOS Safari auto-zoom on focus */
          font-size: 16px;
          transition: border-color 0.15s;
        }
        :global(.input:focus) {
          outline: none;
          border-color: #e8a13a;
        }
        :global(.input::placeholder) {
          color: #6f685e;
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block font-mono text-xs uppercase tracking-wider text-paper-faint"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
