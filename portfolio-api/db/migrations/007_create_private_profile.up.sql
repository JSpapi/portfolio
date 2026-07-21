CREATE TABLE private_profile (
  id                INT         PRIMARY KEY DEFAULT 1,
  cv_markdown       TEXT        NOT NULL DEFAULT '',   -- detailed CV / career history (Markdown)
  projects_markdown TEXT        NOT NULL DEFAULT '',   -- deep project breakdowns (Markdown)
  contact_markdown  TEXT        NOT NULL DEFAULT '',   -- contact + availability + salary/work prefs (Markdown)
  resume_url        TEXT,                              -- R2 URL of downloadable resume PDF (nullable)
  references_json   JSONB       NOT NULL DEFAULT '[]', -- [{ name, relation, contact }]
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT single_row_pp CHECK (id = 1)
);

INSERT INTO private_profile (cv_markdown)
VALUES ('# Private profile — fill me in from /admin/private-profile');
