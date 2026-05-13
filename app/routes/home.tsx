import { data, Link } from "react-router";
import type { Route } from "./+types/home";
import {
  countByStatus,
  getLastDone,
  getNextParty,
  getTeamBySlug,
  listActive,
  listTeams,
} from "~/lib/db";
import { rememberTeamSlug } from "~/lib/cookies";
import { SiteHeader } from "~/components/SiteHeader";
import { ReleaseCard } from "~/components/ReleaseCard";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.team?.name ?? "Launch Party Queue";
  return [{ title: `${name} · Launch Party Queue` }];
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const team = await getTeamBySlug(db, params.slug);
  if (!team) throw new Response("Team not found", { status: 404 });
  const [releases, counts, nextParty, lastDone, teams] = await Promise.all([
    listActive(db, team.id),
    countByStatus(db, team.id),
    getNextParty(db, team.id),
    getLastDone(db, team.id),
    listTeams(db),
  ]);
  return data(
    { team, releases, counts, nextParty, lastDone, teams },
    { headers: { "Set-Cookie": await rememberTeamSlug(team.slug) } }
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "TBD";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function daysFromNow(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = d.getTime() - Date.now();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days > 0) return `in ${days}d`;
  return `${Math.abs(days)}d ago`;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { team, releases, counts, nextParty, lastDone, teams } = loaderData;
  const queued = counts.queued + counts.scheduled;
  const total = counts.queued + counts.scheduled + counts.done;
  const progress = total === 0 ? 0 : Math.round((counts.done / total) * 100);

  return (
    <>
      <SiteHeader
        active="home"
        queued={queued}
        teams={teams}
        currentSlug={team.slug}
      />
      <main className="max-w-7xl mx-auto px-6 lg:grid lg:grid-cols-[6fr_4fr] lg:gap-10 lg:overflow-hidden">
        <aside className="py-10 lg:py-12 lg:h-[calc(100dvh-68px)] lg:overflow-y-auto lg:pr-6 lg:pl-1 flex flex-col gap-8">
          <div>
            <div className="mono-label">{team.name} · 未消化の打ち上げ</div>
            <div className="display mt-2 font-bold tabnum tracking-[-0.04em] leading-none text-[clamp(5rem,14vw,11rem)]">
              {String(queued).padStart(2, "0")}
              <span className="text-[0.35em] align-top ml-3 text-[color:var(--ink)]/40">
                本
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="mono-label">消化率</span>
              <span className="display tabnum text-sm font-semibold">
                {progress}%
              </span>
            </div>
            <div className="relative h-3 rounded-full bg-white/70 border-2 border-[color:var(--ink)] overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[color:var(--accent)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-[color:var(--ink)]/55 tabnum">
              <span>{counts.done} 消化済み</span>
              <span>{queued} 未消化</span>
            </div>
          </div>

          <dl className="grid grid-cols-4 gap-4 max-w-md">
            <Stat label="Scheduled" value={counts.scheduled} />
            <Stat label="Queued" value={counts.queued} />
            <Stat label="Done" value={counts.done} tone="accent" />
            <Stat label="Cancelled" value={counts.cancelled} tone="muted" />
          </dl>

          <Block label="Next party 🍻" empty="予定されている飲み会はありません。">
            {nextParty ? (
              <Link
                to={`/t/${team.slug}/releases/${nextParty.id}`}
                className="block hover:text-[color:var(--accent)] transition"
              >
                <div className="flex items-baseline gap-2">
                  <span className="display text-xl font-semibold tracking-tight truncate">
                    {nextParty.name}
                  </span>
                  <span className="mono-label tabnum shrink-0">
                    {daysFromNow(nextParty.party_scheduled_at)}
                  </span>
                </div>
                <div className="mt-1 text-sm text-[color:var(--ink)]/70 flex items-center gap-3 flex-wrap">
                  <span className="tabnum">
                    {fmtDateTime(nextParty.party_scheduled_at)}
                  </span>
                  {nextParty.party_venue ? (
                    <span className="truncate">@ {nextParty.party_venue}</span>
                  ) : null}
                </div>
              </Link>
            ) : null}
          </Block>

          <Block label="Last cheers 🥂" empty="まだ乾杯した打ち上げはありません。">
            {lastDone ? (
              <Link
                to={`/t/${team.slug}/releases/${lastDone.id}`}
                className="block hover:text-[color:var(--accent)] transition"
              >
                <div className="flex items-baseline gap-2">
                  <span className="display text-xl font-semibold tracking-tight truncate">
                    {lastDone.name}
                  </span>
                  <span className="mono-label tabnum shrink-0">
                    {daysFromNow(lastDone.completed_at)}
                  </span>
                </div>
                <div className="mt-1 text-sm text-[color:var(--ink)]/70 tabnum">
                  乾杯 {fmtDate(lastDone.completed_at)} · リリース{" "}
                  {fmtDate(lastDone.released_at)}
                </div>
              </Link>
            ) : null}
          </Block>

          <div className="flex flex-wrap gap-3 mt-auto">
            <Link to={`/t/${team.slug}/releases/new`} className="btn-accent">
              ＋ New release
            </Link>
          </div>
        </aside>

        <section className="pb-10 lg:py-12 lg:h-[calc(100dvh-68px)] lg:overflow-y-auto lg:pl-6 lg:pr-2 lg:border-l lg:border-[color:var(--ink)]/10">
          <div className="sticky top-0 flex items-baseline gap-3 pb-4 z-10">
            <h2 className="display text-2xl font-semibold">
              <span className="serif">Queue</span>
            </h2>
            <div className="flex-1 divider self-center" />
            <span className="mono-label tabnum">
              {String(queued).padStart(2, "0")} items
            </span>
          </div>

          {releases.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-[color:var(--ink)]/55">キューは空です。</p>
            </div>
          ) : (
            <ul className="space-y-3 pb-6 pr-2 pl-1">
              {releases.map((r, i) => (
                <ReleaseCard
                  key={r.id}
                  release={r}
                  index={i}
                  teamSlug={team.slug}
                />
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "accent" | "muted";
}) {
  const color =
    tone === "accent"
      ? "text-[color:var(--accent)]"
      : tone === "muted"
        ? "text-[color:var(--ink)]/40"
        : "";
  return (
    <div>
      <dt className="mono-label">{label}</dt>
      <dd className={`display text-2xl font-semibold tabnum mt-0.5 ${color}`}>
        {String(value).padStart(2, "0")}
      </dd>
    </div>
  );
}

function Block({
  label,
  children,
  empty,
}: {
  label: string;
  children: React.ReactNode;
  empty: string;
}) {
  const hasContent =
    children !== null && children !== undefined && children !== false;
  return (
    <div>
      <div className="mono-label mb-2">{label}</div>
      <div className="paper-card rounded-2xl p-4">
        {hasContent ? children : (
          <p className="text-sm text-[color:var(--ink)]/55">{empty}</p>
        )}
      </div>
    </div>
  );
}
