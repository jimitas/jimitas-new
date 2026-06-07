---
name: se-audit
description: 全アプリの効果音・カーソル実装を監査し、ルール違反を検出・報告する。「効果音を確認」「SE チェック」「カーソルを確認」と言われたときに起動する。
user_invocable: true
---

# /se-audit — 効果音・カーソル統一監査

全アプリの効果音（SE）とカーソル実装を一括チェックするスキルです。
「手書きしない」ルールの違反を自動検出します。

---

## ルールの前提

### 効果音ルール（feedback_sound_mute_pattern.md より）

| 用途 | 正しい方法 | 禁止 |
|------|-----------|------|
| 効果音再生 | `se.playSe(se.pi)` / `se.playSe(se.set)` など | `new Audio(...)` の直接使用 |
| ミュート連携 | `@/lib/se` 経由で自動対応済み | `Howler.mute()` の直接呼び出し |
| 効果音ファイル | `/se/` 以下の共通音源を使う | 独自音源ファイルのインライン埋め込み |

### カーソルルール（feedback_cursor_and_se_consistency.md より）

| 用途 | 正しい方法 | 禁止 |
|------|-----------|------|
| クリック可能要素 | Tailwind の `cursor-pointer` クラス or ボタン部品 | `style={{ cursor: "pointer" }}` のインライン書き |

---

## 検査手順

### 1. 禁止パターンを Grep で検出

以下を `src/app/(apps)/` 以下に対して実行：

```
# new Audio( の直接使用
pattern: new Audio\(

# style でのカーソル指定
pattern: cursor.*pointer.*style|style.*cursor.*pointer

# Howler の直接インポート（se.ts 以外の場所）
pattern: from ['"]howler['"]
glob: src/app/**/*.tsx
```

### 2. useSound の import 確認

`useSound` を使っているファイルは `@/hooks/useSound` からのインポートを確認：

```
pattern: useSound
glob: src/app/**/*.tsx
```

見つかったファイルで `import.*useSound` が `@/hooks/useSound` を参照しているか確認。

### 3. 効果音未実装アプリの検出（オプション）

ユーザーから「効果音が入っているか確認したい」と言われた場合のみ実施：

```
# se のインポートがないアプリを探す
src/app/(apps)/ 以下で import.*se を持たない page.tsx を列挙
```

---

## 結果の報告

違反が見つかった場合：

```
## se-audit 結果

### ❌ 違反あり

| ファイル | 違反内容 | 修正方法 |
|----------|---------|---------|
| src/app/(apps)/xxx/page.tsx | `new Audio(...)` の直接使用 | `se.playSe()` に置き換え |
| src/app/(apps)/yyy/page.tsx | `style={{ cursor: "pointer" }}` | Tailwind `cursor-pointer` クラスに変更 |

修正しますか？
```

違反がない場合：

```
## se-audit 結果

✅ 全アプリで効果音・カーソルのルール違反はありませんでした。
```

---

## よくある修正パターン

### `new Audio()` → `se.playSe()`

```tsx
// Before（禁止）
const audio = new Audio("/se/pi.mp3")
audio.play()

// After
import * as se from "@/lib/se"
se.playSe(se.pi)
```

### インライン cursor → Tailwind クラス

```tsx
// Before（禁止）
<button style={{ cursor: "pointer" }}>

// After
<button className="cursor-pointer">
```
