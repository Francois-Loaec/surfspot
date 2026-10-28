CREATE TABLE IF NOT EXISTS spots (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  wave_height TEXT NOT NULL,
  wind TEXT NOT NULL,
  conditions TEXT NOT NULL,
  name_key TEXT NOT NULL,
  location_key TEXT NOT NULL,
  CONSTRAINT spots_demo_identity_unique UNIQUE (name_key, location_key)
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  spot_id INTEGER NOT NULL REFERENCES spots (id) ON DELETE RESTRICT,
  session_date DATE NOT NULL,
  note TEXT CHECK (note IS NULL OR char_length(note) <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_sessions_date
  ON sessions (session_date DESC, id DESC);
