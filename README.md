# Launch Party Queue 🎉

リリースの「打ち上げ」をキューイングするツール。1リリース = 1乾杯。

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

### A. Deploy to Cloudflare ボタン

冒頭のボタンを押す。

### B. 既存リポジトリを Cloudflare に接続

1. Cloudflare Dashboard → Workers & Pages → Create → Import a repository
2. このリポジトリを選択
3. Build command: `bun install && bun run build`
4. Deploy command: `bunx wrangler deploy && bunx wrangler d1 migrations apply launch-party-queue --remote`

### C. 手元から

```bash
bunx wrangler login
bun run deploy
```

## Routes

| Path | 役割 |
|---|---|
| `/` | 最後に開いた / 最初のチームへリダイレクト |
| `/teams/new` | チームを作成 |
| `/t/:slug` | キュー (ホーム) |
| `/t/:slug/releases/new` | リリースを enqueue |
| `/t/:slug/releases/:id` | 詳細・予定登録・Cheers・Reopen・Delete |
| `/t/:slug/history` | 消化済みアーカイブ |

選択中のチームは `lpq_team` Cookie に保存される。

## Data model

```
teams      (id, name, slug, created_at)
releases   (id, team_id, name, released_at, note, status,
            party_scheduled_at, party_venue, party_attendees, party_memo,
            completed_at, created_at, updated_at)
```

## Scripts

| Command | 役割 |
|---|---|
| `bun run dev` | 開発サーバー |
| `bun run build` | 本番ビルド |
| `bun run preview` | ビルド成果物をローカルプレビュー |
| `bun run deploy` | build + wrangler deploy + リモートマイグレーション |
| `bun run typecheck` | wrangler types + react-router typegen + tsc -b |
| `bun run db:migrate:local` | ローカル D1 にマイグレーション適用 |
| `bun run db:migrate:remote` | リモート D1 にマイグレーション適用 |

## Files

- `app/components/SiteScene.client.tsx` — 3Dシーン本体
- `app/components/{BeerMug,BeerBottle,ChampagneBottle,ChampagneFlute,Cork,Donut,Skewer,Sushi}.tsx` — モデル
- `app/components/{ConfettiField,BokehLights,RisingBubbles,Streamers}.tsx` — 紙吹雪・泡・リボン
- `app/app.css` — 配色とユーティリティ
- `app/lib/party.ts` — Cheers 時の演出 (canvas-confetti + Web Audio + 3D)
