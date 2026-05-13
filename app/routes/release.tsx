import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/release";
import {
  complete,
  countByStatus,
  getById,
  getTeamBySlug,
  listTeams,
  remove,
  reopen,
  schedule,
} from "~/lib/db";
import { SiteHeader } from "~/components/SiteHeader";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.release?.name ?? "Release";
  return [{ title: `${name} · Launch Party Queue` }];
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const team = await getTeamBySlug(db, params.slug);
  if (!team) throw new Response("Team not found", { status: 404 });
  const release = await getById(db, team.id, params.id);
  if (!release) throw new Response("Not Found", { status: 404 });
  const [counts, teams] = await Promise.all([
    countByStatus(db, team.id),
    listTeams(db),
  ]);
  return { team, release, counts, teams };
}

export async function action({ params, request, context }: Route.ActionArgs) {
  const db = context.cloudflare.env.DB;
  const team = await getTeamBySlug(db, params.slug);
  if (!team) throw new Response("Team not found", { status: 404 });
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");

  switch (intent) {
    case "schedule": {
      await schedule(db, team.id, params.id, {
        party_scheduled_at:
          String(form.get("party_scheduled_at") ?? "").trim() || null,
        party_venue: String(form.get("party_venue") ?? "").trim() || null,
        party_attendees:
          String(form.get("party_attendees") ?? "").trim() || null,
        party_memo: String(form.get("party_memo") ?? "").trim() || null,
      });
      return { ok: true, intent };
    }
    case "complete": {
      await complete(db, team.id, params.id);
      return redirect(`/t/${team.slug}?celebrate=1`);
    }
    case "reopen": {
      await reopen(db, team.id, params.id);
      return { ok: true, intent };
    }
    case "delete": {
      await remove(db, team.id, params.id);
      return redirect(`/t/${team.slug}`);
    }
    default:
      return { ok: false, intent };
  }
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const FIELD =
  "w-full bg-transparent border-0 border-b border-[color:var(--ink)]/20 rounded-none px-0 py-2.5 placeholder:text-[color:var(--ink)]/30 focus:outline-none focus:border-[color:var(--ink)] transition";

export default function ReleaseDetail({ loaderData }: Route.ComponentProps) {
  const { team, release, counts, teams } = loaderData;
  const queued = counts.queued + counts.scheduled;
  const navigation = useNavigation();
  const submitting = navigation.state !== "idle";
  const isDone = release.status === "done";

  return (
    <>
      <SiteHeader
        active="home"
        queued={queued}
        teams={teams}
        currentSlug={team.slug}
      />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Link
          to={`/t/${team.slug}`}
          className="mono-label hover:text-[color:var(--ink)] transition"
        >
          ← {team.name}
        </Link>

        <header className="mt-4 grid grid-cols-12 gap-6 items-end">
          <div className="col-span-12 sm:col-span-9">
            <div className="flex items-center gap-2">
              {isDone ? (
                <span className="chip chip-moss">Done</span>
              ) : release.status === "scheduled" ? (
                <span className="chip chip-accent">Scheduled</span>
              ) : (
                <span className="chip chip-blue">Queued</span>
              )}
              <span className="mono-label tabnum">
                Released {release.released_at}
              </span>
            </div>
            <h1 className="display mt-3 text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] tracking-[-0.03em] font-semibold">
              {release.name}
            </h1>
          </div>
          <div className="col-span-12 sm:col-span-3 flex sm:justify-end">
            <div className="text-right">
              <div
                className="text-5xl font-bold tabnum tracking-[-0.04em] leading-none"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {String(queued).padStart(2, "0")}
              </div>
              <div className="mono-label mt-2">in queue</div>
            </div>
          </div>
        </header>

        {release.note ? (
          <p className="mt-6 text-base text-[color:var(--ink)]/80 whitespace-pre-wrap max-w-prose">
            {release.note}
          </p>
        ) : null}

        <div className="divider-thick mt-12" />

        <section className="py-10">
          <div className="flex items-baseline gap-4 mb-6">
            <h2 className="display text-2xl font-semibold">飲み会の予定</h2>
            <div className="flex-1 divider self-center" />
          </div>
          <Form method="post" className="grid gap-6 sm:grid-cols-2">
            <input type="hidden" name="intent" value="schedule" />
            <div>
              <label
                className="mono-label block mb-1"
                htmlFor="party_scheduled_at"
              >
                When
              </label>
              <input
                id="party_scheduled_at"
                name="party_scheduled_at"
                type="datetime-local"
                defaultValue={toDatetimeLocal(release.party_scheduled_at)}
                className={FIELD + " tabnum"}
              />
            </div>
            <div>
              <label className="mono-label block mb-1" htmlFor="party_venue">
                Where
              </label>
              <input
                id="party_venue"
                name="party_venue"
                defaultValue={release.party_venue ?? ""}
                placeholder="渋谷の居酒屋"
                className={FIELD}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                className="mono-label block mb-1"
                htmlFor="party_attendees"
              >
                Who
              </label>
              <input
                id="party_attendees"
                name="party_attendees"
                defaultValue={release.party_attendees ?? ""}
                placeholder="@alice, @bob, @carol"
                className={FIELD}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mono-label block mb-1" htmlFor="party_memo">
                Memo
              </label>
              <textarea
                id="party_memo"
                name="party_memo"
                rows={3}
                defaultValue={release.party_memo ?? ""}
                placeholder="予算、二次会、ドレスコードなど"
                className={FIELD + " resize-none"}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-ghost"
              >
                Save plan
              </button>
            </div>
          </Form>
        </section>

        <div className="divider-thick" />

        <section className="py-10">
          <div className="flex items-baseline gap-4 mb-6">
            <h2 className="display text-2xl font-semibold">操作</h2>
            <div className="flex-1 divider self-center" />
          </div>
          <div className="flex flex-wrap gap-3">
            {!isDone ? <CelebrateButton submitting={submitting} /> : null}
            {isDone ? (
              <Form method="post">
                <input type="hidden" name="intent" value="reopen" />
                <button type="submit" className="btn-ghost">
                  ↩ Re-open
                </button>
              </Form>
            ) : null}
            <Form
              method="post"
              onSubmit={(e) => {
                if (!confirm("本当に削除しますか？")) e.preventDefault();
              }}
            >
              <input type="hidden" name="intent" value="delete" />
              <button
                type="submit"
                className="btn-ghost text-[color:var(--accent)] border-[color:var(--accent)]/40"
              >
                Delete
              </button>
            </Form>
          </div>
        </section>
      </main>
    </>
  );
}

function CelebrateButton({ submitting }: { submitting: boolean }) {
  return (
    <Form
      method="post"
      onSubmit={async () => {
        const mod = await import("~/lib/party");
        mod.fireParty();
      }}
    >
      <input type="hidden" name="intent" value="complete" />
      <button
        type="submit"
        disabled={submitting}
        className="btn-accent disabled:opacity-60"
      >
        🍾 Cheers — dequeue
      </button>
    </Form>
  );
}
