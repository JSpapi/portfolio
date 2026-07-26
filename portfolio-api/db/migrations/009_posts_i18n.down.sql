-- Revert JSONB -> TEXT, keeping the English value.
ALTER TABLE posts
  ALTER COLUMN title   TYPE TEXT USING (title ->> 'en'),
  ALTER COLUMN summary TYPE TEXT USING (summary ->> 'en'),
  ALTER COLUMN body    TYPE TEXT USING (body ->> 'en');
