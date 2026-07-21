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
  const session = (await cookies()).get("access_session")?.value;
  if (!session) redirect("/request-access");

  const res = await fetch(`${API_URL}/api/private/profile`, {
    headers: { cookie: `access_session=${session}` },
    cache: "no-store",
  });

  if (res.status === 401) redirect("/request-access");
  if (!res.ok) {
    return (
      <div className="wrap flex min-h-screen items-center justify-center">
        <p className="font-mono text-sm text-paper-faint">
          Could not load profile. Please try again later.
        </p>
      </div>
    );
  }

  const profile = (await res.json()) as PrivateProfile;
  return <PrivateProfileView profile={profile} />;
}
