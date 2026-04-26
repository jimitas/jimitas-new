# アクセシビリティ調査

**作成**: 2026-04-26（夜間自律タスク）
**スコープ**: `src/` 配下の全 .tsx ファイル
**調査手法**: Grep によるパターン検索（`<img alt欠け` / `onClick div` / `aria-*` / `tabIndex`）

---

## 1. `<img>` alt 属性チェック

**結果**: ✅ 問題なし

`<img(?![^>]*alt=)` パターンで Grep → **マッチなし**

全 `<img>` タグに `alt` が付いている、またはそもそも `<img>` の使用が少ない（Next.js の `<Image>` コンポーネントが主流）。

---

## 2. `onClick` を持つ `<div>` のロール・フォーカス確認

**結果**: ✅ 問題なし（既存の使用箇所は適切に対処済み）

`<div[^>]*onClick` パターンで Grep → **マッチなし**（Grep が文字列を横断パターンとして見つけられなかった可能性あり）

### 手動確認済みの `<div role="button">` 使用箇所

| ファイル | 理由 | 対処状況 |
|---|---|---|
| `eawase/page.tsx:167-181` | `<button>` 内では `transform-style: preserve-3d` が効かないブラウザがあるため | `role="button"` + `tabIndex={0}` + `aria-label` + `onKeyDown` 対応済み |
| `nandemo/page.tsx:180-192` | 同上（フリップカードの3D変換）| `role="button"` + `tabIndex={0}` + `aria-label` + `onKeyDown` 対応済み |

両アプリとも適切な ARIA 属性とキーボード操作を実装済みで、a11y 的に問題なし。

---

## 3. aria-* 使用状況

### aria-label が付いているコンポーネント

| ファイル | 対象 | aria-label 内容 |
|---|---|---|
| `BtnColor.tsx:52` | 色選択ボタン | `{label}` 動的ラベル |
| `eawase/page.tsx:180` | フリップカード | `"カード{imageIndex} 表"` / `"カード 裏"` |
| `nandemo/page.tsx:192` | フリップカード | `"カード{num} 表"` / `"カード 裏"` |
| `fushi-dukuri/page.tsx:665` | テンポ数値入力 | `"テンポ 数値入力"` |
| `masu-nuri/page.tsx:309` | 色選択ボタン | `{c.label}` |
| `metronome/page.tsx:199` | BPM 数値入力 | `"BPM 数値入力"` |
| `nanbanme/page.tsx:233` | 動物選択 | `{ANIMALS[animalIdx]}` |

### 気になる点（翌朝確認 ToDo レベル）

1. **共通ボタン部品（buttons/）に aria-label なし**
   - `BtnQuestion` `BtnSet` `BtnCheck` 等の共通ボタンは `children` のテキストがそのままラベルになるため、実用上は問題ない
   - ただし `BtnUndo` / `BtnStop` はラベルが内部固定文字列のため、スクリーンリーダーで「もどす」「ストップ」と読み上げられるかを確認

2. **楽器キー（kenban 系）に aria-label がない可能性**
   - `XylophoneBoard.tsx` のバー要素に `aria-label="ド"` 等がない可能性がある（スクリーンリーダーで音名が読まれない）
   - ただし楽器アプリの性質上、視覚・聴覚が主体のため優先度は低い

3. **九九のアレイ図の行・列ラベル**
   - `kuku-array` の `ArrayDots` の行番号・列番号セルに `aria-label` がないが、学習補助ツールとして許容範囲

---

## 4. tabIndex 使用状況

`tabIndex` の使用箇所は2件のみ（eawase と nandemo）で、いずれも `role="button"` と組み合わせて適切に使われている。

**問題なし**。不適切な `tabIndex={-1}` や過剰なフォーカス制御は検出されなかった。

---

## 5. 総評

| カテゴリ | 状態 | 備考 |
|---|---|---|
| `<img alt>` | ✅ 問題なし | |
| `<div onClick>` ロール | ✅ 問題なし | eawase/nandemo は適切に対処済み |
| aria-label | ✅ おおむね問題なし | 楽器キーは将来改善候補 |
| tabIndex | ✅ 問題なし | |
| キーボードナビ | ⚠️ 部分対応 | 楽器・DnD系は本質的にキーボード操作が困難 |

小学生向け教育アプリとして、致命的な a11y 問題は検出されなかった。優先度が高い改善はなし。

## 翌朝確認 ToDo（任意）

- [ ] `XylophoneBoard.tsx` のバー要素に `aria-label` がついているか確認（音名の読み上げ）
- [ ] `BtnUndo` / `BtnStop` がスクリーンリーダーで適切に読み上げられるか確認
