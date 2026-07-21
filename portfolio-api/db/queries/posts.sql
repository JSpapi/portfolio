-- name: ListPublishedPosts :many
SELECT id, slug, type, title, summary, tags, reading_time, published_at, created_at, updated_at
FROM posts
WHERE published_at IS NOT NULL
  AND (sqlc.narg('type')::post_type IS NULL OR type = sqlc.narg('type')::post_type)
  AND (sqlc.narg('tag')::text IS NULL OR sqlc.narg('tag')::text = ANY(tags))
ORDER BY published_at DESC
LIMIT $1 OFFSET $2;

-- name: CountPublishedPosts :one
SELECT COUNT(*)
FROM posts
WHERE published_at IS NOT NULL
  AND (sqlc.narg('type')::post_type IS NULL OR type = sqlc.narg('type')::post_type)
  AND (sqlc.narg('tag')::text IS NULL OR sqlc.narg('tag')::text = ANY(tags));

-- name: GetPublishedPostBySlug :one
SELECT * FROM posts
WHERE slug = $1 AND published_at IS NOT NULL;

-- name: GetPostBySlug :one
SELECT * FROM posts WHERE slug = $1;

-- name: ListRecentPublished :many
SELECT id, slug, type, title, summary, tags, reading_time, published_at, created_at, updated_at
FROM posts
WHERE published_at IS NOT NULL
ORDER BY published_at DESC
LIMIT $1;

-- name: ListAllPostsAdmin :many
SELECT id, slug, type, title, summary, tags, reading_time, published_at, created_at, updated_at
FROM posts
ORDER BY created_at DESC;

-- name: TagCounts :many
SELECT unnest(tags) AS tag, COUNT(*) AS count
FROM posts
WHERE published_at IS NOT NULL
GROUP BY tag
ORDER BY count DESC, tag ASC;

-- name: CreatePost :one
INSERT INTO posts (slug, type, title, summary, body, tags, reading_time)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: UpdatePost :one
UPDATE posts
SET type = $2, title = $3, summary = $4, body = $5, tags = $6, reading_time = $7, updated_at = NOW()
WHERE slug = $1
RETURNING *;

-- name: PublishPost :one
UPDATE posts
SET published_at = NOW(), updated_at = NOW()
WHERE slug = $1
RETURNING *;

-- name: UnpublishPost :one
UPDATE posts
SET published_at = NULL, updated_at = NOW()
WHERE slug = $1
RETURNING *;

-- name: DeletePost :exec
DELETE FROM posts WHERE slug = $1;
