---
name: new-app
description: 新アプリの雛形ファイルを一括作成（page.tsx + layout.tsx + apps.ts 登録）。「○○のアプリを作りたい」「新しいアプリを追加したい」「○○を作って」と言われたときに起動する。
user_invocable: true
---

# /new-app — 新アプリ完全初期化

新しいアプリを追加するときに実行するスキルです。
以下を順番に行います。

---

## 手順

### 1. 情報収集（必須項目を確認）

まずユーザーに以下を確認する（未指定の場合のみ聞く）：

| 項目 | 例 | 備考 |
|------|----|------|
| `id` | `tashizan-2` | URLになる・ハイフン区切り小文字 |
| `title` | `たしざん２` | トップページカード表示名（日本語） |
| `description` | `くり上がりのある たしざんを れんしゅう` | カード用・20〜30文字・漢字控えめ |
| `grades` | `[1, 2]` | 1〜6・"中学"・"高校"・"先生向け"・"全学年" |
| `subjects` | `["算数"]` | 算数/国語/理科/社会/音楽/英語/生活/総合/その他 |
| `type` | `app` | "app" / "print" / "tool" |

`seoDescription` は後で `/seoaio` を使って設定を促すので今は省略可。

---

### 2. `src/data/apps.ts` にエントリを追記

**追記場所：** 同じ `subjects` のグループの末尾に追加する。
グループが見つからない場合はファイル末尾に追加。

**テンプレート：**
```ts
{
  id: "{{id}}",
  title: "{{title}}",
  description: "{{description}}",
  grades: {{grades}},
  subjects: {{subjects}},
  tags: [],
  type: "{{type}}",
  path: "/{{id}}",
},
```

`tags` は後でユーザーが埋めるので空配列でよい。

---

### 3. `src/app/(apps)/{{id}}/page.tsx` を作成

```tsx
"use client"

import { useState } from "react"
import * as se from "@/lib/se"
import { useCoins } from "@/hooks/useCoins"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"

export default function {{PascalId}}Page() {
  const { coins, addCoins } = useCoins()

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">
        {{title}}
      </h1>

      {/* TODO: ここにアプリの実装を追加 */}

      <CoinDisplay coins={coins} />
    </div>
  )
}
```

**PascalId の変換ルール：**
- `tashizan-2` → `Tashizan2`（ハイフン除去、各語先頭を大文字）

**注意事項：**
- `"use client"` は必須（状態管理があるため）
- コイン不要のアプリは `useCoins` と `CoinDisplay` を省く
- コメントは日本語で書く

---

### 4. `src/app/(apps)/{{id}}/layout.tsx` を作成

```tsx
import { getAppMetadata, getAppJsonLd } from "@/lib/seo"

export const metadata = getAppMetadata("{{id}}")

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = getAppJsonLd("{{id}}")
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

**注意：** `layout.tsx` は削除禁止（SEO の要）。`"use client"` は書かない（サーバーコンポーネント）。

---

### 5. 完了確認

作成したファイルのパスを列挙して報告する。

```
✅ src/data/apps.ts                    → {{id}} エントリを追加
✅ src/app/(apps)/{{id}}/page.tsx      → 雛形を作成
✅ src/app/(apps)/{{id}}/layout.tsx    → SEO設定を作成
```

最後に以下を伝える：
- `tags` を埋めると検索・絞り込みに効く
- `seoDescription` を追加したい場合は `/seoaio` を実行する
- アプリ実装後は `/ship` でテスト→コミット→push

---

## 禁止事項

- `src/components/apps/` ディレクトリを作らない（廃止済み）
- アプリ固有ロジックを `src/components/parts/` に置かない
- `layout.tsx` に `"use client"` を書かない
