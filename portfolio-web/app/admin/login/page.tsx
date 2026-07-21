"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/api/auth/login", { email, password });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border border-ink-line bg-ink-soft p-8"
      >
        <div className="font-mono text-sm text-amber">~/admin</div>
        <h1 className="mt-2 font-serif text-2xl text-paper">Sign in</h1>

        <div className="mt-6 space-y-4">
          <input
            type="email"
            required
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-ink-line bg-ink px-4 py-2.5 font-mono text-sm text-paper placeholder:text-paper-faint focus:border-amber focus:outline-none"
          />
          <input
            type="password"
            required
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-ink-line bg-ink px-4 py-2.5 font-mono text-sm text-paper placeholder:text-paper-faint focus:border-amber focus:outline-none"
          />
        </div>

        {error && (
          <p className="mt-4 font-mono text-sm text-[#ff6b6b]">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-amber px-6 py-2.5 font-mono text-sm text-ink disabled:opacity-60"
        >
          {loading ? "…" : "enter"}
        </button>
      </form>
    </div>
  );
}
