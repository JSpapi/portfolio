-- Revert JSONB -> TEXT, keeping the English URL.
ALTER TABLE private_profile
  ALTER COLUMN resume_url TYPE TEXT USING (resume_url ->> 'en');
