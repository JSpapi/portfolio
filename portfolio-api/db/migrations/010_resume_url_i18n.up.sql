-- Localize the resume link: TEXT -> JSONB shaped { "en": ..., "ru": ..., "uz": ... }.
-- An existing URL is preserved under the "en" key; NULL stays NULL.
ALTER TABLE private_profile
  ALTER COLUMN resume_url TYPE JSONB
  USING CASE
    WHEN resume_url IS NULL THEN NULL
    ELSE jsonb_build_object('en', resume_url)
  END;
