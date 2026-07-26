-- Localize post title, summary & body: TEXT -> JSONB shaped { "en": ..., "ru": ..., "uz": ... }.
-- Existing values are preserved under the "en" key so nothing is lost.
ALTER TABLE posts
  ALTER COLUMN title   TYPE JSONB USING jsonb_build_object('en', title),
  ALTER COLUMN summary TYPE JSONB USING jsonb_build_object('en', summary),
  ALTER COLUMN body    TYPE JSONB USING jsonb_build_object('en', body);
