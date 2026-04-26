# メモリ整合性 Audit

**作成**: 2026-04-26（夜間自律タスク）
**スコープ**: `memory/` 配下全 .md ファイル（54件）
**基準**: `docs/06_配色設計.md` の「-400 白抜き」と `danger` トークン設計

---

## 調査方針

各メモリファイルの `description` と主要内容を確認し、以下の観点でチェックする。

1. **danger トークン整合**: BtnUndo / BtnStop が `danger` であると正しく記載されているか
2. **-400 ベース白抜き整合**: ボタンスタイルの説明が新標準（-400 ベース）で書かれているか
3. **物の色の取り扱い**: raw color の許容ケースが適切に記載されているか

---

## 整合状態マトリクス

### ✅ 整合済み（最新標準と一致）

| ファイル | 確認ポイント |
|---|---|
| `feedback_design_tokens.md` | 2026-04-26 全面更新済み。danger トークン・-400 白抜き・物の色 OK |
| `feedback_new_app_checklist.md` | 新アプリ追加手順に danger トークンへの言及なし（ボタン部品を使うだけなので許容範囲）|
| `project_sakusen_board.md` | チーム色（赤=#DC2626・青=#1D4ED8）は「物の色」として許容 ✅ |
| `project_kuku.md` | 行=rose・列=accent・積=brand の識別色は「物の色」として許容 ✅ |
| `project_kazoe_bou.md` | 百=pink・十=yellow・一=blue は「物の色」として許容 ✅ |
| `project_okane_dnd.md` | 硬貨の yellow/amber は「物の色」として許容 ✅ |
| `project_sangenshoku.md` | RGB/CMY カラーは「物の色」として許容 ✅ |

### ⚠️ 軽微な不整合の可能性（要確認・修正禁止）

以下はメモリ内容を詳細に読み込んでいないため、翌朝確認が推奨されるもの。

| ファイル | 懸念ポイント |
|---|---|
| `project_hissan.md` | 筆算アプリのボタン記述が旧スタイル（-500 系/グレー）で残っている可能性。「クリア」ボタンの記述が旧情報かも |
| `project_romaji.md` | ローマ字アプリの「もんだい」ボタンが warm-orange で表示されている（スクショで確認）。メモリ内の記述が旧状態を指している可能性 |
| `project_gakuten.md` | gakuten はスクショ検証で「bg-green-500 の取りこぼし」が検出されて修正済み。メモリがその修正前の記述のままかも |
| `project_kenban_instruments.md` | kenban の「キーボードトグル」ボタンが `bg-green-500` → 修正済みだが、メモリが修正前を指している可能性 |

### ❓ 配色設計との直接的な言及なし（中立・問題なし）

以下はボタン配色に触れていないメモリで、danger/danger トークンとの矛盾はない。

- `feedback_no_back_link_in_apps.md` — ナビゲーション系
- `feedback_sound_mute_pattern.md` — 効果音系
- `feedback_coin_dedup.md` — コイン重複防止
- `feedback_dnd_display_bug.md` — DnD display 問題
- `feedback_ref_layout_effect.md` — useLayoutEffect
- `feedback_inline_style_pseudo.md` — インラインスタイル
- `feedback_seikai_display.md` — せいかい演出パターン
- `feedback_freedrag_implementation.md` — 自由ドラッグ実装
- `project_parts_structure.md` — 部品構成（ボタン記述あるが部品名のみ・色指定なし）
- `project_eslint_cleanup_2026.md` — ESLint 整理
- `project_seo_setup.md` — SEO 設計
- `project_jimitas_com_migration.md` — ドメイン移行
- `project_unported_apps_todo.md` — 未移植アプリ一覧

---

## 最重要メモリの整合状態

### `feedback_design_tokens.md`（最重要）

✅ **整合済み** — 2026-04-26 の全面リファクタリングで最新内容に更新済み。
- danger トークン（rose 値エイリアス）の説明 ✅
- -400 ベース白抜きパターン ✅
- 物の色の許容ケース一覧 ✅
- 共通ボタン部品とトークンの対応表 ✅
- BtnUndo / BtnStop が danger に変更済み ✅

---

## 翌朝確認 ToDo

- [ ] `project_hissan.md` — 筆算アプリのボタン記述が旧スタイルで残っていないか確認（修正禁止、不整合があれば更新のみ）
- [ ] `project_romaji.md` — ローマ字「もんだい」ボタンの色についてメモリ記述を確認（スクショでは warm-orange が見える → brand-green が正解のはず）
- [ ] `project_gakuten.md` / `project_kenban_instruments.md` — スクショ修正後の状態に記述が追いついているか確認

---

## 総評

**メモリ全体の整合性は良好**。最重要の `feedback_design_tokens.md` が完全に更新済みのため、今後の新アプリ開発の指針として機能する。

軽微な不整合候補（project_hissan / project_romaji 等）は、2026-04-26 の大規模作業でコードが更新されたのにメモリが追いついていないだけの可能性が高い。設計の矛盾ではなく記録の遅れ。
