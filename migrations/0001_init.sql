-- Releases queue: 1 release = 1 launch party
CREATE TABLE releases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  released_at TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  party_scheduled_at TEXT,
  party_venue TEXT,
  party_attendees TEXT,
  party_memo TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_releases_status ON releases(status);
CREATE INDEX idx_releases_released_at ON releases(released_at DESC);
CREATE INDEX idx_releases_party_scheduled_at ON releases(party_scheduled_at);
