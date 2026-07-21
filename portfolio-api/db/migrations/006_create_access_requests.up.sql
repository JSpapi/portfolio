CREATE TYPE access_status AS ENUM ('pending', 'approved', 'denied', 'revoked');

CREATE TABLE access_requests (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT          NOT NULL,
  email            TEXT          NOT NULL,
  reason           TEXT          NOT NULL DEFAULT '',   -- free-text "why do you want access"
  status           access_status NOT NULL DEFAULT 'pending',

  -- Magic link (single-use). Set on approval, cleared once consumed.
  magic_token_hash TEXT,                                 -- sha256 hex of the raw link token
  magic_expires_at TIMESTAMPTZ,                          -- link valid window (e.g. 24h from approval)
  magic_used_at    TIMESTAMPTZ,                          -- NULL until the link is clicked

  -- Access session (created when the magic link is consumed).
  session_hash       TEXT,                               -- sha256 hex of the access_session cookie value
  session_expires_at TIMESTAMPTZ,                        -- rolling session window (e.g. 30d)

  -- Anti-abuse / audit
  ip               TEXT,                                 -- request origin IP (rate limiting + audit)
  user_agent       TEXT,
  telegram_msg_id  BIGINT,                               -- Telegram message id, so we can edit the buttons on decision

  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(), -- when the form was submitted
  decided_at       TIMESTAMPTZ,                          -- when you approved/denied
  decided_by       TEXT                                  -- 'telegram' | 'admin-ui'
);

CREATE INDEX idx_access_status        ON access_requests (status);
CREATE INDEX idx_access_email         ON access_requests (lower(email));
CREATE INDEX idx_access_magic_hash    ON access_requests (magic_token_hash) WHERE magic_token_hash IS NOT NULL;
CREATE INDEX idx_access_session_hash  ON access_requests (session_hash)     WHERE session_hash    IS NOT NULL;
CREATE INDEX idx_access_created       ON access_requests (created_at DESC);
