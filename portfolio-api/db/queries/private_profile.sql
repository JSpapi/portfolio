-- name: GetPrivateProfile :one
SELECT * FROM private_profile WHERE id = 1;

-- name: UpdatePrivateProfile :one
UPDATE private_profile
SET cv_markdown = $1,
    projects_markdown = $2,
    contact_markdown = $3,
    resume_url = $4,
    references_json = $5,
    updated_at = NOW()
WHERE id = 1
RETURNING *;
