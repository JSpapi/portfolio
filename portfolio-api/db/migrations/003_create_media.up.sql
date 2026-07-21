CREATE TABLE media (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID        REFERENCES posts(id) ON DELETE CASCADE,
  r2_key      TEXT        NOT NULL UNIQUE,    -- object key in R2 bucket
  url         TEXT        NOT NULL,           -- public CDN URL
  mime_type   TEXT        NOT NULL,           -- image/jpeg, image/png, video/mp4, etc.
  size_bytes  BIGINT      NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_post_id ON media (post_id);
