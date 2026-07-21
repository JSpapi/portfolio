CREATE TABLE now (
  id         INT         PRIMARY KEY DEFAULT 1,  -- always exactly one row
  body       TEXT        NOT NULL,               -- short Markdown or plain text
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO now (body) VALUES ('Setting up this portfolio.');
