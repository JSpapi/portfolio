-- name: CreateMedia :one
INSERT INTO media (post_id, r2_key, url, mime_type, size_bytes)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListMediaByPostSlug :many
SELECT m.* FROM media m
JOIN posts p ON p.id = m.post_id
WHERE p.slug = $1
ORDER BY m.uploaded_at DESC;

-- name: ListMediaKeysByPostSlug :many
SELECT m.r2_key FROM media m
JOIN posts p ON p.id = m.post_id
WHERE p.slug = $1;

-- name: GetMediaByID :one
SELECT * FROM media WHERE id = $1;

-- name: DeleteMediaByID :exec
DELETE FROM media WHERE id = $1;
