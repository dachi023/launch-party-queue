import { createCookie } from "react-router";

export const teamCookie = createCookie("lpq_team", {
  path: "/",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 365,
});

export async function getRememberedTeamSlug(
  request: Request
): Promise<string | null> {
  const raw = request.headers.get("Cookie");
  const value = (await teamCookie.parse(raw)) as string | null | undefined;
  return value || null;
}

export async function rememberTeamSlug(slug: string): Promise<string> {
  return teamCookie.serialize(slug);
}
