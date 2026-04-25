# じみぷり移植 開発ログ

## 概要
jimitas-old/jimipri（39種の算数プリント生成アプリ）を jimitas-new に統合する。

## Phase 1（2026-04-25）: 基盤 + 1年生計算5本

### 完了した作業

#### Step 1: 基盤ファイル作成
- `layout.tsx` — SEO（getAppMetadata + getAppJsonLd）
- `_lib/types.ts` — PrintDef, OneLineResult 等の型定義
- `_lib/prints.ts` — 全39種のメタデータ（Phase 1の5本は実装済み、残りはプレースホルダー）
- `_lib/duplicationCheck.ts` — 問題重複チェック

#### Step 2: ポータルページ
- `/jimipri/page.tsx` — 学年別メニュー（1〜6年生、39種を一覧表示）
- `globals.css` — `.jimipri-print-wrapper` / `.jimipri-print-area` 印刷用CSS
- `apps.ts` の `disabled: true` を解除

#### Step 3: プリントページ（動的ルート）
- `/jimipri/[printId]/page.tsx` — 各プリントの表示ページ
  - コントロールパネル（もんだい / こたえ / いんさつ / モード選択）
  - A4プレビュー（OneLineTable + AnswerArea）
  - 印刷対応（position:fixed + @page A4 portrait）

#### Step 4: 問題生成関数（5本）
| ID | タイトル | 元ファイル |
|----|---------|-----------|
| tasu-1 | たしざん（１） | 02_tasu_1.js |
| hiku-1 | ひきざん（１） | 03_hiku_1.js |
| tasu-2 | たしざん（２） | 06_tasu_2.js |
| hiku-2 | ひきざん（２） | 07_hiku_2.js |
| kake-1 | かけ算（１） | 16_kake1.js |

---

## Phase 2（2026-04-25）: oneLine系5本 + 効果音 + ThreeLineTable

### 完了した作業
- `kake2.ts` — かけ算（2）: 6〜9の段 / 2〜9の段（2モード）
- `warizan.ts` — わり算: 割り切れるわり算（20問）
- `wariAmari.ts` — あまりのあるわり算: 「商…余り」形式
- `hyakuMade.ts` — 100までのかずのけいさん: 4モード
- `mittuNo.ts` — 3つのかずのけいさん: +/+, -/-, 混合（ThreeLineResult）
- ThreeLineTable コンポーネント追加
- 効果音: もんだい→se.set、こたえ→se.pi
- MODE_OPERATORS 導入（100made用）

---

## Phase 3（2026-04-25）: 筆算4本 + ColumnCalcTable

### 完了した作業
- `hissan1.ts` — たし算とひき算のひっ算（1）: 4モード（くり上がり/下がり制御）
- `hissan2.ts` — たし算とひき算のひっ算（2）: 4モード（100超え）
- `kakeHissan1.ts` — 1けたをかけるかけ算の筆算: 4モード
- `kakeHissan2.ts` — 2けたをかけるかけ算の筆算: 2モード（2桁/3桁×2桁）
- ColumnCalcTable: 2桁/3桁自動判定、renderColumn2Digit / renderColumn3Digit

---

## Phase 4（2026-04-25）: わり算筆算 + 小数3本

### 完了した作業
- `wariHissan1.ts` — 1けたでわるわり算の筆算: 2モード
- `wariHissan2.ts` — 2けたでわるわり算の筆算: 3モード
- `shousuKiso.ts` — 小数のかけ算やわり算: 4モード（MODE_DISPLAY で表示切替）
- `shousuKake.ts` — 小数のかけ算: 3モード
- `shousuWari.ts` — 小数のわり算: 3モード
- DivisionTable: わり算筆算レイアウト（除数 ) 被除数）
- DecimalCalcTable: 小数筆算レイアウト
- MODE_DISPLAY 導入（shousu-kiso用）

---

## Phase 5a（2026-04-25）: カスタムテキスト問題6本

### 完了した作業
- `senMade.ts` — 1000までの数: 10問テキスト穴埋め
- `manMade.ts` — 10000までの数: 10問テキスト穴埋め
- `kasaNagasa.ts` — かさ・長さのたんい: 15問単位変換
- `jikoku.ts` — 時こくと時間: 10問時間計算
- `monoHito.ts` — ものとひとのかず: 4問文章題
- `tasuHiku.ts` — たすのかなひくのかな: 4問文章題
- CustomResult 型追加
- CustomProblemDisplay コンポーネント追加

---

## Phase 5b（2026-04-25）: 文章題5本 + 分数6本

### 完了した作業
- `taiseki.ts` — 体積: 8問（立方体・直方体・三角柱・台形柱・円柱）
- `taniryou.ts` — 単位量あたりの大きさ: 5問
- `hayasa.ts` — 速さ: 8問（速さ・道のり・時間の相互変換）
- `mojitoshiki.ts` — 文字と式: 9問（表 + 文字式）
- `hirei.ts` — 比例と反比例: 10問（表 + 比例/反比例判定）
- `bunsuKiso.ts` — 分数（基礎）: 17問（真分数/仮分数、帯分数→仮分数、大小比較、同分母加減）
- `bunsu1.ts` — 分数（１）: 18問（約分、通分比較、異分母加減）
- `bunsu2.ts` — 分数（２）: 20問（商→分数、分数→小数、小数→分数）
- `bunsuKake.ts` — 分数×分数: 10問（4モード: 分数×整数/分数/帯分数×分数/帯分数）
- `bunsuWari.ts` — 分数÷分数: 10問（4モード: 同上）
- `bunsuu.ts` — 分数ユーティリティ（reduceFraction, bunsuAdd/Minus/Multiplication/Division, fracHtml）
- 分数CSS（.jf / .jf-n / .jf-d / .jf-whole / .jf-row）
- CustomProblemDisplay に dangerouslySetInnerHTML 対応（分数HTML描画用）

---

## Phase 5c（2026-04-25）: 最後の4本（全39種完了）

### 完了した作業
- `nanbanme.ts` — なんばんめ: 5問（テキスト版、どうぶつ名で順番を問う）
- `nanji1.ts` — なんじなんじはん: 6問（テキスト版、針の位置を言葉で描写）
- `nanji2.ts` — なんじなんぷん: 6問（テキスト版、5分刻み）
- `hyouGraph.ts` — ひょう・グラフ: 10問（テキスト版、どうぶつの数を数えて表/グラフ）

### 設計判断（Phase 5c）
- **nanbanme/nanji/hyou-graph** は元々Canvas描画や画像を使っていたが、プリント用途ではテキスト表現に変換
- 今後、画像/Canvas版を追加する余地は残している

---

## 全体統計

| 項目 | 値 |
|------|-----|
| 総プリント数 | 39種 |
| 問題生成関数 | 39本 |
| 表示タイプ | 6種（oneLine, threeLine, column, division, decimalColumn, custom） |
| 共通ユーティリティ | duplicationCheck, bunsuu（分数計算） |
| 学年範囲 | 1〜6年生 |
| 実装期間 | 2026-04-25（Phase 1〜5c 全て同日） |

### ファイル構成（最終）
```
src/app/(apps)/jimipri/
  layout.tsx                    ← SEO
  page.tsx                      ← ポータル（学年別メニュー）
  [printId]/page.tsx            ← 各プリントページ（6つの表示コンポーネント）
  _lib/
    types.ts                    ← 型定義
    prints.ts                   ← 39種のメタデータ
    duplicationCheck.ts         ← 重複チェック
    bunsuu.ts                   ← 分数ユーティリティ
    problems/
      tasu1.ts ... bunsuWari.ts ← 39本の問題生成関数
```
