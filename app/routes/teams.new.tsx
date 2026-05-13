import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/teams.new";
import { createTeam, listTeams } from "~/lib/db";
import { rememberTeamSlug } from "~/lib/cookies";
import { SiteHeader } from "~/components/SiteHeader";

export function meta(_: Route.MetaArgs) {
  return [{ title: "New team · Launch Party Queue" }];
}

export async function loader({ context }: Route.LoaderArgs) {
  const teams = await listTeams(context.cloudflare.env.DB);
  return { teams };
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim();
  const errors: Record<string, string> = {};
  if (!name) errors.name = "チーム名は必須です";
  if (Object.keys(errors).length > 0) {
    return { errors, values: { name, slug } };
  }
  const team = await createTeam(context.cloudflare.env.DB, {
    name,
    slug: slug || undefined,
  });
  return redirect(`/t/${team.slug}`, {
    headers: { "Set-Cookie": await rememberTeamSlug(team.slug) },
  });
}

const FIELD =
  "w-full bg-transparent border-0 border-b border-[color:var(--ink)]/20 rounded-none px-0 py-3 text-lg placeholder:text-[color:var(--ink)]/30 focus:outline-none focus:border-[color:var(--ink)] transition";

export default function NewTeam({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const errors = actionData?.errors ?? {};
  const values = actionData?.values;
  const teams = loaderData.teams;

  return (
    <>
      <SiteHeader active="home" queued={0} teams={teams} currentSlug={null} />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="mono-label hover:text-[color:var(--ink)] transition"
        >
          ← Back
        </Link>
        <h1 className="display mt-4 text-5xl tracking-[-0.03em] font-semibold">
          New team
        </h1>
        <p className="text-sm text-[color:var(--ink)]/65 mt-2">
          チームを作るとリリースキューが分かれます。
        </p>

        <Form method="post" className="mt-10 space-y-8">
          <div>
            <label className="mono-label block mb-1" htmlFor="name">
              Name <span className="text-[color:var(--accent)]">*</span>
            </label>
            <input
              id="name"
              name="name"
              defaultValue={values?.name}
              placeholder="プラットフォーム部"
              className={FIELD}
            />
            {errors.name ? (
              <p className="text-[color:var(--accent)] text-xs mt-1.5">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mono-label block mb-1" htmlFor="slug">
              Slug (任意)
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={values?.slug}
              placeholder="platform (省略時はnameから自動生成)"
              className={FIELD}
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button type="submit" className="btn-accent">
              ＋ Create team
            </button>
            <Link to="/" className="link-arrow opacity-70 hover:opacity-100">
              cancel
            </Link>
          </div>
        </Form>

        {teams.length > 0 ? (
          <section className="mt-16">
            <div className="mono-label mb-3">Existing teams</div>
            <ul className="space-y-2">
              {teams.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/t/${t.slug}`}
                    className="flex items-baseline justify-between py-2 border-b border-[color:var(--ink)]/10 hover:text-[color:var(--accent)] transition"
                  >
                    <span className="display text-lg font-semibold">
                      {t.name}
                    </span>
                    <span className="mono-label tabnum">/{t.slug}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </>
  );
}
