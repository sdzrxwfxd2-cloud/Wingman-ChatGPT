-- Visitor log schema for D1 (preferred store).
-- Free tier (2026): 5 million row-reads/day, 100,000 row-writes/day, 5 GB storage.
-- Retention is enforced in code (90 days).
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  sid TEXT,
  n INTEGER,
  path TEXT,
  ref TEXT,
  ip TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  continent TEXT,
  ua TEXT,
  device_type TEXT,
  device_model TEXT,
  browser TEXT,
  os TEXT,
  os_ver TEXT,
  screen TEXT,
  viewport TEXT,
  lang TEXT,
  tz TEXT,
  dpr REAL,
  net TEXT
);
CREATE INDEX IF NOT EXISTS visits_ts ON visits(ts);
CREATE INDEX IF NOT EXISTS visits_sid ON visits(sid);
CREATE INDEX IF NOT EXISTS visits_path ON visits(path);
CREATE INDEX IF NOT EXISTS visits_country ON visits(country);
CREATE INDEX IF NOT EXISTS visits_device ON visits(device_type);
