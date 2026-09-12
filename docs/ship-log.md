# Ship Log

## 2026-09-12 — ダークモードのリロード解除バグ修正＋隠れていた17アプリのコントラスト

**コミット：** `f97d1b1`

### 背景・目的

「何かまるっとリファクタリングできることはないか」という相談から、現状を実測した。
ESLint 0件・テスト83件グリーン・配色トークンの役割分けも守られており、**コードの見た目の品質は
思っていたより健全**だった。一方で、実害が出ている順に並べると次の3つが残っていた。

1. **ダークモードが二重に壊れている**（リロードで解除＋15アプリが `dark:` 未対応）
2. ボタンが205個の手書きコピー（共通部品 `Btn*` 13個が土台を共有していない）
3. 26,100行に対してテストが5アプリ分のロジックのみ

「使ってくれている人がタブレットの夜間モードで最初に気づく不具合」である 1 から着手した。

### 変更内容

| 変更 | 内容 |
|---|---|
| `globals.css` | `@custom-variant dark` と手書きフォールバック3ルールを `[data-theme="dark"]` へ |
| `layout.tsx` | チラつき防止スクリプトを `dataset.theme = 'dark'` へ |
| `DarkModeToggle.tsx` | `dataset.theme` の付け外しへ。**state を廃止** |
| アプリ17本 | `h1` に `dark:text-gray-100` を追加（1ファイル1行） |
| `tests/dark-mode.spec.ts` | 新規・永続化7件 |
| `tests/dark-contrast.spec.ts` | 新規・全アプリの見出しコントラスト検査 |

`localStorage` のキー `jimitas_dark` は据え置きのため、**既にダークにしている人の設定は
そのまま引き継がれる**。アプリ側の `dark:` 約805箇所は無変更。

### 技術的なポイント

**原因は「class だから消える、属性だから残る」。**
`layout.tsx` で React が `<html className={...}>`（フォント変数）を管理しているため、
同期インラインスクリプトが足した `dark` クラスをハイドレーション時に React が書き戻して
消していた。`suppressHydrationWarning` は警告を消すだけで書き戻しは止めない。
決定的な傍証は、同じスクリプトが設定する `data-font` **属性**は生き残っていたこと。
既にフォント切替で実績のある属性方式へ寄せた（追加概念ゼロ）。

**「壊れている機能を直すと、その下に隠れていた不備が露出する」。**
実機確認で `tokei` の見出しがダークでほぼ読めないことに気づいた（コントラスト **1.21:1**、
WCAG 下限は 4.5:1）。同じ状態が17アプリ。**これまではリロードで必ずライトに戻っていたため、
ユーザーがダーク表示のままこれらを見る機会がほとんどなく、抜けていても誰も困らなかった**。
バグを直すと一斉に表に出る。「設定が黙って忘れられる」を「タイトルが読めない」に
置き換えては改善にならないので、同じまとまりで対応した。

**テストの穴を、壊して見つけた。**
最初に書いた永続化テストは `body` / `header` / `footer` の色を見ていたが、この3要素は
`globals.css` の手書きフォールバックCSSでも暗くなる。試しに `@custom-variant` を壊したところ
**6件すべてグリーンのまま**通過した。つまり「全アプリの `dark:` が一斉に効かなくなる」という
最悪の壊れ方を検出できていなかった。`dark:` そのものを見るテスト（トグルのアイコンが
🌙⇄☀️で切り替わるか）を追加し、これだけが赤くなることを確認した。

**色の比較は文字列一致にしない。**
ブラウザが返す形式がライト（Tailwind v4 の oklch 由来 → `lab(...)`）とダーク
（手書き hex → `rgb(...)`）で異なるため、完全一致だと中身が正しくても落ちる。
永続化テストは「明るさ」に正規化して判定し、コントラストテストは**キャンバスに1px塗って
読み戻す**方式で sRGB に正規化した。後者は `lab()` / `oklch()` ごとの変換式を書かずに
「ブラウザが実際に画面へ出す色」で判定できる。

**ついでに直ったもの:** 全ページで `Hydration failed` エラーが出ていた。トグルがアイコンを
state で出し分けていたため、サーバーは🌙・クライアントは☀️を描画してズレていた。
state を捨て「状態は DOM に聞き、見た目は CSS に任せる」方式にして解消。

### 検証

「壊して落ちることを確認する」を3回実施。

| 壊したもの | 結果 |
|---|---|
| 修正前のコード全体 | 永続化テスト**3件が失敗** — `known-issues.md` の症状表と完全一致 |
| `@custom-variant` を class 方式に戻す | 既存6件は全部グリーン、**追加したアイコン切替テストだけが失敗** |
| `tokei` の `dark:text-gray-100` を外す | コントラストテストが `比率 1.21:1（必要 4.5:1）` で失敗 |

最終: Playwright **130件**（スモーク62 + 永続化7 + コントラスト61）全パス /
Jest 83件 / ESLint 0件 / 本番ビルド成功（108ページ）/ 実機ブラウザで目視確認。

### 持ち越し

- **見出し以外のコントラストは未検査。** `bg-white` に `dark:` がないパネルが残る
  （`kenban` は21箇所に対し `dark:` が1つ、他に `sansu-note` / `classroom-english` / `sangenshoku`）。
  読めなくなるわけではないが、ダークで白いパネルだけ眩しく浮く
- `FontToggle.tsx` がフォントを `data-font` 属性と `body.style.fontFamily` で**二重管理**している。
  「1回に1つだけ変える」方針により今回は触っていない
- **ボタン205個の手書きコピー問題**（冒頭の 2）は未着手。共通部品 `Btn*` 13個が同じ8行の
  className を色違いでコピーしており、`BtnQuestion` は `<div className="flex flex-wrap justify-center">`
  というレイアウトを内部に抱えているため「2つ横に並べたい」場面で使えない。
  部品が使われなくなった（62アプリ中8アプリでしか使われていない）理由はここにある可能性が高い

---

## 2026-07-02 — サイン波シミュレーター移植（中学・高校向け）

**コミット：** `e447cea`

### 背景・目的
外部リポジトリ [jimitas/sign-wave](https://github.com/jimitas/sign-wave)（バニラHTML/JS/CSS）の「サイン波シミュレーター」を jimitas-new（Next.js）へ移植したいという要望。中学・高校の情報・数学で「音は波である」ことを、音と波形グラフの同時フィードバックで体感させる教材ツール。

### 変更内容
| 変更 | 内容 |
|---|---|
| `src/data/apps.ts` | エントリ1件追加（`sign-wave` / その他 / 中学・高校 / `type: "tool"`） |
| 新規 `src/app/(apps)/sign-wave/layout.tsx` | SEO（metadata + JSON-LD）。koch-curve と同テンプレート |
| 新規 `src/app/(apps)/sign-wave/page.tsx` | 本体。サイン波固定・周波数(100〜2000Hz)/音量(0〜0.5)スライダー・再生/停止・リアルタイム波形描画 |

- 忠実移植の方針。効果音・コイン・localStorage は元アプリになく追加せず。
- 既存「音を出そう」(oto-dashiyo) と機能が一部重なるが、**サイン波固定＋音量操作＋波形グラフ＋中高向け**で差別化して並存。

### 技術的なポイント
- **再生/停止・クリーンアップの土台は oto-dashiyo を流用**（AudioContext 遅延生成・`ctx.resume()`・ゲインで音量抑制・フェードアウト停止）。移植コストを抑えつつ実装パターンを統一。
- 波形描画は jimitas 内で前例なしのため新規実装。`AnalyserNode`(fftSize=2048・約46ms窓)→`getByteTimeDomainData`→Canvas折れ線。`requestAnimationFrame` で再生中のみループ、停止後は最後の波形を保持。HiDPI は `devicePixelRatio` + `setTransform` で対応。
- 周波数・音量変更は `setTargetAtTime(…, 0.01)` でなめらかに反映し、元 script.js 準拠でクリックノイズを回避。
- TypeScript の `getByteTimeDomainData` 型不一致（`Uint8Array<ArrayBufferLike>` 非互換）は、バッファを `new Uint8Array(new ArrayBuffer(n))` で生成し ref を `Uint8Array<ArrayBuffer>` 型にして解消。

---

## 2026-06-14 — UDMinchoフォントCSSを3アプリにscope（render-blocking削減）

**コミット：** `9497498`

### 背景・目的
PageSpeed Insights のラボデータで「レンダリングをブロックするリクエスト 4本 / 127.8KiB / 最大5,100ms」「未使用CSS 108KiB削減可能」と出ていた。当初は globals.css や Tailwind の purge 漏れを疑ったが、ビルド出力（`.next/static/chunks/*.css`）を実測した結果、4本の正体は **next/font の日本語Webフォント定義CSS** だった。

| ファイル | 中身 | サイズ |
|---|---|---|
| chunk A | next/font BIZ UDMincho の @font-face 群 | 189 KB |
| chunk B | next/font BIZ UDPGothic の @font-face 群 | 189 KB |
| chunk C | next/font BIZ UDGothic の @font-face 群 | 189 KB |
| chunk D | Tailwind utilities + globals.css | 89 KB |

日本語Webフォントは CJK 全域を数百個の `@font-face`＋`unicode-range` に分割保持するため、定義CSSだけで1本189KBになる（実woff2は必要字形のみ後追いDL）。「未使用CSS 108KB」も、トップで使われないCJK字形の @font-face が大半。**globals.css・Tailwind purge はいずれも健全で問題なし**だった。

核心は、`BIZ_UDMincho` が jimipri / kanji-print / kanji-test の「UD明朝」オプション専用なのに、root layout 経由で全57ページに render-blocking 読み込みされていた点（`preload:false` は woff2 の preload を止めるだけで @font-face 定義CSS は全ページに載る）。

### 変更内容
| 変更 | 内容 |
|---|---|
| 新規 `src/lib/fonts.ts` | `bizUDMincho`（next/font）を1箇所で宣言・export |
| `src/app/layout.tsx` | UDMincho の import・宣言・`<html>` className を削除（全ページから除去）。UDPGothic・UDGothic は残す |
| `kanji-test` / `kanji-print` / `jimipri` の `layout.tsx` | `bizUDMincho` を import し、`children` を `<div className={bizUDMincho.variable} style={{display:"contents"}}>` でラップ |

結果、トップ含む約54ページの critical path から189KB（＋未使用CSSの大半）が外れ、render-blocking CSS が 4本→3本に。視覚変化ゼロ・CLS=0維持。

### 技術的なポイント
- **`display:contents`** でラッパdiv自体はボックスを生成しないため既存の flex/grid レイアウトに影響を与えず、CSSカスタムプロパティ `--font-biz-ud-mincho` だけを子孫へ継承させた。各page内の `FONT_MINCHO`（`var(--font-biz-ud-mincho)` を含むインライン適用）は従来どおり解決される。
- 「明朝が静かに消える」失敗モードを潰すため、実装前に `--font-biz-ud-mincho` / `UDMincho` の全参照を Grep（3アプリのみと確認）、実装後はビルドのプリレンダHTMLで①UDMinchoチャンク参照が jimipri系40本＋kanji-print＋kanji-test のみ②variable定義クラスが各wrapperに付与③トップ(index.html)からは消滅、を実測確認した。
- UDGothic はヘッダーの FontToggle が全ページで使うためグローバル必須＝今回は対象外。weight 700 ドロップ案（各フォントCSS半減）は非Windows端末で擬似ボールドになる視覚トレードオフがあるため見送り。

---

## 2026-06-14 — FCP微改善（フォントpreload絞り込み＋theme-initインライン化）

**コミット：** `984519a`

### 背景・目的
PageSpeed Insights 実測（5/16〜6/12）で Core Web Vitals（LCP/INP/CLS）は全合格、唯一 **FCP のみ**が目標1.8sに対し +0.1〜0.2s 超過していた。TTFB（0.4〜0.5s）→ FCP（1.9〜2.0s）の約1.4sギャップは「サーバー応答後に render-blocking リソースを待っている」状態を示す。事前に立てた3仮説（A:フォントCDN／B:layoutがclient／C:重い同期import）はコード確認の結果すべて「対応済み or 不成立」だったため、同じ"設定・数行で完結"の方針で critical path のリクエスト/帯域を減らす低コスト改善のみを実施した。

### 変更内容
| 対策 | 内容 |
|---|---|
| **フォント preload の絞り込み** | 初回描画で使わない `bizUDGothic`（ゴシック切替専用）・`bizUDMincho`（kanji-print明朝専用）に `preload: false` を付与。全ページの font preload をデフォルトの `bizUDPGothic` のみに削減 |
| **theme-init.js のインライン化** | チラつき防止スクリプトを外部ファイル（`/theme-init.js`）から `layout.tsx` の `<head>` にインライン展開し、render-blocking な外部リクエストを1本削減。`public/theme-init.js`・`next.config.ts` のキャッシュヘッダも削除 |

動作・デザイン・CLS=0 に影響なし。build / unit(73) / e2e(60) 全合格。

### 技術的なポイント
- 3つの仮説がすべて「既に対応済み or 不成立」だったため、無理なリファクタリングはせず副作用ゼロの微調整に絞った。FCPへの効果は小さい想定（数十ms〜0.1s程度）で決定打ではない可能性があることをオーナーにも明示済み。
- インライン化では「Claudeが推測で中身を書き換えていないか」というオーナーの懸念を受け、原本 `public/theme-init.js` を実装直前に再 Read し、`__html` と1文字単位で一致することを確認してから貼り付けた（変数名・改行も含め verbatim）。
- フォントは元々 `next/font` + `display:swap` 済みで、`preload:false` でも参照時に従来通り読み込まれCLSは0のまま。ゴシック/明朝はフォールバックから差し替わるだけ。

---

## 2026-06-14 — Vercelリクエスト削減（prefetch無効化＋印刷ページ静的化）

**コミット：** `7691436`

### 背景・目的
Vercel の Edge Requests が月 2,015,611 件に達し、無料枠 1M/月 を大きく超過していた。一方 Google Search Console のクリック数は 1 日約 150 回で、実クリック数とリクエスト数が **400 倍以上乖離**していた。オーナーの仮説（じみぷりの「作成」ボタン押下／旧WordPress URLの404クロール）を検証したところ、いずれも主因ではなく、Next.js の構造的な 2 点が原因と判明したため是正した。

### 変更内容
| 対策 | 内容 |
|---|---|
| **prefetch無効化（最大の削減）** | `AppCard`（トップ約61カード）・じみぷりメニュー（39リンク）・`Header`（4リンク）の全 `<Link>` に `prefetch={false}` を付与 |
| **じみぷり印刷ページの静的化** | `/jimipri/[printId]` をサーバー/クライアント分割。`generateStaticParams` で全39種をビルド時SSG化、`dynamicParams=false` で未知IDは静的404 |

- 仮説①②はいずれも主因ではないと確定（「作成」ボタンは client state 更新のみでネットワーク無し／アクセス元 DOCOMO・KDDI は実ユーザーで bot 主体ではない）

### 技術的なポイント
- **なぜ prefetch がリクエストを爆増させるか**: Next.js の `<Link>` はデフォルトでリンクが viewport に入るたび RSC ペイロードを先読みする。Vercel の Edge Requests は「cached and uncached」を**両方計上**するため、キャッシュヒットでも 1 件として積み上がる。リンクが多いトップ／メニューでは 1 閲覧が数十リクエストに膨張していた。
- **静的化の効果**: 旧実装は `"use client"` + `useParams()` で `generateStaticParams` 未定義 → 39ページ全てがオンデマンドのサーバーレンダリング（キャッシュ率0%・Function呼び出し）だった。問題生成はクライアントの純粋関数でサーバーデータ不要なため、ロジックを `PrintClient.tsx`（`printId` を props 受け取り）へ分離し、ページをサーバーコンポーネント化して SSG（CDNキャッシュ配信）に転換。
- 検証: `npm test` 73/73 pass、`npm run build` で `/jimipri/[printId]` が `ƒ (Dynamic)` → `● (SSG)` に変化することを確認。本番効果は Vercel Usage で 1〜3 日かけて計測予定。

---

## 2026-06-07 — 10をつくろう スマホ対応

**コミット：** `86d3506`

### 背景・目的
タブレット（1024×768）専用設計だったため、スマホ（375px幅）ではカード5枚横並びで608px必要となり完全にオーバーフローして使用不能だった。タブレットの動作を維持しつつスマホでも遊べるようにレスポンシブ対応を追加。

### 変更内容
- **場・手札スロット**：モバイルで 2×2 グリッド表示（640px 以上で従来の横1列に戻る）
- **山札+手札エリア**：モバイルで縦並び（山札→手札の順）、640px 以上で横並び維持
- **カードサイズ**：モバイル `80×96px` / タブレット `112×128px`（`w-20 h-24 sm:w-28 sm:h-32`）
- **カード内数字**：`text-3xl sm:text-4xl`
- **ドット**：`w-2 h-2 sm:w-3 sm:h-3`、間隔・コンテナ高さもモバイル向けに縮小
- **スタートボタン・説明文**：モバイルで一回り小さいサイズに

### 技術的なポイント
Tailwind のモバイルファースト原則（デフォルト=スマホ小、`sm:` 以上=タブレット）を利用。場エリアのスペーサー（手札行と列を揃えるための透明 div）はモバイルでは不要になるため `hidden sm:block` で非表示に。スマホ用 2×2 グリッドは `grid grid-cols-2 sm:flex` で切り替え、1ファイルの変更のみで対応。

---

## 2026-06-07 — 10をつくろう タッチDnD修正

**コミット：** `06b6291`

### 背景・目的
スマホ・タブレットでカードをドラッグしても動かない（PCのマウスは正常）という不具合を修正。

### 変更内容
- カード要素に `touchAction: "none"` を追加（メインの修正）
- `pointercancel` ハンドラを追加してクローン要素のクリーンアップを保証

### 技術的なポイント
Pointer Events APIでDnDを実装する場合、ドラッグ可能な要素に `touch-action: none` がないと、タッチ操作時にブラウザが「スクロールかも」と判断して `pointercancel` を発火する。その結果 `pointermove` / `pointerup` が来なくなりドラッグが途切れる。`suuzu-block` はTouch Events APIを使っているため同問題が起きていなかった。

---

## 2026-06-07 — 10をつくろう ダークモード対応・ドット高さ統一

**コミット：** `00e4046`

### 背景・目的
ダークモード切替時に数字が見えなくなる・背景が変わらない問題と、1〜5のカードと6〜9のカードでドット段数が異なるため数字の縦位置がずれる問題を修正。

### 変更内容
- **ドット高さ統一**: `CardDots` の外枠に `h-[28px]` 固定。1段（1〜5）と2段（6〜9）で高さが異なっていたため数字の縦位置がずれていたのを修正
- **背景ダーク対応**: `bg-amber-50` → `bg-white dark:bg-gray-900`（ライト=白、ダーク=ほぼ黒）
- **数字テキスト色固定**: `text-gray-800` を明示。ダークモードのグローバル白文字継承で見えなくなる問題を防止
- **ヘルプテキスト改善**: `text-gray-400` に `dark:text-gray-300` / `dark:text-gray-200` 追加（4箇所）
- **場エリア背景**: `bg-white/70` に `dark:bg-gray-800` 追加。半透明だとダーク背景と混ざって中間グレーになりテキストと見分けがつかない問題を解消

### 技術的なポイント
- `bg-white/70` は `dark:bg-gray-900` 上では約 #b8bbbe（中間グレー）に見え、`text-gray-300` と差が出なかった。`dark:bg-gray-800`（不透明）で解決
- カードの `CARD_COLORS` はライトカラー（-100系）のままなので `text-gray-800` は常に十分なコントラストを確保できる

---

## 2026-06-07 — 10をつくろう（juu-tsukuri）新アプリ追加・UI完成

**コミット：** `70757a8`

### 背景・目的
1年生の「10の合成・分解」を遊びながら練習できるカードゲームを追加。1〜9のカードをドラッグしてフィールドに置き、合計が10になるペアを自動消去するシンプルなルール。全カードを消しきればクリア、フィールドが埋まって10が作れなければゲームオーバー。

### 変更内容

| 項目 | 詳細 |
|------|------|
| 新アプリ追加 | `src/app/(apps)/juu-tsukuri/` （page.tsx + layout.tsx） |
| カード18枚 | 1〜9 ×2枚、Pointer Events でドラッグ&ドロップ |
| 数字の補助ドット | 5フレーム2段ドット（1年生向け補助表現） |
| ペア自動消去 | ドロップ時に全フィールドを O(n²) で検索し即消去 + フラッシュ演出 |
| インライン結果表示 | クリア/ゲームオーバーを画面切り替えなくバナーで表示 |
| リセット確認UI | confirm() 禁止対応・「ほんとうに？」インライン確認 |
| ゲームオーバー音 | 怖い alertSound → piron に変更 |
| テキスト1年生化 | 「ペア」→「くみ」「ドラッグして〜スロット」→「ここに おいてね」等 |
| ダークモード | bg-amber-50 に dark:bg-amber-900 追加 |
| apps.ts | description も1年生向け文言に更新 |

### 技術的なポイント
- 透明スペーサーで「場」と「手札行」の列を完全一致させた（デッキ幅分を field row の先頭に opacity-0 で挿入）
- `isFlashingRef` ロックで消去アニメーション中のドラッグ受付を防止
- `module-level` 変数（dragInfo, dropCallbackRef）でPointer Events コールバック間のデータ共有
- max-w-2xl でエリア幅を制限（tasu-renshu と同パターン）

---

## 2026-06-07 — カスタムスキル4本追加とCLAUDE.mdへの自動起動設定

**コミット：** `218cf7a`

### 背景・目的
定型作業（新アプリ追加・移植・ビジュアル確認・効果音監査）を毎回手動でやるコストを削減するため、Claude Code のカスタムスキルとして自動化した。さらに「○○のアプリを作りたい」のような自然な指示文でスキルが自動起動するよう設定した。

### 変更内容

| ファイル | 内容 |
|--------|------|
| `.claude/skills/new-app.md` | 新アプリ雛形（page.tsx / layout.tsx / apps.ts）を一括作成 |
| `.claude/skills/port.md` | jimitas-old からの移植チェックリストと jQuery→React 変換ガイド |
| `.claude/skills/screenshot-review.md` | スクショ撮影→目視チェック→崩れ修正のワークフロー |
| `.claude/skills/se-audit.md` | `new Audio()` 直書き・インライン cursor など禁止パターンを全アプリ Grep |
| `CLAUDE.md` | スキル自動起動ルール表を追記（6パターン） |
| `.claude/skills/ship.md` | レポートを `docs/ship-log.md` に先頭挿入する手順を追加 |

### 技術的なポイント
- スキルの `description` フィールドがシステムプロンプトに挿入され、ハーネスがリクエストと自動照合する仕組みを活用
- CLAUDE.md のルール表を「保険」として二重に設定し、照合漏れを防止
- ship-log.md は新しいエントリを先頭挿入することで、最新の作業が上に来る構成

---
