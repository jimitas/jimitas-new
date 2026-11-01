# 計画書：さいころの散らばりシミュレーター（/saikoro-chirabari）

仕様の正本は `docs/要件定義書_さいころ散らばりシミュレータ.md`。ここには決定事項・実装の対応・持ち越しを書く。

## 決定済みの設計判断（2026-11-01 オーナー）
- URL `/saikoro-chirabari`、タイトル「さいころの散らばりシミュレーター 〜10回じゃ足りない？〜」
- 配色：CUD 推奨色 A=オレンジ `#E69F00`／B=ブルー `#0072B2`（ダークでは B を `#56B4E9`）。アプリ内の定数（`_components/methodStyle.ts`）で持ち、globals.css には足さない
- F-8 シード：シード付き乱数（mulberry32）はテスト用に内部だけ。画面には出さない
- 2026-11-01 オーナーの「いったん完成」の判断で公開（`disabled` なし）

## 実装の対応（要件 → ファイル）
| 要件 | ファイル |
|---|---|
| F-1〜F-4 セクション1 | `_components/TrySection.tsx`・`DotPlot.tsx`・`StatsCard.tsx`・`ConvergenceChart.tsx`・`RollControls.tsx`・`useRoller.ts` |
| F-5 セクション2 | `_components/CompareSection.tsx` |
| F-6 セクション3（中核） | `_components/SetsSection.tsx`・`SdHistogram.tsx`、`_lib/sets.ts` |
| F-7 セクション4 | `_components/GroupSection.tsx`、`_lib/input.ts` |
| §6 計算仕様（÷n・表示桁） | `_lib/stats.ts`・`_lib/format.ts` |

要件にない追加：③の「A・B 両方」タブ（重ねたヒストグラムと「A のほうが大きくなった組の割合」）。授業で起きる逆転がどれくらいふつうかを数で見せるため。

## テスト
- jest `src/__tests__/saikoro-chirabari/stats.test.ts`：受け入れ条件 1・2・3・5・6、理論値（B=A×2）、÷n、表示桁、入力、画面に出さない用語
  - 分散を ÷(n−1) に書き換えると 7 件落ちることを確認済み（2026-11-01）
- e2e `tests/saikoro-chirabari.spec.ts`：条件 4・5・7、点→棒の切替、▼マーカー、B の奇数
- 条件 8（投影での可読性）は 1280×720 のスクショで目視。統計値は 48px 前後

## レビュー（2026-11-01、reviewer）の採否
- 採用：③の班の判定文を割合で3通りに分ける（1%未満・99%超は「かなり珍しい。記録や計算を確かめよう」。`_lib/verdict.ts`）／
  e2e の ▼ 検査をヒストグラムの svg に絞る（▼を消すと落ちることを確認済み）／貼り付けであふれた値を知らせる（`distribute`）／
  「A・B 両方」では ▼ に「班（A）」を添え、帯を指す文を使わない／セット数ボタンに aria-pressed（共通の `Btn` に `ariaPressed` を追加）／
  入力欄のエラー文を label の外へ
- **保留**：ページ全体が `"use client"`（要件 §7 は「インタラクション部分のみクライアント」）。静的に事前描画はされており実害はほぼない。
  既存アプリと同じ形のため、仕様とのズレとして記録だけする

## 持ち越し
- 既存アプリ（数学Ⅰの他コンテンツ）からの導線は未定（要件 §12-3）
- iPad 実機・プロジェクタ実機での確認はオーナー待ち
