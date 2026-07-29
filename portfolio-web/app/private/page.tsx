import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { API_URL } from "@/lib/api";
import type { PrivateProfile } from "@/lib/types";
import { PrivateProfileView } from "@/components/access/private-profile";

// Never cache — this content is privileged and per-visitor gated.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private profile",
  robots: { index: false, follow: false },
};

export default async function PrivatePage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("access_session")?.value;
  if (!session) redirect("/request-access");

  // The visitor's last-chosen site language (set by next-intl on the public
  // pages). Absent for recruiters who open the magic link directly — the view
  // falls back to the English resume and lists the other languages as links.
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = rawLocale === "ru" || rawLocale === "uz" ? rawLocale : "en";

  const res = await fetch(`${API_URL}/api/private/profile`, {
    headers: { cookie: `access_session=${session}` },
    cache: "no-store",
  });

  if (res.status === 401) redirect("/request-access");
  if (!res.ok) {
    return (
      <div className="wrap flex min-h-screen items-center justify-center">
        <p className="font-mono text-sm text-foreground-faint">
          Could not load profile. Please try again later.
        </p>
      </div>
    );
  }

  const profile = (await res.json()) as PrivateProfile;
  return <PrivateProfileView profile={profile} locale={locale} />;
}
