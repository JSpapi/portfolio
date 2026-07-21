import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// Called by the Go API after a post is published/updated. Guarded by a shared
// secret so anyone can't force cache busts.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }
  const path = searchParams.get("path") ?? "/blog";
  revalidatePath(path);
  return NextResponse.json({ revalidated: true, path });
}
