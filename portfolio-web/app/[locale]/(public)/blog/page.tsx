import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { BlogIndex } from "@/components/blog/blog-index";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Log",
  description: "Weekly logs, daily notes, deep dives, and things I learned.",
};

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BlogIndex page={1} />;
}
