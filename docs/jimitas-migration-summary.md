# jimitas.com ドメイン移行 作業記録

**作業日**: 2026-04-26
**対象プロジェクト**: jimitas-new (Vercel / Next.js 16 / App Router)
**作業者**: Jimitas (claude.ai と対話しながら実施)

---

## TL;DR

旧 WordPress(さくらレンタルサーバ)で運用していた `jimitas.com` を、新 Next.js プロジェクト `jimitas-new` (Vercel) に移行完了。Google Search Console の登録・サイトマップ送信まで完了。旧 WordPress データはさくらサーバ上に温存(将来削除予定)。

その後、Claude Code セッションで残課題を順次解消（後述「0. 追加対応」参照）。

---

## 0. 追加対応の記録（Claude Code セッション、2026-04-26）

claude.ai でこの記録を作成した後、Claude Code で以下を順次実施・完了した。

### Phase 1: 静的HTMLパスのリダイレクト追加（next.config.ts）

motto-gakushu.netlify.app の調査で、旧さくらサーバー上に追加の静的HTMLが4つあったことが判明。`next.config.ts` の `redirects()` に追加:

- `/round-off` → `/shishagonyu`（四捨五入アプリに対応）
- `/fushidukuri` → `/`（未移植）
- `/eawase` → `/`（未移植）
- `/nandemo` → `/`（未移植）

### Phase 2: 三角比アプリの移植

- 旧 `triangle-ratio.vercel.app`（vanilla HTML/JS）を `/triangle-ratio` として jimitas-new に移植
- 3モード（比率・辺・角度）+ SVG 三角形の React + Tailwind 実装
- `apps.ts` に追加（subjects: ["その他"]、grades: ["中学", "高校"]）
- `layout.tsx` で `getAppMetadata` / `getAppJsonLd` を使い SEO・JSON-LD も既存パターンと統一

### Phase 3: 個別デプロイ22件にソフト誘導バナーを設置

旧 `jimitas.com` に紐付いていた個別デプロイ（Vercel/Netlify）に、ソフト誘導バナーを設置。301リダイレクトではなく、旧アプリは引き続き動作させたまま、ページ最上部に「jimitas.com に集約しました」と案内する黄色いバナー（HTML スニペット or React コンポーネント）を追加。

| 種別 | 件数 | 編集対象 |
|---|---|---|
| 静的HTML（Netlify/Vercel） | 19件 | `index.html` の `<body>` 直後 |
| Next.js Pages Router | 3件 | `src/pages/_app.tsx` に `MigrationBanner` 追加 |
| 合計 | **22件** | |

各バナーは「将来削除予定」と添えて段階的撤去を予告。具体的な日付はぼかしてある。

### 除外したもの

- **`motto-gakushu`**: ランディング集約ページ。jimitas-new に未移植のため放置（メモリ参照: `project_unported_apps_todo.md`）
- **`jimitas.vercel.app`**: 旧 jimitas.com がブログだった時代のアプリ用短縮URL。jimitas.com が新サイトになり役目を終えたため、ユーザーが Vercel ダッシュボードから直接プロジェクト削除予定

---

## 1. 完了済みタスク（claude.ai セッション時点）

### 1.1 Vercel 側

- `jimitas-new` プロジェクトに以下のドメインを追加
  - `jimitas.com` → **Production(正規)**
  - `www.jimitas.com` → **308 Permanent Redirect → jimitas.com**
  - `jimitas-new.vercel.app` (デフォルト) → Production
- 正規ドメインは **apex (`jimitas.com`)** で統一
- Vercel ダッシュボード上で `Valid Configuration` を確認済み

### 1.2 DNS(さくらのドメイン)

`jimitas.com` のゾーン情報を以下の状態に整理:

```
@     NS      ns1.dns.ne.jp.
@     NS      ns2.dns.ne.jp.
@     A       76.76.21.21
@     TXT     "google-site-verification=aXwadrEaP8NsDADgbUFHwNCpwF1R4cfUdB35pu1AtlA"
www   CNAME   cname.vercel-dns.com.
```

#### 削除済みのレコード(旧 WordPress 用)

- `@ A 59.106.13.76`(さくら旧サーバ向け、書き換え済み)
- `@ MX 10 @`(jimitas.com のメールは未使用と確認したため削除)
- `@ CAA 0 issue "letsencrypt.org"`(Vercel SSL 発行を阻害する可能性のため削除)
- `mail CNAME @`(削除)
- `ftp CNAME @`(削除)

ネームサーバは `NS1.DNS.NE.JP / NS2.DNS.NE.JP`(さくらのドメイン専用 DNS)を継続使用。

### 1.3 Google Search Console

- **プロパティ**: ドメインプロパティ `jimitas.com` を新規登録
- **所有権確認**: 上記 TXT レコードで完了
- **サイトマップ送信**: `https://jimitas.com/sitemap.xml` → ステータス「成功しました」、検出 **43 ページ**
- 旧 `https://jimitas.com/sitemap_index.xml`(旧 WordPress 用、33 ページ検出)は登録残置(放置で害なし、いずれ取得失敗になる)
- 主要 URL のインデックス登録: `https://jimitas.com/` は既にインデックス済み(Google が認識する正規 URL も apex で一致)

### 1.4 動作確認済み

- `https://jimitas.com/` → 新サイト表示 OK
- `https://jimitas.com/sitemap.xml` → 200 OK、43 件の URL を返す(curl/Vercel API で確認)
- `https://jimitas.com/robots.txt` → 配信中(`robots.ts` から自動生成)
- `nslookup` で `jimitas.com → 76.76.21.21`、`www.jimitas.com → cname.vercel-dns.com` を確認

---

## 2. 新サイトの状態(claude.ai セッションで把握済み)

Claude Code が前段階でコードベースを調査した結果のサマリ:

### 2.1 ルーティング構造(43 ページ)

| 種別 | パス | 件数 |
|---|---|---|
| トップ | `/` | 1 |
| 静的 | `/about` | 1 |
| 静的(`(apps)` route group 内、URL はフラット) | `/<app-id>` | 41 |
| 動的 | `/jimipri/[printId]` | 1(実体は 39 プリント、`generateStaticParams` 未定義) |

### 2.2 ビルド・SEO 関連

- `next.config.ts`: `output: 'export'` なし、`redirects()` で `/kanji /kanji/ → /kanji-test` を既設定
- `src/app/sitemap.ts`: 既存・正常動作中(ただし `[printId]` の 39 プリントは未反映 ← **後述の課題**)
- `src/app/robots.ts`: 既存・正常
- `src/app/llms.txt/route.ts`: AI クローラー向けファイル既存
- `src/app/layout.tsx`: metadata(title/description/OGP/metadataBase)完備
- `src/lib/seo.ts`: アプリ用の `getAppMetadata` / `getAppJsonLd`(JSON-LD)ヘルパー
- `next-sitemap` パッケージ未使用(App Router 規約で動的生成)
- i18n 未対応(日本語のみ)

### 2.3 ドメインのハードコード

`https://jimitas.com`(apex)が 5 ファイルにハードコード。環境変数化はされていないが、apex を正規にしたので**整合性は取れている状態**。

- `src/lib/seo.ts:17`
- `src/app/sitemap.ts:12`
- `src/app/robots.ts:11`
- `src/app/layout.tsx:92`
- `src/app/llms.txt/route.ts:46, 65`

### 2.4 パッケージ

- `next: 16.2.0`
- `react: 19.2.4`
- `typescript: ^5`

---

## 3. 残っている課題(優先度順)

### 🔥 課題 A: sitemap.ts に `[printId]` 動的ルートの 39 プリントが含まれていない

**状況**: `/jimipri` 1 件は sitemap に入っているが、`/jimipri/[printId]` 配下の 39 個の個別プリントページが含まれていない。Google に発見されにくい状態。

**ソース**: `src/app/(apps)/jimipri/_lib/prints.ts` の `ALL_PRINTS` 配列(id 例: `nanbanme`, `tasu-1`, `hiku-1`, `nanji-1`, `3tuno`, … `hirei` の 39 件)。`isImplemented(printDef)` 関数で実装済み判定が可能。

**対応案**: `src/app/sitemap.ts` を以下のように修正してデプロイ。

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from "next"
import { apps } from "@/data/apps"
import { ALL_PRINTS, isImplemented } from "@/app/(apps)/jimipri/_lib/prints"

const SITE_URL = "https://jimitas.com"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ]

  const appPages: MetadataRoute.Sitemap = apps
    .filter(app => !app.disabled)
    .map(app => ({
      url: `${SITE_URL}${app.path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }))

  const printPages: MetadataRoute.Sitemap = ALL_PRINTS
    .filter(p => isImplemented(p))
    .map(p => ({
      url: `${SITE_URL}/jimipri/${p.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))

  return [...staticPages, ...appPages, ...printPages]
}
```

**期待値**: 修正後デプロイで sitemap が 43 → 約 82 URL に増加。Search Console で再送信(または自動再取得待ち)。

### 🟡 課題 B: 旧 WordPress 記事からのリダイレクト戦略

**状況**: 旧 WordPress 時代の URL(WordPress + Yoast SEO 構成、子サイトマップは `category-sitemap.xml`(7) / `page-sitemap.xml`(1) / `post-sitemap.xml`(25)で計 33 ページ)が Google 検索結果に残っている。新サイトに同名 URL は存在せず 404 になる。

**今後の判断方法**:

1. しばらく(2〜4 週間)Search Console の「ページ → 未登録」レポートを観察
2. アクセスがあった旧 URL を特定
3. 必要に応じて `next.config.ts` の `redirects()` に追加
4. 既設定済みの例: `/kanji /kanji/ → /kanji-test`

**注意**: 旧 URL の中には日本語パーセントエンコード(例: `%e3%81%9f%e3%81%97%e7%ae%97...`)を含むものがあると予想される。`next.config.ts` のコメントに既に雛形あり。

### 🟢 課題 C: 旧 WordPress データの取り扱い

**状況**: 旧 WordPress は `/home/welove73/www/jimitas.com/`(さくらレンタルサーバ)に温存。DNS 切替後は外部からアクセス不能(到達経路がない)。UpdraftPlus による分割バックアップが Google Drive / Dropbox に保存済み。

**今後の方針**:
- しばらく放置(SSL 自動更新失敗の警告メールが届く可能性あるが無視で OK)
- 数ヶ月後、旧 URL からのアクセスが落ち着いたらさくらレンタルサーバ自体を解約
- 「**さくらのドメイン**」(`jimitas.com` 本体の登録)は**継続契約必須** ← レンタルサーバとは別契約
- 必要なら `db.gz` から記事本文を Markdown 化して新サイトに `/blog/` セクションとして取り込む選択肢もあり(将来課題)

---

## 4. 重要な参照値(Claude Code が必要に応じて使う)

### Vercel

- **Team ID**: `team_QcWeVA9gmFL26VN8wffMEZOk` (slug: `jimitas-projects`)
- **Project ID**: `prj_l8MzjtViu4nbX3OITAxTXky5VApi` (name: `jimitas-new`)
- **Framework**: Next.js
- **Node**: 24.x
- **本番ドメイン**: `https://jimitas.com`(apex 正規)
- **プレビュー用ドメイン**: `jimitas-new.vercel.app`

### DNS(さくらのドメイン管理)

- **ネームサーバ**: ns1.dns.ne.jp / ns2.dns.ne.jp
- **A レコード**: `76.76.21.21`(Vercel)
- **CNAME (www)**: `cname.vercel-dns.com.`
- **TXT (Google 所有権確認)**: `google-site-verification=aXwadrEaP8NsDADgbUFHwNCpwF1R4cfUdB35pu1AtlA`
  - **削除厳禁**(Search Console の所有権が失効する)

### Search Console

- **プロパティ種別**: ドメインプロパティ
- **送信中サイトマップ**: `https://jimitas.com/sitemap.xml`(43 ページ、成功)
- 旧 `sitemap_index.xml` は残置(削除しても OK、しなくても OK)

### さくら(旧 WP 環境)

- **アカウント**: `welove73`
- **WP インストール先**: `/home/welove73/www/jimitas.com/`
- **左ツリーに `jimita_bu` フォルダあり**(過去の手動バックアップの可能性)
- **`wp-config.php`** にデータベース接続情報あり(必要なら参照)

---

## 5. Claude Code に依頼したいこと(候補)

優先度高い順に。Jimitas が「これやって」と指示した時点で着手する想定:

1. **sitemap.ts の修正と動作確認**(課題 A、最優先)
   - 上記コードに置き換え → ローカル `pnpm build` で sitemap 生成を確認 → コミット & プッシュ → Vercel 自動デプロイ → 本番 `/sitemap.xml` で 82 URL を確認
2. **`next.config.ts` の redirects 戦略の検討**(課題 B、Search Console 観察後)
   - Search Console で 404 アクセスが多い旧 URL を Jimitas からリスト共有 → 適切な新 URL へのマッピングを協議 → `redirects()` 追加
3. **環境変数化の検討**(任意)
   - 5 ファイルにハードコードされた `https://jimitas.com` を `process.env.NEXT_PUBLIC_SITE_URL` で一元管理する案。ステージング環境を作る予定があれば実施、なければ現状維持で OK
4. **(将来)旧 WP 記事の Markdown 取り込み**(課題 C、優先度低)
   - UpdraftPlus の `db.gz` から `wp_posts` テーブルを抽出 → Markdown 化 → `/blog/[slug]` ルートで配信。やるかどうかは Jimitas の意向次第

---

## 6. やってはいけないこと(リスト)

- ❌ 「さくらのドメイン」契約の解約 → `jimitas.com` 自体を失う
- ❌ DNS の A レコードを `59.106.13.76`(旧)に戻す → 新サイトが見えなくなる
- ❌ `jimitas.com` の TXT レコード(Google 所有権確認)を削除 → Search Console 失効
- ❌ Vercel の `jimitas.com` ドメインを削除 → 新サイト全停止
- ❌ Vercel の `www.jimitas.com → 308 jimitas.com` リダイレクトを 307 に戻す → Google が正規 URL を誤認識する可能性
