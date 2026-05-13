# Launch Party Queue 🎉

リリースの「打ち上げ」をキューイングして、ちゃんと消化するためのツール。
1リリース = 1乾杯。リリースを enqueue → 飲み会を計画 → 当日 Cheers ボタンで dequeue、そのまま履歴に積まれていきます。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dachi023/launch-party-queue)

ボタンを押すと、Cloudflare がこのリポジトリをあなたの GitHub にフォークし、Worker と D1 データベースを自動でプロビジョニングします。

## 機能

- リリースを enqueue / 飲み会の予定 (日時・場所・参加者・メモ) を登録
- Cheers ボタンで dequeue → 紙吹雪 + Web Audio クラッカー音 + 全画面3D演出
- 履歴 (Archive) でいつ・誰と乾杯したか振り返り
- マルチテナント (チーム単位でキューを分離) — `/t/{slug}/...`
- 3D 演出: シャンパンボトル / ビール / 寿司 / 焼き鳥 / ドーナツ等が背景でゆっくり降ってくる

## 技術スタック

- [React Router v7](https://reactrouter.com/) (Framework Mode, SSR)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) + [Vite Plugin](https://developers.cloudflare.com/workers/vite-plugin/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
- [Three.js](https://threejs.org/) + [@react-three/fiber](https://r3f.docs.pmnd.rs/) + [drei](https://github.com/pmndrs/drei) + [postprocessing](https://github.com/pmndrs/postprocessing)
- [Tailwind CSS v4](https://tailwindcss.com/)
- Package manager: [Bun](https://bun.sh/) (>= 1.3)

## ローカル開発

```bash
# 依存をインストール
bun install

# ローカル D1 にスキーマを適用
bun run db:migrate:local

# 開発サーバー (HMR + ローカル D1 エミュレーション)
bun run dev
```

`http://localhost:5173` (使用中なら 5174…) で開きます。
ローカルでは `wrangler.jsonc` の `database_id` はダミーUUIDのまま動作するので、Cloudflare ログインは不要です。

## 本番デプロイ (手動)

Deploy ボタンを使わず手動でやる場合:

```bash
# 1. D1 を作成
bunx wrangler d1 create launch-party-queue
#    → 出力された database_id を wrangler.jsonc に貼り付け

# 2. ビルド + デプロイ + リモート D1 マイグレーション (一発)
bun run deploy
```

`bun run deploy` は `react-router build` → `wrangler deploy` → `wrangler d1 migrations apply launch-party-queue --remote` を直列で実行します。

## ルーティング

```
/                           → 最後に開いた / 最初のチームへリダイレクト
/teams/new                  → 新しいチームを作成
/t/:slug                    → そのチームのキュー (ホーム)
/t/:slug/releases/new       → リリースを enqueue
/t/:slug/releases/:id       → 詳細 + 飲み会の予定 / Cheers / Reopen / Delete
/t/:slug/history            → 消化済みアーカイブ
```

選択中のチームは `lpq_team` Cookie に保存されます (1年有効、SameSite=Lax)。

## データモデル

```
teams (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  created_at TEXT
)

releases (
  id                   TEXT PRIMARY KEY,
  team_id              TEXT NOT NULL,
  name                 TEXT NOT NULL,
  released_at          TEXT NOT NULL,
  note                 TEXT,
  status               TEXT NOT NULL,    -- queued | scheduled | done | cancelled
  party_scheduled_at   TEXT,
  party_venue          TEXT,
  party_attendees      TEXT,
  party_memo           TEXT,
  completed_at         TEXT,
  created_at           TEXT,
  updated_at           TEXT
)
```

`migrations/` 配下に SQL マイグレーションが入っており、`wrangler d1 migrations` が管理します。

## 主要コマンド

| コマンド | 役割 |
|---|---|
| `bun run dev` | 開発サーバー (Vite HMR + ローカル D1) |
| `bun run build` | 本番ビルド |
| `bun run preview` | ビルド成果物をローカルプレビュー |
| `bun run deploy` | ビルド → Workers デプロイ → リモート D1 マイグレーション |
| `bun run typecheck` | wrangler types + react-router typegen + tsc -b |
| `bun run db:migrate:local` | ローカル D1 にマイグレーション適用 |
| `bun run db:migrate:remote` | リモート D1 にマイグレーション適用 |

## カスタマイズ

- 3D シーンの構成: `app/components/SiteScene.client.tsx`
- 食べ物・飲み物のモデル: `app/components/{BeerMug,BeerBottle,ChampagneBottle,ChampagneFlute,Cork,Donut,Skewer,Sushi}.tsx`
- 紙吹雪・泡・リボン: `app/components/{ConfettiField,BokehLights,RisingBubbles,Streamers}.tsx`
- 配色 (ダーク + 4色アクセント): `app/app.css` の `:root` 変数
- 演出 (紙吹雪 + Web Audio + 全画面3D): `app/lib/party.ts`
