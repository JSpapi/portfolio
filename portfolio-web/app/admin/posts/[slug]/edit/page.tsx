"use client";

import { use, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Post } from "@/lib/types";
import { PostEditor } from "@/components/admin/post-editor";

export default function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Admin endpoint returns full body including for drafts.
    api
      .get<Post>(`/api/admin/posts/${slug}`)
      .then(setPost)
      .catch((e) =>
        setError(
          e instanceof ApiError && e.status === 404
            ? "Post not found."
            : e instanceof ApiError
            ? e.message
            : "Failed to load"
        )
      );
  }, [slug]);

  if (error)
    return <p className="font-mono text-sm text-[#ff6b6b]">{error}</p>;
  if (!post)
    return (
      <p className="font-mono text-sm text-foreground-faint">
        <span className="animate-blink text-accent">▊</span> loading…
      </p>
    );

  return <PostEditor existing={post} />;
}
