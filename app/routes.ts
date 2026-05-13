import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/landing.tsx"),
  route("teams/new", "routes/teams.new.tsx"),
  route("t/:slug", "routes/home.tsx"),
  route("t/:slug/releases/new", "routes/new.tsx"),
  route("t/:slug/releases/:id", "routes/release.tsx"),
  route("t/:slug/history", "routes/history.tsx"),
] satisfies RouteConfig;
