# 未使用 import / 変数 調査

**作成**: 2026-04-26（夜間自律タスク）
**スコープ**: ESLint `@typescript-eslint/no-unused-vars` の警告整理 + 安全削除判定

---

## 検出された未使用変数（ESLint 結果から）

### 1. `jimipri/_lib/problems/bunsuKiso.ts:6` — `reduceFraction`

```ts
// line 6
function reduceFraction(...) { ... }  // ← defined but never used
```

**内容**: 分数の約分関数
**使用箇所調査**: `bunsuKiso.ts` 内でのみ定義、他ファイルから import されていないと推測
**削除の安全性**: ⚠️ 要確認
- 分数計算ライブラリの将来実装のために意図的に置かれた可能性がある
- 削除前に `bunsuKiso.ts` の全体コンテキストを確認する
**推奨対処**:
  - 将来使う予定なし → 削除
  - 将来使う予定あり → `_reduceFraction` とアンダースコアプレフィックス化（ESLint に「意図的な未使用」を伝える）

---

### 2. `warizan/page.tsx:14` — `useCallback`

```ts
import { ..., useCallback, ... } from "react"  // ← useCallback が不要
```

**内容**: React の `useCallback` フック
**削除の安全性**: ✅ 安全に削除可能
- import 文から `useCallback` を外すだけ
- 2026-04-26 の配色リファクタリング中にリファクタリングの副産物として残ってしまった可能性が高い
**推奨対処**: `import` の `useCallback` を削除

---

### 3. `layout.tsx:54` — `themeInitScript`

```ts
// line 54
const themeInitScript = `...`  // ← assigned but never used
```

**内容**: テーマ初期化スクリプト（ダークモード等の初期化用と推測）
**削除の安全性**: ⚠️ 要確認
- `layout.tsx` はルートレイアウト → 影響範囲が全ページ
- `themeInitScript` が以前は `<script>` タグに埋め込まれていた可能性
- 削除する場合は、ダークモード初期化の動作に問題がないか確認が必要
**推奨対処**: 翌朝確認後、不要であれば削除

---

## 注意: set-state-in-effect 系のエラーは「未使用」ではない

ESLint の `react-hooks/set-state-in-effect` エラー（useCoins.ts / FontToggle.tsx / eawase/page.tsx）は未使用変数ではなく、別のカテゴリ（パターンの問題）。`_overnight_lint.md` に詳細記載。

---

## 削除難易度マトリクス

| 変数 | ファイル | 削除難易度 | 副作用リスク | 推奨アクション |
|---|---|---|---|---|
| `useCallback` import | `warizan/page.tsx` | ★☆☆ 簡単 | なし | すぐ削除 |
| `reduceFraction` 関数 | `jimipri/bunsuKiso.ts` | ★★☆ 要調査 | 低い | 内容確認後に削除 or _ プレフィックス |
| `themeInitScript` 変数 | `layout.tsx` | ★★★ 慎重に | 中（全ページ） | 翌朝確認後に判断 |

---

## 翌朝確認 ToDo

- [ ] `warizan/page.tsx` から `useCallback` import を削除（安全・即実施可）
- [ ] `jimipri/_lib/problems/bunsuKiso.ts` の `reduceFraction` — 用途確認後に削除 or `_` プレフィックス
- [ ] `layout.tsx:54` の `themeInitScript` — 削除しても Dark Mode 初期化が正常動作するか確認
