-- Gratitude notes and gospel readings.

-- Gratitude -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gratitude_entry (
  id         TEXT PRIMARY KEY,
  date       TEXT NOT NULL,
  text       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gratitude_entry_date ON gratitude_entry (date);

-- Gospel --------------------------------------------------------------------

-- One row per chapter marked as read. `book` and `chapter` point into the bundled text;
-- `date` is the local day the reading was done.
CREATE TABLE IF NOT EXISTS gospel_reading (
  id         TEXT PRIMARY KEY,
  date       TEXT NOT NULL,
  book       TEXT NOT NULL CHECK (book IN ('mateo', 'marcos', 'lucas', 'juan')),
  chapter    INTEGER NOT NULL CHECK (chapter >= 1),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gospel_reading_date ON gospel_reading (date);
