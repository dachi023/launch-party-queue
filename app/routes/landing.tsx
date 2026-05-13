import { redirect } from "react-router";
import type { Route } from "./+types/landing";
import { getFirstTeam, getTeamBySlug } from "~/lib/db";
import { getRememberedTeamSlug } from "~/lib/cookies";

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const remembered = await getRememberedTeamSlug(request);
  if (remembered) {
    const team = await getTeamBySlug(db, remembered);
    if (team) throw redirect(`/t/${team.slug}`);
  }
  const first = await getFirstTeam(db);
  if (first) throw redirect(`/t/${first.slug}`);
  throw redirect("/teams/new");
}

export default function Landing() {
  return null;
}
