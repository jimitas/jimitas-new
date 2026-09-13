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

## ダークモードがリロードで解除される ※2026-09-12 修正済み

調査日: 2026-07-31（トップページ導線変更 `a430ef8` の検証中に発見。当該変更とは無関係の既存バグ）
修正日: 2026-09-12

### 修正内容（結論）

下の「推奨する直し方」のとおり **data 属性方式（`<html data-theme="dark">`）へ移行**した。
変更したのは 3 ファイル + トグル本体:

| ファイル | 変更 |
|---|---|
| `src/app/globals.css` | `@custom-variant dark` を `[data-theme="dark"]` に。手書きフォールバック3ルールも同様に変更 |
| `src/app/layout.tsx` | インラインスクリプトを `dataset.theme = 'dark'` に |
| `src/components/common/DarkModeToggle.tsx` | `dataset.theme` の付け外しへ。**あわせて state を廃止** |

`localStorage` のキー `jimitas_dark` は変更していないため、**既存ユーザーの設定はそのまま引き継がれる**。
`dark:` を使っているアプリ側のコードは 1 行も変えていない。

### ついでに直したもの：ハイドレーションエラー

テスト実行中、全ページで
`Hydration failed because the server rendered text didn't match the client` が出ていた。
原因は `DarkModeToggle` がアイコンを state で出し分けていたこと。
「今ダークかどうか」はサーバー側では分からない（localStorage はブラウザにしかない）ため、
サーバーは🌙・クライアントは☀️を描画してズレていた。

state を廃止し、**現在の状態は DOM に聞き、見た目は CSS（`dark:hidden` / `hidden dark:inline`）に任せる**
方式に変更して解消した。サーバーとクライアントが同じHTMLを出すのでズレようがない。

### 回帰テスト：`tests/dark-mode.spec.ts`

**このテストは「実際にバグを捕まえること」を確認済み。**

1. 修正前のコードに対して実行 → **3件が失敗**（リロード / URL直接アクセス / リロード後のリンク遷移）。
   上の「症状」の表と完全に一致した
2. 修正後 → 全件グリーン

さらに、テスト自体の抜けも1つ潰してある。
body / header / footer の色を見るテストは、`globals.css` の**手書きフォールバックCSSで色がつく**ため、
`@custom-variant` を壊しても**素通りしてしまう**（実際に壊して確認したところ 6件すべてグリーンのままだった）。
＝「全アプリの `dark:` が一斉に効かなくなる」という最悪の壊れ方を検出できない。

そこで `dark:` プレフィックスそのものが効いているかを見るテスト
（**トグルのアイコンが🌙⇄☀️で切り替わるか**）を追加した。
`dark-mode.spec.ts` の中では、このテストだけが `@custom-variant` を壊したときに赤くなる。

> **2026-09-13 追記：** その後に追加した2本が、この最悪の壊れ方をはるかに大きく捕まえる。
> 実際に `@custom-variant` を壊して測った結果は下の「テスト検証記録」を参照。
> 「トグルのアイコン検査だけが頼り」という状態ではもうない。

**色の比較は文字列一致ではなく「明るさ」で判定している。** ブラウザが返す形式が
ライト（Tailwind v4 の oklch 由来 → `lab(...)`）とダーク（手書き hex → `rgb(...)`）で異なるため、
完全一致だと中身が正しくても落ちるため。

### 一緒に直した「隠れていた問題」：17アプリの見出しがダークで読めなかった

実機確認で発見。`tokei` をダークで開くと見出し「とけい」がほぼ見えなかった。
`h1` が `text-gray-800` のみで `dark:` 指定がなく、**コントラスト比 1.21:1**（WCAG の下限 4.5:1 を大きく下回る）。

**なぜ今まで問題にならなかったのか**が重要。
上のバグでリロードすると必ずライトに戻っていたため、**ユーザーがこれらのページを
ダーク表示のまま見る機会がほとんどなかった**。だから抜けていても誰も困らず、静かに溜まっていた。

バグを直してダークが正しく維持されるようになると、この抜けがそのまま表に出る。
「設定が黙って忘れられる」を直した結果「タイトルが読めない」に置き換わっては改善にならないため、
**同じまとまりで対応した**。

対象17アプリ（すべて `text-gray-800` → `text-gray-800 dark:text-gray-100`。1行ずつの機械的変更）:

```
barnsley-fern / hiki-hissan / kake-hissan-1 / kake-hissan2 / katakana /
koch-curve / kuku-array / kuku-yomi / kyoto-ku / natsu-no-hoshi /
nihon-todouhuken / romaji / sakusen-board / sangenshoku / sansu-note /
tashi-hissan / tokei
```

この書き方は既に32アプリが採用しており、**新しい規約ではなく既存規約への統一**。

### 回帰テスト：`tests/dark-contrast.spec.ts`

全アプリをダークで開き、**h1 と実際の背景のコントラスト比を WCAG 式で計算**して 4.5:1 以上を要求する。
`src/data/apps.ts` から対象を取るので、**新しいアプリを足すと自動で検査対象に入る**。

こちらも「壊して落ちること」を確認済み。`tokei` の `dark:text-gray-100` を1つ外すと
`比率: 1.21:1（必要: 4.5:1）` で失敗する。

実装メモ: 色の比較は**キャンバスに1px塗って読み戻す**方式で sRGB に正規化している。
`lab()` / `oklch()` など新しい CSS 色表記ごとに変換式を書く必要がなく、
「ブラウザが実際に画面へ出す色」で判定できるため。

### テスト検証記録（2026-09-13）

**「テストが通っている ≠ テストが機能している」を実測で潰した記録。**
きっかけは同日、`smoke.spec.ts` の `console.error` 検査が**存在するのに死んでいた**と分かったこと
（`domcontentloaded` で判定しており、あとから走るハイドレーションのエラーに到達していなかった）。
同じ疑いが他のテストにもかかるため、ダーク関係の3本を実際に壊して確かめた。

**① 昨日直した本物のバグを戻す**

合成のバグではなく、実際に修正したコードを `git checkout` で戻して測った。

| テスト | 戻したもの | 結果 |
|---|---|---|
| `dark-readability.spec.ts` | `fb98da7` の11アプリの文字色固定 | **11件失敗**（戻した11アプリと完全一致・余計な失敗ゼロ） |
| `dark-contrast.spec.ts` | `f97d1b1` の17アプリの見出し `dark:` | **17件失敗**（同上） |

いずれも修正を戻すと全61件グリーンに復帰。
**過不足なく、狙ったものだけを捕まえている。**

**② 最悪の壊れ方（`@custom-variant dark` を壊す）**

`globals.css` の `@custom-variant` のセレクタを絶対に一致しない値に書き換え、
`.next` を消して dev サーバーを再起動してから測った。

| テスト | 結果 |
|---|---|
| `dark-mode.spec.ts` | 1件失敗 / 6件通過（トグルのアイコン検査のみ） |
| `dark-contrast.spec.ts` | **51件失敗** / 10件通過 |
| `dark-readability.spec.ts` | **61件失敗**（全滅） |

復元後、全191件グリーンを確認。

⚠️ `globals.css` を触ったときは **`.next` を消して dev サーバーを再起動する**こと。
起動しっぱなしだと古い CSS のまま判定され、**壊したのに通ってしまう**。

**残る穴（測って分かったこと）**

- **どれも初期表示しか見ていない。** 問題を出したあと・数字を置いたあとの状態は検査対象外
- **非テキスト要素は対象外。** 罫線・枠線・アイコンの色は誰も見ていない。
  2026-09-12 のわり算の罫線バグがオーナーの実機確認で見つかったのはこのため

### 残っている課題（今回やっていない）

- **見出し以外のコントラスト**は未検査。`bg-white` に `dark:` がないパネルが
  `kenban`（21箇所中 dark 1）・`sansu-note`・`classroom-english`・`sangenshoku` などに残る。
  読めなくなるわけではないが、ダークで白いパネルだけ眩しく浮く
- `FontToggle.tsx` がフォントを `data-font` 属性と `body.style.fontFamily` の**二重で管理**している。
  今回は触っていない（1回に1つだけ変える方針のため）


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
