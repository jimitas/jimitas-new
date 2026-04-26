# 振り返りレポート: SEO・AIO基盤構築

**作業日**: 2026-04-26
**テーマ**: jimitas.com の検索エンジン対策（SEO）+ AI最適化（AIO）の基盤構築
**コミット**: `bdd1249`（SEO基盤）→ `1f217ce`（AIO追加）→ 以降のリファイン

---

## 背景

わり算の筆算（wari-hissan）の開発を別チャットで並行して進めていたが、ふと「そういえば本サイトのSEO対策って何もやっていないな」と気づいた。

40本超のアプリがあるのに、検索結果ではどのアプリも見つけてもらえない可能性が高い。Claude に相談してみたら、想像以上に深刻だった。

### 着手前の状態

| 項目 | 状態 |
|---|---|
| グローバル metadata | あり（タイトル・説明文） |
| 各アプリページの metadata | **なし**（全ページ同じタイトル・説明文） |
| sitemap.xml | **なし** |
| robots.txt | **なし** |
| OGP（SNS共有用） | **なし** |
| 構造化データ（JSON-LD） | **なし** |
| AIクローラー対策 | **なし** |

つまり「Googleから見ると全40ページが同じに見える」状態。

---

## やったこと（2フェーズ）

### フェーズ1: SEO基盤（コミット `bdd1249`）

| 施策 | ファイル | 内容 |
|---|---|---|
| metadata テンプレート化 | `src/app/layout.tsx` | `title.template: "%s | Jimitas"` 等 |
| sitemap.xml 自動生成 | `src/app/sitemap.ts` | apps.ts から有効アプリを自動列挙 |
| robots.txt 自動生成 | `src/app/robots.ts` | クロール許可 + sitemap 指定 |
| 各アプリ個別 metadata | 各アプリの `layout.tsx`（39ファイル） | apps.ts のデータから自動生成 |

### フェーズ2: AIO追加（コミット `1f217ce`）

「AIに見つけてもらうには？」という相談から、AIO（AI Optimization）の話になった。

| 施策 | ファイル | 内容 |
|---|---|---|
| llms.txt 動的生成 | `src/app/llms.txt/route.ts` | AIクローラー向けサイト説明（教科別アプリ一覧） |
| JSON-LD 構造化データ | `src/lib/seo.ts` の `getAppJsonLd()` | EducationalApplication スキーマ |
| 各アプリの JSON-LD 出力 | 各 `layout.tsx`（39ファイル更新） | `<script type="application/ld+json">` で埋め込み |

### フェーズ3: 微調整（後続）

リンターや手動修正で以下を改善：
- `sitemap.ts` に **じみぷり プリント個別ページ**（`ALL_PRINTS` から `isImplemented` 通過のもの）を追加
- `apps.ts` に **`seoDescription` フィールド**を追加 → カード表示用 `description` と SEO/AIO 用 `seoDescription` を分離
- `seo.ts` / `llms.txt` で `seoDescription` を優先利用、なければ `description` にフォールバック

---

## 設計上の工夫・引っかかった点

### 1. 全ページ `"use client"` 問題
当初 `page.tsx` に `metadata` をエクスポートしようとしたが、全ページがクライアントコンポーネントだった。Next.js の制約で `"use client"` のファイルからは metadata をエクスポートできない。

**回避策**: 各アプリディレクトリに小さな `layout.tsx`（サーバーコンポーネント）を作り、そこから metadata と JSON-LD を出力する。ページファイルは一切触らない。

```tsx
// 各アプリの layout.tsx（テンプレート）
import { getAppMetadata, getAppJsonLd } from "@/lib/seo"

export const metadata = getAppMetadata("アプリID")

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = getAppJsonLd("アプリID")
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}
```

39アプリ分の生成は bash スクリプトで一括処理した。

### 2. description のトレードオフ
最初は `description` 1つでカード表示にも SEO にも使っていた。だがカード表示は「短く・小学生向け・漢字控えめ」が良く、SEO/AIO は「具体的・キーワードを含む長文」が良い。

**解決策**: `apps.ts` に `seoDescription`（任意）を追加し、SEO 用は別最適化できるようにした。省略時は `description` にフォールバック。

| フィールド | 用途 | 文字数 | 文体 |
|---|---|---|---|
| `description` | カード表示 | 20〜30字 | 短く・やさしく |
| `seoDescription` | SEO/OGP/JSON-LD/llms.txt | 30〜80字 | 具体的・キーワード豊富 |

### 3. わり算開発との競合管理
並行で wari-hissan の開発が進行中だったため、SEO 作業は wari-hissan のファイルを除外して進めた。

結果的にコミット粒度が分離されて、競合ゼロで完了。並行作業時の鉄則を再確認できた。

### 4. llms.txt のルーティング
`src/app/llms.txt/route.ts` という、ピリオドを含むディレクトリ名でルートハンドラを置く形式。最初は静的ビルド済みのサーバーが残っていて 404 になり「動かないのか」と焦ったが、サーバーを再起動したら正常動作した。

---

## 残した仕組み

### 自動化されたもの（apps.ts に追記するだけで反映）
- sitemap.xml — 新アプリ URL が自動追加
- llms.txt — 新アプリの教科別一覧に自動追加
- robots.txt — 変更不要

### 手作業が必要なもの
- 各アプリディレクトリの `layout.tsx`（4行のテンプレートをコピペするだけ）

### スキル化: `/seoaio`
新アプリ追加時に思い出さなくて済むよう、`/seoaio` スキルにチェックリスト・テンプレート・運用ルールを集約した（`.claude/skills/seoaio.md`）。

旧 `/seo` スキルは廃止し、SEO + AIO を統合した `/seoaio` 1本に。

### メモリ更新
- `project_seo_setup.md` — 実装状況の記録（`/seoaio` 参照を明記）
- `feedback_new_app_checklist.md` — 「新アプリ追加時の必須手順」に SEO/AIO 項目を追加

---

## 今後のTODO

### 技術的に追加できること
- [ ] OGP 画像の自動生成（`opengraph-image.tsx`）
- [ ] Google Search Console への sitemap 送信（手作業・サイト外）

### サイト外の施策（一番効果的だが時間がかかる）
- [ ] Zenn 等の技術ブログでの言及を増やす
- [ ] 教育系 SNS / フォーラムでの共有
- [ ] 他サイトからの被リンク獲得

Claude いわく「**AIが推薦するかは、ウェブ上の言及量が一番大きい**」。技術的な準備としては正しいが、それだけでは不十分。このプロジェクト自体を「使ってもらう」「書いてもらう」フェーズに入る必要がある。

---

## 学び・気づき

1. **40本超のページがあるサイトで SEO ゼロ → 基盤完成まで2回の会話で終わった**。データ駆動（apps.ts 中心）の設計を最初から徹底していたおかげで、自動化が効いた。

2. **「全ページ use client」のような制約は、layout.tsx に逃がせる**。サーバー/クライアントの境界を巧く使えば、既存コードを一切触らずに機能追加できる。

3. **SEO と AIO は基盤を共有できる**。schema.org の JSON-LD は両方に効くし、apps.ts のデータ整備は全方位に効く。「分けて2回作業」ではなく「1つの基盤で両対応」が合理的。

4. **description / seoDescription の分離**は、最初は1つで済ませようとして後で分割した。**役割が違う文章は、最初から別フィールドにしておいたほうが良い**という典型例。

5. **並行開発時はファイル単位で完全分離するのが正解**。SEO 作業と wari-hissan 開発はファイルが完全に被らなかったため、競合ゼロでマージできた。
