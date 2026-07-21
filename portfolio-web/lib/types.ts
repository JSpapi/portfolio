export type PostType = "weekly" | "daily" | "deep-dive" | "til";

export interface PostSummary {
  id: string;
  slug: string;
  type: PostType;
  title: string;
  summary: string;
  tags: string[];
  reading_time: number;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Post extends PostSummary {
  body: string;
}

export interface PostList {
  posts: PostSummary[];
  page: number;
  limit: number;
  total: number;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
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
  resume_url: string | null;
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
