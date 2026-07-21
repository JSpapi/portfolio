import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Landing route for the emailed magic link. A Route Handler (not a page) because
 * Next.js only allows setting cookies from Route Handlers / Server Actions. It
 * calls the API's unlock endpoint, relays the access_session cookie, and
 * redirects to /private (or to a failure screen on an expired/used link).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/request-access", req.url));
  }

  const res = await fetch(
    `${API_URL}/api/access/unlock?token=${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    // Expired / used / invalid → show the friendly failure page.
    return NextResponse.redirect(new URL("/private/expired", req.url));
  }

  // Relay the access_session cookie the API set onto our redirect response.
  const setCookie = res.headers.get("set-cookie");
  const value = setCookie
    ? /access_session=([^;]+)/.exec(setCookie)?.[1]
    : undefined;
  const maxAge = setCookie
    ? /Max-Age=(\d+)/i.exec(setCookie)?.[1]
    : undefined;

  if (value) {
    const jar = await cookies();
    jar.set("access_session", value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAge ? parseInt(maxAge, 10) : undefined,
    });
  }

  return NextResponse.redirect(new URL("/private", req.url));
}
