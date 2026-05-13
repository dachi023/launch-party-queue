import { Link } from "react-router";
import type { Route } from "./+types/history";
import {
  countByStatus,
  getTeamBySlug,
  listDone,
  listTeams,
} from "~/lib/db";
import { SiteHeader } from "~/components/SiteHeader";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.team?.name ?? "Archive";
  return [{ title: `Archive · ${name} · Launch Party Queue` }];
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const team = await getTeamBySlug(db, params.slug);
  if (!team) throw new Response("Team not found", { status: 404 });
  const [releases, counts, teams] = await Promise.all([
    listDone(db, team.id),
    countByStatus(db, team.id),
    listTeams(db),
  ]);
  return { team, releases, counts, teams };
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export default function History({ loaderData }: Route.ComponentProps) {
  const { team, releases, counts, teams } = loaderData;
  const queued = counts.queued + counts.scheduled;

  return (
    <>
      <SiteHeader
        active="history"
        queued={queued}
        teams={teams}
        currentSlug={team.slug}
      />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <section className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-12 sm:col-span-8">
            <div className="mono-label">{team.name} · 消化済み</div>
            <h1 className="display mt-2 text-[clamp(3rem,9vw,6rem)] tracking-[-0.03em] leading-[0.95] font-semibold">
              Archive
            </h1>
          </div>
          <div className="col-span-12 sm:col-span-4 sm:text-right">
            <div className="display text-7xl font-bold tabnum tracking-[-0.04em] leading-none text-[color:var(--accent)]">
              {String(counts.done).padStart(2, "0")}
            </div>
            <div className="mono-label mt-2">本</div>
          </div>
        </section>

        <div className="divider-thick mt-12" />

        {releases.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[color:var(--ink)]/55">
              まだ消化された打ち上げはありません。
            </p>
          </div>
        ) : (
          <ul>
            {releases.map((r, i) => (
              <li key={r.id}>
                <Link
                  to={`/t/${team.slug}/releases/${r.id}`}
                  className="grid grid-cols-12 gap-4 items-center py-5 border-b border-[color:var(--ink)]/10 group transition hover:bg-white/5"
                >
                  <span className="col-span-2 sm:col-span-1 mono-label tabnum">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="display col-span-10 sm:col-span-7 text-xl sm:text-2xl tracking-[-0.02em] font-semibold group-hover:text-[color:var(--accent)] transition">
                    {r.name}
                  </span>
                  <span className="col-span-6 sm:col-span-2 mono-label tabnum">
                    {fmtDate(r.released_at)}
                  </span>
                  <span className="col-span-6 sm:col-span-2 mono-label tabnum sm:text-right">
                    🥂 {fmtDate(r.completed_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 flex justify-center">
          <Link to={`/t/${team.slug}`} className="link-arrow">
            ← Queue
          </Link>
        </div>
      </main>
    </>
  );
}
