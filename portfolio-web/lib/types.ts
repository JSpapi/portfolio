import type { Locale } from "@/i18n/routing";

export type PostType = "weekly" | "daily" | "deep-dive" | "til";

export interface PostSummary {
  id: string;
  slug: string;
  type: PostType;
  title: LocalizedField;
  summary: LocalizedField;
  tags: string[];
  reading_time: number;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Post extends PostSummary {
  body: LocalizedField;
}

export interface PostList {
  posts: PostSummary[];
  page: number;
  limit: number;
  total: number;
}

/**
 * A field translated into each supported locale (keys may be missing).
 * Keys are derived from `Locale` (i18n/routing.ts) so the content locales
 * can never drift from the UI locales — add a language there, get it here.
 */
export type Localized = Partial<Record<Locale, string>>;

/**
 * A localized field as it actually arrives over the wire. The API may send:
 *  - a `Localized` object (the normal, post-migration shape),
 *  - a bare `string` (legacy TEXT rows not yet reseeded), or
 *  - null/undefined (a null column, guarded to `{}` by the backend).
 * The `| string` is deliberate: it forces every consumer through
 * `pickLocalized` instead of reaching for `.en` on a value that might be a
 * plain string. Do NOT narrow this to `Localized` — that would be a lie.
 */
export type LocalizedField = Localized | string | null | undefined;

/** Pick the best available translation for `locale`, falling back sensibly. */
export function pickLocalized(value: LocalizedField, locale: string): string {
  if (!value) return "";
  if (typeof value === "string") return value; // legacy/plain string
  return (
    value[locale as keyof Localized] ||
    value.en ||
    value.ru ||
    value.uz ||
    ""
  );
}

export interface Project {
  id: string;
  slug: string;
  title: LocalizedField;
  description: LocalizedField;
  tags: string[];
  url_live: string | null;
  url_repo: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string | null;
}

export interface NowWidget {
  body: string;
  updated_at: string | null;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface Reference {
  name: string;
  relation: string;
  contact: string;
}

export interface PrivateProfile {
  cv_markdown: string;
  projects_markdown: string;
  contact_markdown: string;
  /** Localized resume PDF links: { en, ru, uz } (legacy rows may be a string). */
  resume_url: LocalizedField;
  references: Reference[];
  updated_at: string | null;
}

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  reason: string;
  status: "pending" | "approved" | "denied" | "revoked";
  has_active_session: boolean;
  created_at: string | null;
  decided_at: string | null;
  decided_by: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}
