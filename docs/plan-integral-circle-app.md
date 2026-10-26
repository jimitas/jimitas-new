# 実装計画：円の面積と円周のひみつ（積分アプリ）

- 作成：2026-10-25（計画のみ）
- 改訂：2026-10-25 微分アプリの完成（コミット 7310b3c）を受けて調査し直し、§0・§2・§5・§6 を更新。オーナー決定4件を反映
- 対象：`docs/requirements-integral-circle-app.md` v0.1
- 参考実装：`docs/ring-unroll-prototype.html`
- **状態：フェーズ0（f6ed181）・フェーズ2（35116a2）は push 済み（微分アプリ側の push に同乗）。フェーズ3（2ba42b2）・フェーズ4（345910b）・フェーズ5（①）完了・未 push。次はフェーズ6（④）**

---

## 0. Context（なぜ・前提）

授業スライド③④（速さと距離／円の面積と円周）を、ロープ実験のあとに見せるアプリとして作る。
核は「輪をほどくと直角三角形になる」アニメーション（ステップ③）で、動く試作はもうある。
姉妹アプリの微分アプリ（`/bibun`）の部品を再利用する。

### 既存コードの規則
- URL は route group `(apps)` の下で **`/xxx`**（`/apps/xxx` ではない）。微分アプリも `/bibun` にした
- 微分アプリの登録：`grades: ["高校"]`（中学は付けない）・`subjects: ["その他"]`・`type: "app"`
- 表示部品が多いアプリは `_lib/`（純TS・jest が直接読む）＋ `_components/`（表示のみ）
- テストは `src/__tests__/<app>/`
- 数式はライブラリなし（微分アプリの `MathParts.tsx` の Frac・Lim。2026-10-25 オーナー決定）
- 配色トークン：青＝`accent`、オレンジ＝`warm`、緑＝`brand`（#059669、CUD の緑 #009E73 に近い）。微分アプリも点A＝accent、点B・2点を結ぶ直線＝warm
- 効果音：微分アプリは到着時に `se.playSe(se.piron)` を1回だけ鳴らす。コインは付けない
- 無効化中の既存アプリ `circle-area`（6年・円を32分割、`layout.tsx` のみ）がある → P2 は保留（決定済み）

---

## 1. 微分アプリの完成形の調査結果（2026-10-25）

### 本アプリで使えるもの
| 部品 | 中身 | 使い道 |
|---|---|---|
| `_lib/viewport.ts` | `View`・`makeTransform`・`zoomAbout`・`zoomLimited`・パン/ピンチ・`ticks`・`snap`・`fitView`・`curvePoints`・`lineEnds`・`loupeView`・`HIT_RADIUS`・`TICK_FONT` | ①の円の座標・拡大小窓（`loupeView`）、④の2つのグラフ |
| `_components/CoordinatePlane.tsx` | 軸・格子・目盛り・軸の名前・凡例・パン/ズーム・`usePlane()`。viewBox は px そのままで、**縦横の縮尺は別々**（`View` と `aspect` で決まる） | ①の円（縦横の縮尺を揃える `View` を本アプリ側で作る）、④の左右のグラフ（縦の縮尺がちがってよい） |
| `_components/PlaneShapes.tsx` | `Curve`・`InfiniteLine`・`Segment`・`PlaneText`・`Dot`・`DragPoint` | ①④の線・文字・点。**塗りつぶし（多角形・長方形）は無い** → 追加が必要 |
| `_components/Display.tsx` | 大きく表示（`BigProvider`・`useScale`・`useText`・`TEXT`）、`usePageKeys`（スペース＝再生・→/PageDown＝1段ずつ）、`blurAfterPointer`、文脈ラベル（`MotionProvider`・`useMotion`） | 大きく表示・キー操作は③の実演で使う。文脈ラベルは微分専用 |
| `_lib/keys.ts` | キーの行き先・横取りしない要素の判定・`BIG_LINE`・`BIG_FONT` | 同上 |
| `_components/MathParts.tsx` | `Frac`・`Lim` | ½ × 2πr × r などの分数 |
| `_lib/polynomial.ts` の `formatNumber`・`formatFixed`・`MINUS` | 有効数字10桁で丸めて末尾の0を落とす／小数 d 桁 | 目盛り（CoordinatePlane が使っている）。①の「÷h」は `formatFixed(v, 2)` だと末尾の0が落ちて 12.6 になるので**使わない**（12.60 と出す別の関数を本アプリに置く） |
| `_lib/approach.ts` の `H_STEPS`・`Side`・`STEP_MS`・`nextStep`・`easeInOut`・`stepH` | 1段ずつの段（1, 0.5, 0.1, 0.01, 0.001）・次の段・3次のイージング・対数上の補間 | ①の「1段ずつ」。③のイージングも `easeInOut` に揃える |
| `@/components/parts/buttons/Btn`・`BtnMode` | 共通ボタン（もともと共通部品） | 全ステップ |

### 使えないもの・無いもの
- **記録表（RecordTable）**：列が微分専用（`deltaY`・`diffQuotient`・`H_STEPS` に固定）→ 本アプリで別に作る（見た目のクラスは揃える）
- **アニメーションのフック**：無い。各ステップの中で `requestAnimationFrame` を直接回している（`anim = useRef({ raf, t })` の形）→ 本アプリも同じ形で書く。2本以上で同じ形になったら共通化を検討する
- **`prefers-reduced-motion`**：微分アプリは対応していない → 本アプリでは要件どおり入れる（微分アプリには入れない。§5 に記録）
- **相互リンクの置き場所**：微分アプリのページに無い → フェーズ7で微分アプリ側に足す（微分アプリの変更になる）
- 試作のような「固定の viewBox を縮小して描く SVG」は微分アプリに無い → ③②の輪は CoordinatePlane を使わず、本アプリで固定 viewBox の SVG として描く

### 依存関係（移すときに一緒に動くもの）
`CoordinatePlane` → `viewport.ts`・`formatNumber`・`useScale`（Display.tsx）→ `keys.ts` の `BIG_*`。
`PlaneShapes` → `viewport.ts`・`usePlane`・`useScale`・`blurAfterPointer`。
このため座標平面だけを移すことはできず、Display.tsx の大きく表示の部分と keys.ts と数値の書式も一緒に移す。

---

## 2. フェーズ0：共通化コミット（オーナー決定：移して import を直す）

**微分アプリだけを変える単独のコミット。本アプリのファイルは1つも作らない。**（1回に1つだけ変える）

### 移すもの
| 移す前 | 移した先 |
|---|---|
| `bibun/_lib/viewport.ts`（全部） | `src/lib/graph/viewport.ts` |
| `bibun/_lib/keys.ts`（全部） | `src/lib/graph/keys.ts` |
| `polynomial.ts` の `formatNumber`・`formatFixed`・`MINUS` | `src/lib/graph/format.ts`（polynomial.ts はここから import する） |
| `bibun/_components/CoordinatePlane.tsx` | `src/components/parts/graph/CoordinatePlane.tsx` |
| `bibun/_components/PlaneShapes.tsx` | `src/components/parts/graph/PlaneShapes.tsx` |
| `bibun/_components/MathParts.tsx` | `src/components/parts/graph/MathParts.tsx` |
| `Display.tsx` の大きく表示・`usePageKeys`・`blurAfterPointer`・`TEXT`・`useText` | `src/components/parts/graph/Display.tsx` |
| `Display.tsx` の `MotionProvider`・`useMotion` | **bibun に残す**（文脈ラベルは微分専用） |
| `approach.ts` の `H_STEPS`・`Side`・`STEP_MS`・`nextStep`・`easeInOut`・`stepH` | `src/lib/graph/steps.ts` **← 最初に提示した候補リストに無かったもの。フェーズ0の開始時に移すかどうか確認する**（移さない場合、本アプリは段の値を自前で持ち、テストで微分アプリと一致を固定する） |

- bibun に残すもの：`polynomial.ts`（式・プリセット・係数入力）、`approach.ts` の残り（`initialView`・`chaseView`・`hAt` など）、`average`・`derivativeStep`・`expand`・`practice`・`text`、`RecordTable`・`FunctionPicker`・`ExpandSteps`・`DerivativeRules`・`Practice`・`Step*`
- 元の場所に転送用のファイルは残さない（入口を1つにする）
- テストも移す：`viewport.test.ts`・`keys.test.ts` → `src/__tests__/graph/`、`polynomial.test.ts` の書式のテスト → `src/__tests__/graph/format.test.ts`
- 共通部品のコメントの「微分のアプリ固有の事情は持ち込まない」はそのまま残す

### 注意点
- `wording.test.ts` は bibun フォルダの全ファイルを読んで「割線」が1か所だけかを検査している。移したファイルは検査の外に出るが、移すものは「割線」を含まない汎用部品なので問題ない。「10本以上読んでいる」の番人は移したあとも満たす（残るファイルは15本以上）。移したあと実際に件数を確かめる
- `layout-compare` は**ページを開いた直後の画面**しか比べない（①タブ）。②③タブ・アニメーション・ドラッグ・キー操作は Chrome で実機確認する

### フェーズ0の確認
1. 変更前に `APPS=bibun npx tsx scripts/layout-compare.ts before` を2回撮って差分ゼロ（ベースラインが揺れないこと）
2. 移動 → `npm test`（全件緑）・`npx tsc --noEmit`・`npm run lint`
3. `layout-compare after` → `diff` で差分ゼロ
4. Chrome で `/bibun` の②「▶ 近づけてみる」・1段ずつ・追いかけズーム・ルーペ・点のドラッグ・スペース/→、③「なぞる」、大きく表示
5. `reviewer` に「移動だけで、ふるまいが変わっていないか」を見てもらう → 指摘を一覧で見せて採用/保留を聞く
6. `npm run test:e2e`（smoke・常設検査4本）

---

## 3. 作るファイル・ディレクトリ（フェーズ1以降）

アプリ id は `sekibun-en`（URL `/sekibun-en`。微分アプリと同じ規則）。

```
src/app/(apps)/sekibun-en/
├── layout.tsx                 SEO（getAppMetadata / getAppJsonLd）。bibun と同じ形
├── page.tsx                   タブ①〜④・表示レベル（ことばで／記号で）・大きく表示・タブ間で共有する r
├── _lib/                      ← React・DOM に触らない純TS
│   ├── unroll.ts              §5.1 輪をほどく計算（核）
│   │     ringMidRadius(i, n, r)      輪 i の中心線の半径 (i − ½)Δr
│   │     ringPoints(rm, t, anchor)   長さ 2πrm を保つ弧の点列（数値の配列）
│   │     ringStepCount(L)            点の数 max(60, ceil(L/3))
│   │     unrollBounds(n, r, t)       全輪の外接矩形（線の太さ込み）→「はみ出さない」の検査用
│   │     ringProgress(i, n, t, mode) 1本ずつほどくモード（P1）の輪ごとの進み具合
│   │     ringIndexAt(dist, r, n)     中心からの距離 → 何本目の輪か（②のタップ選択）
│   ├── scene.ts               ③②の固定 viewBox の座標系（R_PX・X0・CY・幅×高さ）と完成形の三角形の頂点
│   ├── growth.ts              ①：増えた面積 = h·π(2r+h)、÷h = π(2r+h)、円周 2πr（引き算しない）。円を描く View
│   ├── compare.ts             ④：y = kx の下の細い長方形 n 本（座標と面積）、三角形の面積 ½·x·kx
│   ├── format.ts              小数第2位で末尾0を残す（12.598 → "12.60"）／有効数字3桁（0.0126）
│   └── text.ts                画面の文言（ことばで／記号で）。jest で固定する
└── _components/
    ├── RingDisk.tsx           輪の束の SVG（n, t, 選んだ輪, 進み方）。③の本体、②でも使う
    ├── UnrollControls.tsx     ▶ ほどく／⏸ 止める／◀ 巻き戻す・進み具合スライダー・輪の数
    ├── GrowthTable.tsx        ①の記録表（見た目は bibun の RecordTable に揃える）
    ├── StepGrowth.tsx         ①面積の増え方
    ├── StepCutRing.tsx        ②輪を切り開く
    ├── StepUnroll.tsx         ③輪をほどいて積み上げる
    ├── StepCompare.tsx        ④速さと距離とくらべる
    └── SummaryTable.tsx       スライド24のまとめ表

src/components/parts/graph/PlaneShapes.tsx   Polygon（塗りつぶし）を追加（④の三角形・長方形）。足すだけ
src/data/apps.ts                             1件追加（grades ["高校"]・subjects ["その他"]）
src/__tests__/sekibun-en/                    unroll / growth / compare / format / text の各テスト
```

- アニメーションは bibun と同じく各ステップで `requestAnimationFrame`（`anim = useRef({ raf, t })`）。`prefers-reduced-motion` のときは長さを短くする（chokin-toushi の `matchMedia` の書き方にならう）
- `polyline` の `points` は `useMemo` で作る。64本でも点の総数は数千点程度
- 大きく表示は共通の `useScale` を使う（輪の線の太さは Δr なので倍率をかけない。文字とガイド線だけ）

---

## 4. フェーズごとの作業と確認方法（要件 §9）

各フェーズ：実装 → 自分でテスト → `reviewer` → 指摘を一覧で見せて採用/保留を聞く。

| # | 作業 | 確認方法 |
|---|---|---|
| 0 | **共通化コミット**（§2） | §2 の確認1〜6 |
| 1 | 調査報告 | **完了**（本文書 §1） |
| 2 | **輪をほどく計算** `_lib/unroll.ts`・`scene.ts` | `unroll.test.ts`。**検査を壊して落ちることを確認**（曲率の式を変える・点の数を減らす・X0 を左へ寄せる） |
| 3 | **ステップ③**：RingDisk・UnrollControls・StepUnroll（ガイド破線のフェードイン、切れ目、完成時ラベル、結論、輪の数の途中切替、スペースで再生） | Chrome で PC 横長／1024×768／360px。試作と並べて動きが同じか目視。**ここで報告し、実演に使えるか確認を取る** |
| 4 | **ステップ②**：輪のタップ選択、1本だけほどく、長さ・太さの表示 | `ringIndexAt` のテスト、実機で輪をタップ |
| 5 | **ステップ①**：円＋のばした輪、h スライダー（0 不可）、1段ずつ、記録表、拡大小窓、結論 | `growth.test.ts`（15.71 → … → 12.57）、実機で1段ずつ5回 |
| 6 | **ステップ④**：2つのグラフ、共通スライダー（0〜4・初期2）、長方形の積み上げ（4〜64本）、ラベル、まとめ表 | `compare.test.ts`（x = r = 2 で 4 と 12.57）、実機 |
| 7 | **仕上げ**：表示レベル切替、レスポンシブ、ダークモード、文言、`layout.tsx`・`apps.ts`、相互リンク（微分アプリ側は別コミット）、reduced-motion | `npm test`・`npm run test:e2e`・`next build` 警告なし・`/screenshot-review`・`/seoaio` |
| 8 | **P1**：1本ずつほどく、∫ 表示、帯をグラフへ重ねる、r の変更（1〜4） | `ringProgress` テスト、`text.test.ts`、実機 |
| 9 | P2（ロープ表示）。おうぎ形→長方形は**保留**（circle-area と合わせて後で整理。決定済み） | — |

---

## 5. ユニットテスト一覧（§8 との対応）

| テスト | 内容 | §8 |
|---|---|---|
| unroll: t = 0 | どの輪も点がすべて中心から rm の円周上（誤差 1e-9） | 8 |
| unroll: t = 1 | すべての点の y が y_b（水平な線分）、x は x₀〜x₀+2πrm | 8 |
| unroll: 長さ | t = 0, 0.1, 0.25, 0.5, 0.9, 1 で、隣り合う点の距離の和 ≒ 2πrm（折れ線なので点数に応じた許容差） | 8 |
| unroll: 真下の点は固定 | どの t でも s = 0 の点が (x₀, y_b) | 3 |
| unroll: k ≈ 0 の切替 | t = 1 − 1e-9 と t = 1 で点がほぼ一致（式の切替で跳ばない） | 4 |
| unroll: 完成形が三角形 | t = 1 で、帯の右端が「底辺 2πr・高さ r の斜辺」に沿う | 3 |
| unroll: はみ出さない | n = 4〜64、t を 0〜1 で細かく振って `unrollBounds` が viewBox 内（線の太さこみ。**ラベルは含まない** → フェーズ3でラベルの位置を scene.ts に置き、別のテストで viewBox 内を固定する）。**左端は t ≈ 0.28 で x₀ − 約(4/3)rm、上端は t ≈ 0.63 で y_b − 約4.55rm**（要件 v0.1 の「t = 0.5 で 4r」は誤りだったので要件書も修正済み） | 3 |
| unroll: 点の数 | `ringStepCount` が長さに比例し最低60 | 5（間接） |
| unroll: 輪の選択 | `ringIndexAt` が境界・中心・外側で正しい輪を返す | 2 |
| unroll: 1本ずつ | `ringProgress` が 0〜1 に収まり、t = 0 で全部0、t = 1 で全部1、順番どおり | F3-8 |
| growth: 1段ずつの値 | r = 2 で ÷h が 15.71, 14.14, 12.88, 12.60, 12.57 | 1 |
| growth: 増えた面積 | 有効数字3桁で 15.7, 7.07, 1.29, 0.126, 0.0126（決定済み） | 1 |
| growth: 引き算しない | h = 1e-12 でも ÷h が 2πr にほぼ一致（引き算実装なら崩れる。微分アプリの「番人」と同じ考え方） | 1 |
| growth: どの r でも | r = 1〜4 で h = 0.001 の値が 2πr と小数第2位で一致 | F1-6 |
| growth: 帯の長さ | 帯の長さの表示 = 2π×(その輪の半径) | 2 |
| growth: 輪の面積の合計 | 2πrmΔr の n 本の和が n によらず πr² | §5.2 |
| compare: x = r = 2 | 左の面積 4、右の面積 12.57 | 6 |
| compare: 長方形 | n 本の幅の和 = x、n を増やすと面積の和が三角形に近づく | F4-3 |
| format | 12.598 → "12.60"、12.6 → "12.60"、0.012566 → "0.0126"、負の数は「−」、−0 → "0" | §5.2 |
| text | 結論・ラベルの文字列（`(πr²)' = 2πr`、`∫₀ʳ 2πt dt = πr²` 等）を固定 | F1-5, F3-6, F3-9 |
| 段の値の一致 | 本アプリの1段ずつの段が微分アプリと同じ（steps.ts に移さなかった場合だけ必要） | 1 |
| 微分アプリの既存テスト | 全件緑 | 7 |

§8 の 5（カクつかない）・9（build）は実機と `next build` で確かめる。7 の「表示が変わっていない」は `layout-compare`＋実機で確かめる。

---

## 6. 決定事項（2026-10-25）

| # | 内容 | 決定 |
|---|---|---|
| D1 | 共通部品の置き場所 | `src/lib/graph/`・`src/components/parts/graph/` へ移し、bibun の import を直す。転送用ファイルは残さない（オーナー決定） |
| D2 | ①「増えた面積」の桁 | 有効数字3桁。「÷h」は小数第2位（オーナー決定） |
| D3 | おうぎ形→長方形（F5-1）と circle-area | P2 は保留し、あとで circle-area と合わせて整理（オーナー決定） |
| D4 | ④の共通スライダー | 0〜4、初期値 2。縦軸は左右で別の縮尺（オーナー決定） |
| D5 | URL・登録 | `/sekibun-en`、`grades: ["高校"]`・`subjects: ["その他"]`（微分アプリの決定にならう） |
| D6 | 数式表示 | ライブラリなし。共通の `Frac` を使い、∫ は文字（∫₀ʳ）で書く（微分アプリの決定にならう） |
| D7 | イージング | 微分アプリの `easeInOut`（3次）に揃える。2026-10-26 の実演確認で動き出しの遅さも含めて了承 |
| D8 | ③の図の大きさ | 試作と同じ配置（円は左下に小さく）のままでよい（2026-10-26 オーナー確認「最高」） |
| D9 | ②の数値 | 半径 r = 2（①と同じ）・輪 8 本（太さ 0.25）に固定。帯の長さは輪のまん中の円周 2π × rm（円周 × 太さ が輪の面積とちょうど等しい）。表記は要件どおり「≒」。面積は画面に出した長さ（丸めた値）× 太さで出し、検算と合わせる（推奨で決定） |
| D10 | ②の輪の選び方 | タップ（click。指を置いただけ・スクロールでは選ばない）＋「◀ 内側の輪／外側の輪 ▶」ボタン（推奨で決定） |
| D11 | 進め方 | 2026-10-26 夜、オーナー就寝中はフェーズを承認待ちなしで進め、レビュー指摘は推奨どおりに採否を決める。push しない・`disabled: true` は外さない。実機確認でおかしな所を直す |

## 7. 残っている質問（仮案のまま進め、気になれば途中で相談）

| # | 質問 | 仮案 |
|---|---|---|
| Q1 | approach.ts の段・イージングも共通の場所へ移すか（§2 の表の最後の行） | 移す（フェーズ0の開始時に確認） |
| Q2 | r はタブ間で共有するか。③の円は画面上の大きさが固定で、r は記号としてだけ出す | ①④は r を共有、③は記号の r のみ |
| Q3 | ③の一時停止 | ▶ が再生中は「⏸ 止める」に変わる（微分アプリの ▶ と同じ） |
| Q4 | ①の拡大小窓 | **決定（推奨）**：アプリ専用の `loupeWindow`（_lib/growth.ts）。輪の右はしを中心に、輪の太さがいつも小窓の幅の 1/5 に見える倍率（h = 0.001 で約1400倍）。共通の `loupeView` は表示範囲の拡大用で、h に追従させる用途に合わないため使わなかった |
| Q5 | ③の左端の余白（t ≈ 0.25 で輪が左へ (4/3)r 出る。試作の X0 = 110 だと余白約3px） | X0 を 120 程度に。PC とスマホで同じ viewBox を縮小 |
| Q6 | 効果音 | ほどき終わったときに piron を1回（微分アプリの到着時と同じ）。コインなし |
| Q7 | F4-5（帯を右グラフへ重ねる） | ④の中で帯を描き直す |
| Q8 | 「文脈ラベル（時間・距離）」の切替を付けるか | 付けない（④で両方を並べて見せるため） |

---

## 8. 持ち越し・記録しておくこと

- e2e `tests/dark-after-question.spec.ts` の bibun が落ちる（既存。7310b3c の時点から）。練習問題の「もんだい」ボタンは ③ タブにしかなく、ページを開いた直後（①）は `hidden` なので、テストが押せずに時間切れになる。直し方（テストで ③ を開く／bibun を対象外にする）は未決定
- フェーズ0のレビュー指摘：1〜4 は採用して直した。5（parts/ は「2つ以上のアプリで使うもの」だが、今は bibun だけ）は、積分アプリが使い始めれば解消するので保留。CLAUDE.md の構成図には lib/graph・parts/graph を追記した
- フェーズ5のレビュー指摘：6 件すべて採用（「1段ずつ」は動いている途中も disabled にせず押しても何もしない・5段目のあとキーボード操作なら選択をリセットへ、動いている途中のリセットの画面テスト、拡大の四角を図の中に切りつめ半径の線を左向きに、小窓の説明を下に、読み上げ領域を常設、計画書の名前）
- テストのファイル名は計画 §5 の unroll/growth/compare/format/text ではなく、ステップごと（unroll.test.ts・step1〜3.test.ts）にした。数値の書式（format2・formatSig3）は step1・step2 の中で検査している
- F1-6（P1、r の変更）：h = 0.001 での ÷ h と 2πr の差はちょうど πh。r = 4 では 25.14 と 25.13 で小数第2位が一致しない。P1 で r を変えられるようにするとき、目標の行の出し方を相談する
- ① の「引き算をしない」の番人は r = 10⁶・h = 10⁻⁶（r = 2・h = 1e-12 では引き算でも誤差 0.001 しか出ず番人にならなかった）
- フェーズ4のレビュー指摘：5 件すべて採用して直した（タップは click で選ぶ、「選んだ輪だけが帯になる」の画面テスト、面積は丸めた長さから出す＋format2 を十進数の四捨五入どおりに、帯の下に太さのラベル、端に着いたら選択をもう一方のボタンへ）
- `format2` は toFixed だけだと 2進数の誤差で 2.945 → "2.94"・1.005 → "1.00" になる。補正してテストで固定した（①の記録表でも同じ関数を使う）
- フェーズ3のレビュー指摘：1〜6 すべて採用して直した（図の下の一言を動きの向きで出し分け、ラベル位置を labelLayout に一本化、tests/sekibun-en.spec.ts を新設、問いかけからボタン名を外す、スライダーに aria-valuetext、コメントのファイル名）。3 のうち「ページを離れたときにアニメを止める」の画面テストは、タブを切りかえられるようになるフェーズ4以降で足す
- 共通部品 `BtnMode`（src/components/parts/buttons）に `aria-pressed` がなく、どれが選ばれているかが読み上げで伝わらない（全アプリ共通の課題。本アプリでは直さない）
- 実演確認で相談すること：(1) 図が小さい（4.55r の山と 2πr の底辺を収めるため円が左下に小さい。PC で図を横幅いっぱいにする案）(2) 3次のイージングは動き出しが遅い（0.8 秒で約9%。試作の2次のほうが早く動く）
- フェーズ2のレビュー指摘：1〜6 と参考（初期値のテスト）は採用して直した。7（1本ずつほどくモードのはみ出し検査は、64本だと1本あたり4点しか見ていない）は保留：輪ごとの最大のはみ出しは「全部いっしょ」で細かく見ていて実害がないため。1本ずつのモードを描くフェーズ8で見直す
- `steps.ts` の `nextStep` のテストは、微分アプリの受け入れ基準（5 → 4.5 → …）を固定しているので `src/__tests__/bibun/approach.test.ts` に残した。`stepH`・段の値のテストは `src/__tests__/graph/steps.test.ts`

- 微分アプリは `prefers-reduced-motion` に対応していない（要件にも無い）。本アプリだけ対応する。揃えるかは別途
- `src/lib/seo.ts` の JSON-LD `audience.description` が `小学${gradeText}` 固定で「小学高校」になる既存不具合は、本アプリにも出る（微分アプリのときにオーナー判断で保留済み）
- 微分アプリへの相互リンクの追加は、フェーズ7で微分アプリを変える別コミットになる
- アニメーションのループ（`anim = useRef({ raf, t })`）は bibun の3ステップと本アプリで同じ形が増える。共通化は本アプリの完成後に検討する

## 9. 検証（全体）

- `npm test`（本アプリ＋共通部品＋微分アプリの jest 全緑）
- 新しい検査は**壊して落ちることを確認**してから戻す
- `npm run test:e2e`（smoke・常設検査4本 `button-row-align` / `put-shiki-clip` / `show-answer-no-coin` / `dark-after-question`）
- 共通部品を触ったら `layout-compare`（APPS=bibun）と `/bibun` の実機確認
- Chrome 実機：PC 横長、1024×768、360px。64本でのカクつき、③のはみ出し、ダークモード
- `next build` が警告なし
- push 後は報告レポート（`docs/ship-log.md`）

## 10. 引き継ぎ

- フェーズ3 は完了（2026-10-26）。§0 の状態と §8 の持ち越しを見る。
- 確認方法：`npx jest src/__tests__/sekibun-en`（単体）、`npx playwright test tests/sekibun-en.spec.ts`（画面）。スライダーの値は 0.001 刻みで、巻き戻しの終わる少し前にも "0" と出るので、終わりはボタンの文字で待つ
