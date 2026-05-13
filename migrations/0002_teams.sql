-- Multi-tenant: teams + releases.team_id
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_teams_slug ON teams(slug);
CREATE INDEX idx_teams_created_at ON teams(created_at);

-- Default team for existing data
INSERT INTO teams (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default', 'default');

-- Attach existing releases to the default team
ALTER TABLE releases ADD COLUMN team_id TEXT NOT NULL
  DEFAULT '00000000-0000-0000-0000-000000000001';

CREATE INDEX idx_releases_team_id ON releases(team_id);
CREATE INDEX idx_releases_team_status ON releases(team_id, status);
