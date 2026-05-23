---
name: seoaio
description: 新アプリ追加時のSEO・AIO（AI最適化）チェックリストと対応手順
user_invocable: true
---

# /seoaio — SEO + AIO 対策チェック & 適用

新しいアプリを追加したとき、またはSEO/AIO関連の確認・改善をしたいときに実行するスキルです。

## 新アプリ追加時のチェックリスト

### 1. layout.tsx の作成（SEO metadata + JSON-LD）
各アプリディレクトリに `layout.tsx` を作成する。以下のテンプレートをコピーして `アプリID` を書き換えるだけ：

```tsx
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

- `getAppMetadata()` → title / description / OGP を自動生成（SEO向け）
- `getAppJsonLd()` → EducationalApplication スキーマの構造化データを自動生成（SEO + AIO向け）
- どちらも `apps.ts` の title / description / grades / tags から自動で組み立てるので、apps.ts のデータが正しければOK

### 2. apps.ts の description / seoDescription を書き分ける

`apps.ts` には**2つの説明フィールド**がある：

| フィールド | 用途 | 文字数目安 | 文体 |
|---|---|---|---|
| `description` | **トップページのカード表示** | 20〜30文字 | 短く・小学生向け・漢字控えめ |
| `seoDescription`（任意） | **SEO・OGP・JSON-LD・llms.txt** | 30〜80文字 | 具体的・「何ができるか」「特徴」を書く |

#### 動作仕様（`src/lib/seo.ts`）
- `seoDescription` があればそれを SEO/AIO で使う
- 省略時は `description` にフォールバック（地味なアプリは省略可）

#### 書き方の例

```ts
{
  id: "tokei",
  title: "とけい",
  description: "とけいの よみかたを れんしゅう",                          // カード用（短く）
  seoDescription: "時計の読み方を練習しよう。3段階の難易度で学べるよ",     // SEO用（具体的）
  ...
}
```

#### 運用ルール
- **検索流入を取りに行きたいアプリ** → `seoDescription` を必ず書く
- **地味なアプリ（先生向けツール等）** → `seoDescription` 省略可（description のままSEOに使われる）
- カード表示と SEO はトレードオフ → カードは「読みやすさ」、SEOは「具体性」で別最適化
- description（カード用）を変更したときは、`seoDescription` の整合性も見直す

#### tags も SEO で活用される
- `keywords` として JSON-LD に含まれる（`title + subjects + tags` を結合）
- description が短くなった分、tags でキーワード補完する

### 3. 自動確認（ビルドするだけでOK）
以下は apps.ts に追加するだけで自動的に反映される：
- **sitemap.xml** (`src/app/sitemap.ts`) — 新アプリのURLが自動追加される
- **llms.txt** (`src/app/llms.txt/route.ts`) — 新アプリの情報が自動追加される
- **robots.txt** (`src/app/robots.ts`) — 変更不要

ビルド後に以下を確認：
- `/sitemap.xml` に新URLが含まれるか
- `/llms.txt` に新アプリの説明が含まれるか

## 既存ファイルの構成

| ファイル | 役割 | 更新タイミング |
|---------|------|--------------|
| `src/lib/seo.ts` | metadata / JSON-LD 生成ヘルパー | 通常は変更不要 |
| `src/app/layout.tsx` | title テンプレート `"%s | Jimitas"` | 通常は変更不要 |
| `src/app/sitemap.ts` | sitemap.xml 自動生成 | apps.ts から自動（変更不要）|
| `src/app/robots.ts` | robots.txt 自動生成 | 通常は変更不要 |
| `src/app/llms.txt/route.ts` | AI向けサイト説明 | apps.ts から自動（変更不要）|
| 各アプリの `layout.tsx` | 個別 metadata + JSON-LD | **新アプリ追加時に作成** |

## 将来のTODO（未実装）
- OGP画像の自動生成（`opengraph-image.tsx`）
- Google Search Console への sitemap 送信
- 外部サイトからの被リンク・言及を増やす（ブログ記事・SNS共有）
