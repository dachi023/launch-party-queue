import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/new";
import { countByStatus, enqueue, getTeamBySlug, listTeams } from "~/lib/db";
import { SiteHeader } from "~/components/SiteHeader";

export function meta(_: Route.MetaArgs) {
  return [{ title: "New release · Launch Party Queue" }];
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const team = await getTeamBySlug(db, params.slug);
  if (!team) throw new Response("Team not found", { status: 404 });
  const [counts, teams] = await Promise.all([
    countByStatus(db, team.id),
    listTeams(db),
  ]);
  return { team, counts, teams };
}

export async function action({ params, request, context }: Route.ActionArgs) {
  const db = context.cloudflare.env.DB;
  const team = await getTeamBySlug(db, params.slug);
  if (!team) throw new Response("Team not found", { status: 404 });
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const released_at = String(form.get("released_at") ?? "").trim();
  const note = String(form.get("note") ?? "").trim();

  const errors: Record<string, string> = {};
  if (!name) errors.name = "リリース名は必須";
  if (!released_at) errors.released_at = "リリース日は必須";
  if (Object.keys(errors).length > 0) {
    return { errors, values: { name, released_at, note } };
  }

  await enqueue(db, team.id, {
    name,
    released_at,
    note: note || null,
  });
  return redirect(`/t/${team.slug}`);
}

const FIELD =
  "w-full bg-transparent border-0 border-b border-[color:var(--ink)]/20 rounded-none px-0 py-3 text-lg placeholder:text-[color:var(--ink)]/30 focus:outline-none focus:border-[color:var(--ink)] transition";

export default function NewRelease({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const errors = actionData?.errors ?? {};
  const values = actionData?.values;
  const { team, counts, teams } = loaderData;
  const queued = counts.queued + counts.scheduled;

  return (
    <>
      <SiteHeader
        active="home"
        queued={queued}
        teams={teams}
        currentSlug={team.slug}
      />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <Link
          to={`/t/${team.slug}`}
          className="mono-label hover:text-[color:var(--ink)] transition"
        >
          ← {team.name}
        </Link>
        <h1 className="display mt-4 text-5xl tracking-[-0.03em] font-semibold">
          New release
        </h1>

        <Form method="post" className="mt-10 space-y-8">
          <div>
            <label className="mono-label block mb-1" htmlFor="name">
              Release name <span className="text-[color:var(--accent)]">*</span>
            </label>
            <input
              id="name"
              name="name"
              defaultValue={values?.name}
              placeholder="v1.4.0 — Search feature"
              className={FIELD}
            />
            {errors.name ? (
              <p className="text-[color:var(--accent)] text-xs mt-1.5">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mono-label block mb-1" htmlFor="released_at">
              Released on <span className="text-[color:var(--accent)]">*</span>
            </label>
            <input
              id="released_at"
              name="released_at"
              type="date"
              defaultValue={values?.released_at}
              className={FIELD + " tabnum"}
            />
            {errors.released_at ? (
              <p className="text-[color:var(--accent)] text-xs mt-1.5">
                {errors.released_at}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mono-label block mb-1" htmlFor="note">
              Note
            </label>
            <textarea
              id="note"
              name="note"
              rows={3}
              defaultValue={values?.note}
              placeholder="ハイライト、関係者、PR番号など"
              className={FIELD + " resize-none"}
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button type="submit" className="btn-accent">
              🚀 Enqueue
            </button>
            <Link
              to={`/t/${team.slug}`}
              className="link-arrow opacity-70 hover:opacity-100"
            >
              cancel
            </Link>
          </div>
        </Form>
      </main>
    </>
  );
}
