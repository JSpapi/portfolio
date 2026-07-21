import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";

export const dynamic = "force-dynamic";

// Clears the local access_session cookie and best-effort tells the API to null
// the DB session hash, then bounces to the request-access page.
export async function POST(req: Request) {
  const jar = await cookies();
  const session = jar.get("access_session")?.value;

  if (session) {
    try {
      await fetch(`${API_URL}/api/access/logout`, {
        method: "POST",
        headers: { cookie: `access_session=${session}` },
        cache: "no-store",
      });
    } catch {
      /* ignore — we still clear locally */
    }
  }
  jar.delete("access_session");

  return NextResponse.redirect(new URL("/request-access", req.url), {
    status: 303,
  });
}
