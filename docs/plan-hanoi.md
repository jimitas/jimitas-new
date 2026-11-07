# 計画書：ハノイの塔（/hanoi）

仕様の正本は `docs/requirements-hanoi-app.md`。詳細な計画は `C:\Users\nonaj\.claude\plans\c-claude-edu-apps-jimitas-new-docs-requ-sleepy-lecun.md`（会話が切れたらこれを読んで再開）。

## 決定済み（2026-11-08 オーナー）
- PlayerControls は /algorithm からコピーして改変（`_components/AutoControls.tsx`）。/algorithm には触らない
- ローカルでコミットまで。**push しない**
- reviewer の指摘は記録だけ（下の一覧）。採否はオーナー帰宅後
- 範囲は P0＋P1
- 配色：円盤の色＝動く円盤の1つだけの意味。①〜⑥は `CLAY_COLORS`（仮色）、⑦〜⑩は茶系。F2-11 手順の帯を追加

## 進捗
- [x] 0 要件書の配色差しかえ
- [x] 1 計算（_lib＋jest＋壊して確認）
- [ ] 2 ステップ②＋ページ枠＋apps.ts
- [ ] 3 ステップ①
- [ ] 4 ステップ③
- [ ] 5 ステップ④
- [ ] 6 ステップ⑤
- [ ] 7 仕上げ
- [ ] 8 e2e
- [ ] 9 全体確認・reviewer・memory

## 壊して確かめた記録
2026-11-08 フェーズ1：①canMove の「大きい円盤をのせられない」判定を無効化 → 1件落ちる ②日本語単位で 0 のグループを飛ばさない → 1件落ちる ③スナップショットからの適用開始位置を1手ずらす → 2件落ちる。3つとも確認後に復元（64件緑）

## reviewer 指摘（採否待ち）
（なし）
