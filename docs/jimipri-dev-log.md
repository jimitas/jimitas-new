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

### 設計判断
- **DOM操作 → 純粋関数**: 元のinnerHTMLパターンをReact state + JSX描画に変換
- **動的ルート**: 39種を1つの `[printId]/page.tsx` で処理（ファイル爆発を防止）
- **未実装プリント**: ポータルで「準備中」表示（divでリンクなし）
- **印刷CSS**: kanji-printと同パターン（position:fixed方式）

### 残課題
- [ ] ブラウザでの印刷プレビュー実機確認
- [ ] Phase 2〜5 の残り34種の移植

---

## Phase 2（予定）: 残りの1年生 + 100まで

対象: nanbanme, nanji-1, 3tuno, mono-hito, nanji-2, tasu-hiku, 100made

## Phase 3（予定）: 2年生（筆算テーブル + かけ算）

対象: hyou-graph, hissan-1, 1000made, hissan-2, kake-2, 10000made, kasa-nagasa

## Phase 4（予定）: 3年生

対象: warizan, jikoku, wari-amari, kake-hissan1, kake-hissan2

## Phase 5（予定）: 4-6年生

対象: wari-hissan1/2, shousu系, bunsu系, taiseki, taniryou, hayasa, mojitoshiki, hirei
