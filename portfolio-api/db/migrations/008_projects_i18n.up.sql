-- Localize project title & description: TEXT -> JSONB shaped { "en": ..., "ru": ..., "uz": ... }.
-- Existing values are preserved under the "en" key so nothing is lost.
ALTER TABLE projects
  ALTER COLUMN title TYPE JSONB USING jsonb_build_object('en', title),
  ALTER COLUMN description TYPE JSONB USING jsonb_build_object('en', description);
