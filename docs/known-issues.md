# 既知の課題・調査メモ（jimitas-new）

グローバル `~/.claude/CLAUDE.md` に混入していたタスク固有メモをここへ移設（2026-07-31）。
常時ロードされる場所に置くべきではないため、関連プロジェクトの docs に集約。

## okane（お金を並べる）テーブルの td 高さ問題 ※要再検証

- お金を並べるテーブルエリア（`#TBL`）の `tr` には min-height が適用されているが、
  `td`（background: #fff3e0）は見たところ height が 10px 程度の最小のままになる。
- min-height が設定されているのに効いていない → 他の要素が影響している可能性。

> 注意: 現行の jimitas-new の okane 実装には `#TBL` という id は見当たらず（`OkaneGrid.tsx` は
> `minHeight` を JS で付与）、旧版（jimitas-old）由来の観察の可能性が高い。現行 UI で再現するか
> 未確認。再発したら `src/components/parts/hissan/OkaneGrid.tsx` 付近を調査。

---

## ダークモードがリロードで解除される ※原因特定済み・未修正

調査日: 2026-07-31（トップページ導線変更 `a430ef8` の検証中に発見。当該変更とは無関係の既存バグ）

### 症状

ダークモードにしても、リロード／URL直接アクセスすると**ライトモードに戻る**。
`localStorage` の `jimitas_dark` は `"true"` のまま残っている。

Playwright で実測した挙動:

| 操作 | ダーク維持 |
|---|---|
| トグル直後 | ✅ |
| アプリへ Link 遷移（クライアントサイド遷移） | ✅ |
| ヘッダーから戻る | ✅ |
| **リロード** | ❌ |
| **URL直接アクセス** | ❌ |

App Router のクライアントサイド遷移では `<html>` が作り直されないため、
**1回の訪問中はサイト全体を問題なくダークで使える**。壊れるのは
「リロード・直リンク・次回訪問」＝*使えない* のではなく *設定が黙って忘れられる* バグ。

### 原因：React のハイドレーションによる className 上書き

`<html>` の class を時系列で追跡した結果:

| タイミング | `<html>` の class |
|---|---|
| ① インラインスクリプト実行直後 | `…variable …variable **dark**` |
| ② DOMContentLoaded | `…variable …variable **dark**` |
| ③ ハイドレーション後 | `…variable …variable` ← **消える** |

`layout.tsx` のインラインスクリプト（チラつき防止用・同期実行）は**正しく動いている**。
しかし同ファイルで `<html className={`${bizUDPGothic.variable} ${bizUDGothic.variable}`}>` と
React が className を管理しているため、ハイドレーション時に React が自分の className を
書き戻し、スクリプトが足した `dark` を消してしまう。

`suppressHydrationWarning` は**警告を黙らせるだけで、書き戻し自体は止めない**。

**決定的な傍証**: 同じスクリプトが設定するフォント側（`data-font` 属性）は生き残る。
React は `<html>` の `data-font` を管理していないため。
つまり「**class だから消える、属性だから残る**」。

### 推奨する直し方：ダークも「属性方式」に寄せる（フォントと同じ）

すでにフォント切替で実績のある方式に統一するのが、追加概念ゼロで一番堅い。

1. `globals.css` の `@custom-variant dark`
   ```css
   /* 変更前 */
   @custom-variant dark (&:where(.dark, .dark *));
   /* 変更後 */
   @custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
   ```
2. `globals.css` の手書きフォールバック（`.dark body` / `.dark header` / `.dark footer` の3ルール）を
   `[data-theme="dark"] body` などに変更 ← **見落としやすい。`@custom-variant` だけでは不十分**
3. `layout.tsx` のインラインスクリプト
   ```js
   // classList.add('dark') をやめる
   document.documentElement.dataset.theme = 'dark';
   ```
4. `DarkModeToggle.tsx` を `dataset.theme` の付け外しに変更
   （localStorage キー `jimitas_dark` はそのまま＝既存ユーザーの設定を引き継げる）

`dark:` プレフィックスを使っている**アプリ側のコードは一切変更不要**（バリアント定義だけ差し替えるため）。

### 作業時の注意

- `dark:` の使用箇所は約 **805件**。バリアント定義の差し替えは全アプリのダーク表示に影響する。
  作業コストの大半は編集ではなく**リグレッション確認**。`/screenshot-review` でダークを全巡回すること。
- 単独コミットで行う（他の変更と混ぜない）。

### 代替案（採らなかった理由）

- **マウント後に `useEffect` で class を付け直す** — 1ファイルで済むが、ハイドレーション後の実行になるため
  ライト→ダークのチラつきが出る。チラつき防止のために同期インラインスクリプトを置いた元の意図と矛盾する。
- **フォント変数を `<body>` へ移して `<html>` から className を外す** — React の管理下から外す発想は正しいが、
  `<html>` の className を React が完全に触らない保証がバージョン依存で、将来また壊れ得る。

### 再現手順（Playwright）

```js
await page.goto("http://localhost:3000/")
await page.getByTitle("ダークモードに切り替え").click()
console.log(await page.evaluate(() => document.documentElement.classList.contains("dark"))) // true
await page.reload({ waitUntil: "networkidle" })
console.log(await page.evaluate(() => document.documentElement.classList.contains("dark"))) // false
console.log(await page.evaluate(() => localStorage.getItem("jimitas_dark")))                // "true"
```
