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
      <div className="flex min-h-screen items-center justify-center font-mono text-sm text-foreground-faint">
        <span className="animate-blink text-accent">▊</span>
      </div>
    );
  }

  const navLinks = (
    <>
      {nav.map((n) => {
        const active =
          n.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`whitespace-nowrap rounded px-3 py-1.5 transition-colors ${
              active
                ? "bg-raised text-accent"
                : "text-foreground-dim hover:bg-raised hover:text-foreground"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="wrap flex h-16 items-center justify-between gap-3">
          <Link href="/admin" className="shrink-0 font-mono text-sm">
            <span className="text-accent">~/admin</span>
          </Link>
          {/* Desktop: inline nav. Mobile: only logout here; links scroll below. */}
          <div className="hidden items-center gap-1 font-mono text-sm lg:flex">
            {navLinks}
          </div>
          <button
            onClick={logout}
            className="shrink-0 rounded border border-border px-3 py-1.5 font-mono text-sm text-foreground-dim transition-colors hover:border-[#ff6b6b]/50 hover:text-[#ff6b6b]"
          >
            logout
          </button>
        </div>
        {/* Mobile: horizontally-scrollable link strip */}
        <div className="wrap -mt-1 flex gap-1 overflow-x-auto pb-2 font-mono text-sm lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navLinks}
        </div>
      </header>
      <main className="wrap py-8 sm:py-10">{children}</main>
    </div>
  );
}
