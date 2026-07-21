"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { AdminUser } from "@/lib/types";

const nav = [
  { href: "/admin", label: "dashboard" },
  { href: "/admin/posts/new", label: "new post" },
  { href: "/admin/projects", label: "projects" },
  { href: "/admin/now", label: "now" },
  { href: "/admin/access-requests", label: "access" },
  { href: "/admin/private-profile", label: "private profile" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get<AdminUser>("/api/auth/me")
      .then((u) => {
        if (alive) {
          setUser(u);
          setChecked(true);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/admin/login");
        } else if (alive) {
          setChecked(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [router]);

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* ignore */
    }
    router.replace("/admin/login");
  }

  if (!checked || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono text-sm text-paper-faint">
        <span className="animate-blink text-amber">▊</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink-line bg-ink/85 backdrop-blur">
        <div className="wrap flex h-16 items-center justify-between">
          <Link href="/admin" className="font-mono text-sm">
            <span className="text-amber">~/admin</span>
          </Link>
          <div className="flex items-center gap-1 font-mono text-sm">
            {nav.map((n) => {
              const active =
                n.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded px-3 py-1.5 transition-colors ${
                    active
                      ? "bg-ink-raised text-amber"
                      : "text-paper-dim hover:bg-ink-raised hover:text-paper"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="ml-2 rounded border border-ink-line px-3 py-1.5 text-paper-dim transition-colors hover:border-[#ff6b6b]/50 hover:text-[#ff6b6b]"
            >
              logout
            </button>
          </div>
        </div>
      </header>
      <main className="wrap py-10">{children}</main>
    </div>
  );
}
