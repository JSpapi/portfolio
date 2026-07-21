-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: SeedAdmin :exec
INSERT INTO users (email, password_hash, role)
VALUES ($1, $2, 'admin')
ON CONFLICT (email) DO NOTHING;
