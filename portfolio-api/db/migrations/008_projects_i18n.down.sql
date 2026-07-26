-- Revert JSONB -> TEXT, keeping the English value.
ALTER TABLE projects
  ALTER COLUMN title TYPE TEXT USING (title ->> 'en'),
  ALTER COLUMN description TYPE TEXT USING (description ->> 'en');
