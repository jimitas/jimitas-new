# リファクタリング計画書
# 作成日: 2026-03-27
# 完了日: 2026-03-27

## 背景

アプリ数が30本以上に増えたため、以下の観点で包括的なリファクタリングを実施する。

- 共通化できるロジック・UIパターンの整理
- コード品質（型安全性・命名一貫性・デッドコード除去）
- パフォーマンス（画像最適化・不要な再レンダリング防止）
- 潜在的バグ・技術的負債の解消

---

## 競合管理（他チャットとの分担）

### このチャット（リファクタリング担当）が触らないファイル

| ファイル | 理由 |
|---------|------|
| `src/components/parts/buttons/NumPad.tsx` | 他チャットが新規追加 |
| `src/hooks/useKeyboardInput.ts` | 他チャットが新規追加 |
| `src/app/(apps)/shishagonyu/page.tsx` | 他チャットが作業中 |

### フェーズ1完了後に他チャットへ連絡が必要なファイル

フェーズ1完了 → 他チャットに連絡 → 他チャットが `useKeyboardInput` を追加

| ファイル |
|---------|
| `tashizan-1/page.tsx` |
| `hikizan-1/page.tsx` |
| `tasu-renshu/page.tsx` |
| `hiku-renshu/page.tsx` |

---

## フェーズ1 — バグ修正 + 優先4ファイル（最優先）

> 他チャットの `useKeyboardInput` 追加作業を待たせているため、最初に完了する。

| # | ファイル | 内容 | 重大度 | 状態 |
|---|---------|------|--------|------|
| 1-1 | `nanbanme/page.tsx` | `dataset.q1text` 未設定バグ修正（不正解後に問題文が消える） | 🔴 高 | ✅ 完了 |
| 1-2 | `tashizan-1/page.tsx` | `parseInt(0)` チェックを `hikizan-1` と統一 + `alert()` → PutText パターンに置き換え | 🔴 高 | ✅ 完了 |
| 1-3 | `hikizan-1/page.tsx` | `alert()` → PutText パターンに置き換え | 🟡 中 | ✅ 完了 |
| 1-4 | `tasu-renshu/page.tsx` | `lightgray` / `antiquewhite` のハードコード色 → Tailwindトークンに統一 | 🟡 中 | ✅ 完了 |
| 1-5 | `hiku-renshu/page.tsx` | 同上 | 🟡 中 | ✅ 完了 |

**完了後 → 他チャットに「フェーズ1完了」と連絡する** ✅ 連絡済み

### フェーズ1 補足メモ

- **nanbanme バグ**: `giveQuestion1` が `innerHTML` を書いた直後に `dataset.q1text` への保存を忘れていた。`checkAnswer1` が `dataset.q1text ?? ""` で復元しようとしていたため、不正解後に問題文が空欄になっていた。1行の追加で修正。
- **tashizan-1 parseInt(0)**: `if (myAnswer)` は `0` が falsy のため、答えが0のとき回答不能になっていた。`if (val !== "" && !isNaN(myAnswer))` に修正。

---

## フェーズ2 — 共通化（Fisher-Yates + 筆算DnD）

| # | 対象 | 内容 | 重大度 | 状態 |
|---|------|------|--------|------|
| 2-1 | `src/lib/utils.ts` 新規作成 | ジェネリック `shuffled<T>()` を定義 | 🔴 高 | ✅ 完了 |
| 2-2 | 5アプリ（`nanbanme`, `kuku-yomi`, `classroom-english`, `english-words`, `gakuten`） | 各 `shuffleArray` / `shuffled` を `utils.ts` からの import に統一 | 🔴 高 | ✅ 完了 |
| 2-3 | `src/hooks/useHissanDnD.ts` 新規作成 | 筆算3アプリの `touchStartEvent` / `touchMoveEvent` を共通フックに抽出 | 🔴 高 | ✅ 完了 |
| 2-4 | `tashi-hissan/page.tsx`・`hiki-hissan/page.tsx`・`kake-hissan-1/page.tsx` | `useHissanDnD` に切り替え | 🔴 高 | ✅ 完了 |

### フェーズ2 補足メモ

- `gakuten` の `createShuffledOrder(n: number)` は「件数」を受け取っていたため、そのままでは `shuffled<T>(arr)` と直接置換できなかった。ローカルラッパー `(n: number) => shuffled(Array.from({length: n}, (_, i) => i))` を1行挟んで対応。
- `useHissanDnD` の設計: パレット消去はフック内で行い、アプリ固有の後処理は `onDropDigit(elem, target)` コールバックとして外出しすることで、各アプリの差異（`numSet`, `kotaeInput`, `resizeDroppedNumber`等）に対応した。

---

## フェーズ3 — コード品質修正

| # | ファイル | 内容 | 重大度 | 状態 |
|---|---------|------|--------|------|
| 3-1 | `suuzu-block/page.tsx` | コンポーネント名 `KazuBlockPage` → `SuuzuBlockPage` | 🟡 中 | ✅ 完了 |
| 3-2 | `suuzu-block/page.tsx` | `prompt()` / `alert()` → 既存 `el_text` パターンに置き換え | 🟡 中 | ✅ 完了 |
| 3-3 | `tashi-hissan/page.tsx`・`hiki-hissan/page.tsx` | `alert()` → msgRef パターン、`window.pageYOffset` → `window.scrollY` | 🟡 中 | ✅ 完了 |
| 3-4 | `useDragDrop.ts`・`okane/page.tsx` | `pageYOffset` / `pageXOffset` → `scrollY` / `scrollX` に統一 | 🟡 中 | ✅ 完了 |
| 3-5 | `PutShiki.tsx` + `PutShiki.module.css` | CSSモジュール → Tailwindクラスに移行（CLAUDE.md違反解消） | 🔴 高 | ✅ 完了（CSSモジュール削除） |
| 3-6 | `PutText.tsx` | 未使用 `text` prop を削除 | 🟢 低 | ✅ 完了 |
| 3-7 | `src/data/apps.ts` | 未実装アプリに `disabled: true` フラグ追加 + ポータル側で非表示化 | 🟡 中 | ✅ 完了（17アプリに適用） |
| 3-8 | `sangenshoku/page.tsx` | `applyRgbInput` / `applyCmyInput` の重複HEXパース処理をローカル関数に共通化 | 🟡 中 | ✅ 完了 |

### フェーズ3 補足メモ

- `PutShiki.module.css` は削除。`max()` CSS関数は Tailwind の任意値 `h-[max(3vw,30px)]` で表現できた。
- `disabled` フラグ: `AppItem` 型に `disabled?: boolean` を追加し、`page.tsx` のフィルタで除外。17アプリが対象（未実装ページへのリンクを消す）。
- `tashi-hissan` / `hiki-hissan` の `alert()` 置換: `el_text` ref はすでに用途が決まっているため、別途 `msgRef` を追加して分離した。

---

## フェーズ4 — パフォーマンス改善

| # | ファイル | 内容 | 重大度 | 状態 |
|---|---------|------|--------|------|
| 4-1 | `gakuten/page.tsx` | `<img>` → `next/image`（音楽記号フラッシュカード・クイズボタン） | 🔴 高 | ✅ 完了 |
| 4-2 | `tashi-hissan/page.tsx`・`hiki-hissan/page.tsx` | ゴミ箱画像 → `next/image` | 🔴 高 | ✅ 完了 |
| 4-3 | `kake-hissan-1/page.tsx`・`okane/page.tsx` | ゴミ箱・コイン画像 → `next/image` | 🔴 高 | ✅ 完了 |

### フェーズ4 補足メモ

- `okane` のコイン画像は `coin.isBill` で `width/height` が分岐していた。`next/image` は `width`/`height` を props で受け取るため、三項演算子 `width={coin.isBill ? 60 : 36}` で対応。
- `kake-hissan-1` のゴミ箱: style で `position: relative / left / top` を指定していたため、`width`/`height` は props に移し、残りを `style={}` に残す形で対応。

---

## フェーズ5 — 技術的負債のコメント整備

| # | ファイル | 内容 | 重大度 | 状態 |
|---|---------|------|--------|------|
| 5-1 | `lib/se.ts` | ミュート二重判定の意図をコメント明示 + SSR リスク注記 | 🟢 低 | ✅ 完了 |
| 5-2 | `hooks/useCategoryAudio.ts` | 「呼び出し側は必ず `useMemo` で安定化」の注記を強化 | 🟢 低 | ✅ 完了 |
| 5-3 | `hooks/useCoins.ts` | Supabase移行時の非同期対応に関するコメント追加 | 🟢 低 | ✅ 完了 |

---

## 進捗チェックリスト

### フェーズ1
- [x] 1-1 `nanbanme` バグ修正
- [x] 1-2 `tashizan-1` parseInt修正 + alert置換
- [x] 1-3 `hikizan-1` alert置換
- [x] 1-4 `tasu-renshu` ハードコード色修正
- [x] 1-5 `hiku-renshu` ハードコード色修正
- [x] **他チャットへ完了連絡**

### フェーズ2
- [x] 2-1 `src/lib/utils.ts` 作成
- [x] 2-2 5アプリの `shuffled` を utils から import
- [x] 2-3 `useHissanDnD.ts` 作成
- [x] 2-4 筆算3アプリを `useHissanDnD` に切り替え

### フェーズ3
- [x] 3-1 `suuzu-block` コンポーネント名修正
- [x] 3-2 `suuzu-block` alert 置換
- [x] 3-3 筆算アプリ alert置換 + pageYOffset修正
- [x] 3-4 `useDragDrop` / `okane` pageYOffset修正
- [x] 3-5 `PutShiki` CSSモジュール → Tailwind（モジュールファイル削除）
- [x] 3-6 `PutText` 未使用prop削除
- [x] 3-7 `apps.ts` disabled フラグ追加（17アプリ）
- [x] 3-8 `sangenshoku` HEXパース共通化

### フェーズ4
- [x] 4-1 `gakuten` img → next/image
- [x] 4-2 `tashi-hissan`・`hiki-hissan` img → next/image
- [x] 4-3 `kake-hissan-1`・`okane` img → next/image

### フェーズ5
- [x] 5-1 `se.ts` コメント整備
- [x] 5-2 `useCategoryAudio` コメント強化
- [x] 5-3 `useCoins` Supabase移行コメント

---

## 作成された新規ファイル

| ファイル | 内容 |
|---------|------|
| `src/lib/utils.ts` | Fisher-Yates シャッフル `shuffled<T>()` |
| `src/hooks/useHissanDnD.ts` | 筆算3アプリ共通のタッチDnDフック |

## 削除されたファイル

| ファイル | 理由 |
|---------|------|
| `src/components/parts/displays/PutShiki.module.css` | Tailwind に完全移行 |

---

## コミット履歴

| コミット | 内容 |
|---------|------|
| `826fda2` | Phase 1: バグ修正・優先4ファイル対応（5ファイル） |
| `60038f2` | Phase 2: 共通化 shuffled / useHissanDnD（10ファイル・2新規） |
| `5d5d7d6` | Phase 3: コード品質修正（11ファイル・1削除） |
| `2e94967` | Phase 4+5: next/image移行・技術的負債コメント追加（12ファイル） |
| `a947d2e` | feat: おかねのけいさん NumPad + useKeyboardInput 追加（リファクタリング後・別チャット） |
| `a6b9e7e` | feat: NumPad 効果音追加（リファクタリング後・別チャット） |
| （次のコミット） | 第2回レビュー：confirm/prompt除去・makeChoices共通化 |

---

## 第2回レビュー（2026-03-27）

### 背景
リファクタリング翌日に別視点から再レビューを実施。競合チェック・技術的負債・パフォーマンス・再利用性を調査。

### 調査結果

| 項目 | 結果 |
|------|------|
| マージコンフリクトマーカー | **なし**（並行作業の競合なし） |
| pageYOffset/pageXOffset 残存 | **なし**（移行完了） |
| shuffled 統一漏れ | **なし** |
| TypeScript `any` 型 | **なし** |
| セキュリティ（XSS等） | **問題なし**（innerHTML に外部入力は流れていない） |

### 実施した追加作業

#### 作業1: confirm() / prompt() の除去
- `gakuten/page.tsx`: `confirm("シャッフルしますか？")` を2箇所削除（ボタン明示のため不要）
- `suuzu-block/page.tsx`: `prompt()` をインラインモーダルに置き換え（`resetChallenge` state + JSX）

#### 作業2: makeChoices を utils.ts に共通化
- `src/lib/utils.ts` に `makeChoices<T>(correct, pool, isSame)` を追加（ジェネリック設計）
- `english-words/page.tsx`・`classroom-english/page.tsx` のローカル関数を削除し import に統一

### 見送った作業（リスク高）

#### 作業3: useAnswerCheck の全アプリ展開
- 対象8本以上・各アプリのロジック差異が大きい・フック拡張のリスクが高い
- **方針：新アプリを作るときに最初から useAnswerCheck を使う**

---

## 参考：調査レポート全文

詳細な調査内容は会話ログを参照。調査対象ファイル数：全30アプリページ + 全コンポーネント・フック・lib・dataファイル（合計77ファイル精査）
