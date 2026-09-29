import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// Called by the Go API after a post is published/updated. Guarded by a shared
// secret so anyone can't force cache busts.
//
// Purges the whole site, not just `path`: pages live under /[locale], so a
// literal "/blog" never matched the cached /en/blog, /ru/blog, /uz/blog, and
// the homepage's latest-posts list was never purged at all. The site is
// small, and each page rebuilds on its next visit.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }
  const path = searchParams.get("path") ?? "/blog";
  revalidatePath("/", "layout");
  return NextResponse.json({ revalidated: true, path, scope: "site" });
}
