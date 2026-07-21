-- name: GetNow :one
SELECT * FROM now WHERE id = 1;

-- name: UpdateNow :one
UPDATE now SET body = $1, updated_at = NOW() WHERE id = 1
RETURNING *;
