CREATE TYPE post_type AS ENUM ('weekly', 'daily', 'deep-dive', 'til');

CREATE TABLE posts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT        NOT NULL UNIQUE,
  type          post_type   NOT NULL DEFAULT 'weekly',
  title         TEXT        NOT NULL,
  summary       TEXT        NOT NULL,          -- 2-3 sentence teaser, shown on list page
  body          TEXT        NOT NULL,          -- raw Markdown, may contain R2 URLs
  tags          TEXT[]      NOT NULL DEFAULT '{}',
  reading_time  INT         NOT NULL DEFAULT 0, -- computed: ceil(word_count / 200)
  published_at  TIMESTAMPTZ,                   -- NULL = draft; set on publish
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_published ON posts (published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_posts_tags      ON posts USING GIN (tags);
CREATE INDEX idx_posts_type      ON posts (type);
