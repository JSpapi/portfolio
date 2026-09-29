import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { apiGet } from "@/lib/api";
import type { PostList } from "@/lib/types";
import { BlogIndex, POSTS_PER_PAGE } from "@/components/blog/blog-index";

export const revalidate = 3600;
export const dynamicParams = true;

export const metadata: Metadata = {
  title: "Log",
  description: "Weekly logs, daily notes, deep dives, and things I learned.",
};

// Prebuild pages 2..N at build; page 1 is /blog. Later pages render on demand.
export async function generateStaticParams() {
  try {
    const { total } = await apiGet<PostList>("/api/posts?limit=1");
    const pages = Math.ceil(total / POSTS_PER_PAGE);
    return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({
      n: String(i + 2),
    }));
  } catch {
    return [];
  }
}

export default async function BlogListPage({
  params,
}: {
  params: Promise<{ locale: string; n: string }>;
}) {
  const { locale, n } = await params;
  setRequestLocale(locale);
  const page = Number(n);
  if (!Number.isInteger(page) || page < 2) notFound();
  return <BlogIndex page={page} />;
}
