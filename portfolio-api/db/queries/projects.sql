-- name: ListProjects :many
SELECT * FROM projects
ORDER BY featured DESC, sort_order ASC, created_at DESC;

-- name: GetProjectBySlug :one
SELECT * FROM projects WHERE slug = $1;

-- name: CreateProject :one
INSERT INTO projects (slug, title, description, tags, url_live, url_repo, featured, sort_order)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: UpdateProject :one
UPDATE projects
SET title = $2, description = $3, tags = $4, url_live = $5, url_repo = $6, featured = $7, sort_order = $8
WHERE slug = $1
RETURNING *;

-- name: SetProjectSortOrder :exec
UPDATE projects SET sort_order = $2 WHERE id = $1;

-- name: DeleteProject :exec
DELETE FROM projects WHERE slug = $1;
