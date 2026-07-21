CREATE TABLE projects (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        NOT NULL UNIQUE,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  url_live    TEXT,                            -- live demo URL, nullable
  url_repo    TEXT,                            -- GitHub repo URL, nullable
  featured    BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order  INT         NOT NULL DEFAULT 0,  -- manual ordering in admin
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_sort ON projects (sort_order ASC);
