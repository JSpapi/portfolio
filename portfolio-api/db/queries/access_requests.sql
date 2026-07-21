-- name: CreateAccessRequest :one
INSERT INTO access_requests (name, email, reason, ip, user_agent)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: SetAccessTelegramMsgID :exec
UPDATE access_requests SET telegram_msg_id = $2 WHERE id = $1;

-- name: GetAccessRequestByID :one
SELECT * FROM access_requests WHERE id = $1;

-- name: CountRecentRequestsByIP :one
SELECT COUNT(*) FROM access_requests
WHERE ip = $1 AND created_at > NOW() - ($2::interval);

-- name: ApproveAccessRequest :one
UPDATE access_requests
SET status = 'approved',
    magic_token_hash = $2,
    magic_expires_at = $3,
    magic_used_at = NULL,
    decided_at = NOW(),
    decided_by = $4
WHERE id = $1 AND status IN ('pending', 'approved', 'denied')
RETURNING *;

-- name: DenyAccessRequest :one
UPDATE access_requests
SET status = 'denied', decided_at = NOW(), decided_by = $2
WHERE id = $1
RETURNING *;

-- name: GetApprovedByMagicHash :one
SELECT * FROM access_requests
WHERE magic_token_hash = $1
  AND status = 'approved'
  AND magic_used_at IS NULL
  AND magic_expires_at > NOW();

-- name: ConsumeMagicAndCreateSession :one
UPDATE access_requests
SET magic_used_at = NOW(),
    session_hash = $2,
    session_expires_at = $3
WHERE id = $1
RETURNING *;

-- name: GetActiveAccessBySession :one
SELECT * FROM access_requests
WHERE session_hash = $1
  AND status = 'approved'
  AND session_expires_at > NOW();

-- name: ClearSessionByHash :exec
UPDATE access_requests SET session_hash = NULL, session_expires_at = NULL
WHERE session_hash = $1;

-- name: RevokeAccessRequest :one
UPDATE access_requests
SET status = 'revoked', session_hash = NULL, session_expires_at = NULL
WHERE id = $1
RETURNING *;

-- name: ListAccessRequests :many
SELECT * FROM access_requests
WHERE (sqlc.narg('status')::access_status IS NULL OR status = sqlc.narg('status')::access_status)
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;
