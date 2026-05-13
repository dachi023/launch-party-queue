# Launch Party Queue 🎉

A tool for queueing release "launch parties". One release = one cheers.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dachi023/launch-party-queue)

## Stack

- React Router v7 (Framework Mode, SSR)
- Cloudflare Workers + D1
- Three.js (`@react-three/fiber`, `drei`, `postprocessing`)
- Tailwind CSS v4
- Bun (>= 1.3)

## Local

```bash
bun install
bun run db:migrate:local
bun run dev
```

## Deploy

### A. Deploy to Cloudflare button

Click the button at the top.

### B. Connect an existing repository to Cloudflare

1. Cloudflare Dashboard → Workers & Pages → Create → Import a repository
2. Pick this repository
3. Build command: `bun install && bun run build`
4. Deploy command: `bunx wrangler deploy && bunx wrangler d1 migrations apply launch-party-queue --remote`

### C. From your machine

```bash
bunx wrangler login
bun run deploy
```

## Routes

| Path | Purpose |
|---|---|
| `/` | Redirect to the last-opened or first team |
| `/teams/new` | Create a team |
| `/t/:slug` | Queue (home) |
| `/t/:slug/releases/new` | Enqueue a release |
| `/t/:slug/releases/:id` | Detail, scheduling, Cheers, Reopen, Delete |
| `/t/:slug/history` | Archive of completed releases |

The currently selected team is stored in the `lpq_team` cookie.

## Data model

```
teams      (id, name, slug, created_at)
releases   (id, team_id, name, released_at, note, status,
            party_scheduled_at, party_venue, party_attendees, party_memo,
            completed_at, created_at, updated_at)
```

## Scripts

| Command | Purpose |
|---|---|
| `bun run dev` | Dev server |
| `bun run build` | Production build |
| `bun run preview` | Preview the build output locally |
| `bun run deploy` | build + wrangler deploy + remote migrations |
| `bun run typecheck` | wrangler types + react-router typegen + tsc -b |
| `bun run db:migrate:local` | Apply migrations to local D1 |
| `bun run db:migrate:remote` | Apply migrations to remote D1 |

## Files

- `app/components/SiteScene.client.tsx` — main 3D scene
- `app/components/{BeerMug,BeerBottle,ChampagneBottle,ChampagneFlute,Cork,Donut,Skewer,Sushi}.tsx` — models
- `app/components/{ConfettiField,BokehLights,RisingBubbles,Streamers}.tsx` — confetti, bubbles, ribbons
- `app/app.css` — palette and utilities
- `app/lib/party.ts` — Cheers effect (canvas-confetti + Web Audio + 3D)
