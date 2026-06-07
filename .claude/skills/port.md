---
name: port
description: jimitas-old の旧アプリ（HTML/JS/PHP）を Next.js に移植するためのチェックリストと変換ガイド。「○○を移植して」「jimitas-old から移植」「旧アプリを移植」と言われたときに起動する。
user_invocable: true
---

# /port — jimitas-old から Next.js への移植支援

`jimitas-old/` にある旧アプリを jimitas-new（Next.js）に移植するスキルです。

---

## 前提：移植候補リスト

`project_unported_apps_todo.md` に将来候補がまとめてあります：
- **優先候補：** numberLine / binary / amari / kazu
- **お蔵入り：** sound-pad / taiwa（移植不要と判断済み）

---

## 手順

### 1. 移植元ファイルの確認

ユーザーに移植元のパスを確認する：

```
jimitas-old のアプリパスを教えてください。
例: ../jimitas-old/apps/number-line/index.html
```

指定されたファイルを Read して以下を把握する：
- DOM 構造（div 階層・id/class 命名）
- 使用しているライブラリ（jQuery か？ 独自 JS か？）
- 状態管理の方法（グローバル変数 or オブジェクト？）
- 効果音・音源ファイルの使用有無
- 印刷機能の有無
- localStorage の使用有無

---

### 2. 移植チェックリスト

把握した内容に対してチェックリストを提示する：

#### ブラウザ API → React 代替

| 旧コード | 移植後 |
|----------|--------|
| `confirm()` / `alert()` / `prompt()` | UI モーダル or インライン表示に変更（禁止） |
| `document.getElementById()` | `useRef` |
| グローバル変数 | `useState` / `useRef` |
| `addEventListener` | JSX イベントハンドラー（`onClick` 等） |

#### jQuery → React

| jQuery | React |
|--------|-------|
| `$('#id').text('...')` | `useRef` + `ref.current.textContent` or `useState` |
| `$('.cls').addClass('active')` | `useState` で className を切り替え |
| `$.ajax()` | `fetch()` or `useEffect` |
| `$(document).ready()` | `useEffect(()=>{...}, [])` |

#### 効果音

| 旧コード | 移植後 |
|----------|--------|
| `new Audio('/se/pi.mp3').play()` | `import * as se from "@/lib/se"` → `se.playSe(se.pi)` |
| 独自音源 | `/public/se/` に配置して `se.ts` に追加 |

#### localStorage

| 用途 | 移植後 |
|------|--------|
| コイン保存 | `useCoins()` フック（既存） |
| 正誤履歴 | `useAnswerCheck()` フック（新アプリ推奨） |
| その他設定 | `useState` + `localStorage` 直接（シンプルな場合） |

#### 印刷機能

印刷が必要な場合は `feedback_print_fixed_pattern.md` の正解パターンを使う：
- `position: fixed` + `@page` を静的 CSS で指定
- JSX の `style` タグに埋め込む方法

---

### 3. 移植後の雛形作成

チェックリストを確認したら、`/new-app` スキルを呼び出して雛形ファイルを作成する。

必要な情報：
- id: 旧アプリのURL or 日本語名から命名
- title / description / grades / subjects

---

### 4. 実装方針の提示

旧コードの分析結果をもとに、移植の難易度と方針を提示する：

```
## 移植方針

**難易度：** 低 / 中 / 高

**主な変換作業：**
- [ ] jQuery → useRef/useState（約 XX 箇所）
- [ ] confirm() → インライン確認（約 XX 箇所）
- [ ] 効果音 → se.playSe（約 XX 箇所）
- [ ] 印刷対応：必要 / 不要

**再利用できる既存部品：**
- BtnQuestion（「もんだい」ボタン）
- BtnNum（数字ボタン）
- PutText（テキスト表示エリア）
- CoinDisplay（コイン表示）
- BlockArea（数図ブロック）
- ... など

移植を開始しますか？
```

---

## 移植後の確認

移植完了後に以下を実行：
1. `npm test` — ユニットテストが通るか
2. ブラウザで動作確認（`npm run dev`）
3. `/seoaio` で SEO 設定を確認
4. `/ship` でコミット・push
