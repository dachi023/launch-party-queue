export type ReleaseStatus = "queued" | "scheduled" | "done" | "cancelled";

export type Release = {
  id: string;
  team_id: string;
  name: string;
  released_at: string;
  note: string | null;
  status: ReleaseStatus;
  party_scheduled_at: string | null;
  party_venue: string | null;
  party_attendees: string | null;
  party_memo: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Team = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

const SELECT_COLUMNS =
  "id, team_id, name, released_at, note, status, party_scheduled_at, party_venue, party_attendees, party_memo, completed_at, created_at, updated_at";

/* ----------------- Teams ----------------- */

export async function listTeams(db: D1Database): Promise<Team[]> {
  const { results } = await db
    .prepare(
      `SELECT id, name, slug, created_at FROM teams ORDER BY created_at ASC`
    )
    .all<Team>();
  return results ?? [];
}

export async function getTeamBySlug(
  db: D1Database,
  slug: string
): Promise<Team | null> {
  const row = await db
    .prepare(`SELECT id, name, slug, created_at FROM teams WHERE slug = ?`)
    .bind(slug)
    .first<Team>();
  return row ?? null;
}

export async function getFirstTeam(db: D1Database): Promise<Team | null> {
  const row = await db
    .prepare(
      `SELECT id, name, slug, created_at FROM teams ORDER BY created_at ASC LIMIT 1`
    )
    .first<Team>();
  return row ?? null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\-぀-ヿ㐀-鿿]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "team";
}

export async function createTeam(
  db: D1Database,
  input: { name: string; slug?: string }
): Promise<Team> {
  const id = crypto.randomUUID();
  const base = slugify(input.slug || input.name);
  // ensure unique slug
  let slug = base;
  let n = 1;
  while (await getTeamBySlug(db, slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  await db
    .prepare(`INSERT INTO teams (id, name, slug) VALUES (?, ?, ?)`)
    .bind(id, input.name.trim(), slug)
    .run();
  const created = await getTeamBySlug(db, slug);
  if (!created) throw new Error("Failed to create team");
  return created;
}

/* ----------------- Releases (team-scoped) ----------------- */

export async function listActive(
  db: D1Database,
  teamId: string
): Promise<Release[]> {
  const { results } = await db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM releases
       WHERE team_id = ? AND status IN ('queued','scheduled')
       ORDER BY
         CASE WHEN party_scheduled_at IS NULL THEN 1 ELSE 0 END,
         party_scheduled_at ASC,
         released_at ASC`
    )
    .bind(teamId)
    .all<Release>();
  return results ?? [];
}

export async function listDone(
  db: D1Database,
  teamId: string
): Promise<Release[]> {
  const { results } = await db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM releases
       WHERE team_id = ? AND status = 'done'
       ORDER BY completed_at DESC`
    )
    .bind(teamId)
    .all<Release>();
  return results ?? [];
}

export async function getById(
  db: D1Database,
  teamId: string,
  id: string
): Promise<Release | null> {
  const row = await db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM releases WHERE id = ? AND team_id = ?`
    )
    .bind(id, teamId)
    .first<Release>();
  return row ?? null;
}

export async function getNextParty(
  db: D1Database,
  teamId: string
): Promise<Release | null> {
  const row = await db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM releases
       WHERE team_id = ? AND status = 'scheduled' AND party_scheduled_at IS NOT NULL
       ORDER BY party_scheduled_at ASC LIMIT 1`
    )
    .bind(teamId)
    .first<Release>();
  return row ?? null;
}

export async function getLastDone(
  db: D1Database,
  teamId: string
): Promise<Release | null> {
  const row = await db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM releases
       WHERE team_id = ? AND status = 'done' AND completed_at IS NOT NULL
       ORDER BY completed_at DESC LIMIT 1`
    )
    .bind(teamId)
    .first<Release>();
  return row ?? null;
}

export async function countByStatus(
  db: D1Database,
  teamId: string
): Promise<Record<ReleaseStatus, number>> {
  const { results } = await db
    .prepare(
      `SELECT status, COUNT(*) AS n FROM releases WHERE team_id = ? GROUP BY status`
    )
    .bind(teamId)
    .all<{ status: ReleaseStatus; n: number }>();
  const out: Record<ReleaseStatus, number> = {
    queued: 0,
    scheduled: 0,
    done: 0,
    cancelled: 0,
  };
  for (const row of results ?? []) {
    out[row.status] = row.n;
  }
  return out;
}

export type EnqueueInput = {
  name: string;
  released_at: string;
  note?: string | null;
};

export async function enqueue(
  db: D1Database,
  teamId: string,
  input: EnqueueInput
): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO releases (id, team_id, name, released_at, note, status)
       VALUES (?, ?, ?, ?, ?, 'queued')`
    )
    .bind(id, teamId, input.name, input.released_at, input.note ?? null)
    .run();
  return id;
}

export type ScheduleInput = {
  party_scheduled_at: string | null;
  party_venue: string | null;
  party_attendees: string | null;
  party_memo: string | null;
};

export async function schedule(
  db: D1Database,
  teamId: string,
  id: string,
  input: ScheduleInput
): Promise<void> {
  const hasSchedule = !!input.party_scheduled_at;
  await db
    .prepare(
      `UPDATE releases
       SET party_scheduled_at = ?,
           party_venue = ?,
           party_attendees = ?,
           party_memo = ?,
           status = CASE WHEN status IN ('queued','scheduled') THEN ? ELSE status END,
           updated_at = datetime('now')
       WHERE id = ? AND team_id = ?`
    )
    .bind(
      input.party_scheduled_at,
      input.party_venue,
      input.party_attendees,
      input.party_memo,
      hasSchedule ? "scheduled" : "queued",
      id,
      teamId
    )
    .run();
}

export async function complete(
  db: D1Database,
  teamId: string,
  id: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE releases
       SET status = 'done',
           completed_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = ? AND team_id = ? AND status IN ('queued','scheduled')`
    )
    .bind(id, teamId)
    .run();
}

export async function reopen(
  db: D1Database,
  teamId: string,
  id: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE releases
       SET status = CASE WHEN party_scheduled_at IS NOT NULL THEN 'scheduled' ELSE 'queued' END,
           completed_at = NULL,
           updated_at = datetime('now')
       WHERE id = ? AND team_id = ? AND status = 'done'`
    )
    .bind(id, teamId)
    .run();
}

export async function remove(
  db: D1Database,
  teamId: string,
  id: string
): Promise<void> {
  await db
    .prepare(`DELETE FROM releases WHERE id = ? AND team_id = ?`)
    .bind(id, teamId)
    .run();
}
