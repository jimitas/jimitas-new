# リファクタリング計画書
# 作成日: 2026-03-27

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

| # | ファイル | 内容 | 重大度 |
|---|---------|------|--------|
| 1-1 | `nanbanme/page.tsx` | `dataset.q1text` 未設定バグ修正（不正解後に問題文が消える） | 🔴 高 |
| 1-2 | `tashizan-1/page.tsx` | `parseInt(0)` チェックを `hikizan-1` と統一 + `alert()` → PutText パターンに置き換え | 🔴 高 |
| 1-3 | `hikizan-1/page.tsx` | `alert()` → PutText パターンに置き換え | 🟡 中 |
| 1-4 | `tasu-renshu/page.tsx` | `lightgray` / `antiquewhite` のハードコード色 → Tailwindトークンに統一 | 🟡 中 |
| 1-5 | `hiku-renshu/page.tsx` | 同上 | 🟡 中 |

**完了後 → 他チャットに「フェーズ1完了」と連絡する**

---

## フェーズ2 — 共通化（Fisher-Yates + 筆算DnD）

| # | 対象 | 内容 | 重大度 |
|---|------|------|--------|
| 2-1 | `src/lib/utils.ts` 新規作成 | ジェネリック `shuffled<T>()` を定義 | 🔴 高 |
| 2-2 | 5アプリ（`nanbanme`, `kuku-yomi`, `classroom-english`, `english-words`, `gakuten`） | 各 `shuffleArray` / `shuffled` を `utils.ts` からの import に統一 | 🔴 高 |
| 2-3 | `src/hooks/useHissanDnD.ts` 新規作成 | 筆算3アプリの `touchStartEvent` / `touchMoveEvent` を共通フックに抽出 | 🔴 高 |
| 2-4 | `tashi-hissan/page.tsx`・`hiki-hissan/page.tsx`・`kake-hissan-1/page.tsx` | `useHissanDnD` に切り替え | 🔴 高 |

---

## フェーズ3 — コード品質修正

| # | ファイル | 内容 | 重大度 |
|---|---------|------|--------|
| 3-1 | `suuzu-block/page.tsx` | コンポーネント名 `KazuBlockPage` → `SuuzuBlockPage` | 🟡 中 |
| 3-2 | `suuzu-block/page.tsx` | `prompt()` / `alert()` → 既存 `showToast` パターンに置き換え | 🟡 中 |
| 3-3 | `tashi-hissan/page.tsx`・`hiki-hissan/page.tsx` | `alert()` → PutText パターン、`window.pageYOffset` → `window.scrollY` | 🟡 中 |
| 3-4 | `useDragDrop.ts`・`okane/page.tsx` | `pageYOffset` / `pageXOffset` → `scrollY` / `scrollX` に統一 | 🟡 中 |
| 3-5 | `PutShiki.tsx` + `PutShiki.module.css` | CSSモジュール → Tailwindクラスに移行（CLAUDE.md違反解消） | 🔴 高 |
| 3-6 | `PutText.tsx` | 未使用 `text` prop を削除 | 🟢 低 |
| 3-7 | `src/data/apps.ts` | 未実装アプリに `disabled: true` フラグ追加 + ポータル側で非表示化 | 🟡 中 |
| 3-8 | `sangenshoku/page.tsx` | `applyRgbInput` / `applyCmyInput` の重複HEXパース処理をローカル関数に共通化 | 🟡 中 |

---

## フェーズ4 — パフォーマンス改善

| # | ファイル | 内容 | 重大度 |
|---|---------|------|--------|
| 4-1 | `gakuten/page.tsx` | `<img>` → `next/image`（音楽記号40種） | 🔴 高 |
| 4-2 | `tashi-hissan/page.tsx`・`hiki-hissan/page.tsx` | ゴミ箱画像 → `next/image` | 🔴 高 |
| 4-3 | `kake-hissan-1/page.tsx`・`okane/page.tsx` | 財布画像 → `next/image` | 🔴 高 |

---

## フェーズ5 — 技術的負債のコメント整備

| # | ファイル | 内容 | 重大度 |
|---|---------|------|--------|
| 5-1 | `lib/se.ts` | ミュート二重判定の意図をコメント明示 + SSR リスク注記 | 🟢 低 |
| 5-2 | `hooks/useCategoryAudio.ts` | 「呼び出し側は必ず `useMemo` で安定化」の注記を強化 | 🟢 低 |
| 5-3 | `hooks/useCoins.ts` | Supabase移行時の非同期対応に関するコメント追加 | 🟢 低 |

---

## 進捗チェックリスト

### フェーズ1
- [ ] 1-1 `nanbanme` バグ修正
- [ ] 1-2 `tashizan-1` parseInt修正 + alert置換
- [ ] 1-3 `hikizan-1` alert置換
- [ ] 1-4 `tasu-renshu` ハードコード色修正
- [ ] 1-5 `hiku-renshu` ハードコード色修正
- [ ] **他チャットへ完了連絡**

### フェーズ2
- [ ] 2-1 `src/lib/utils.ts` 作成
- [ ] 2-2 5アプリの `shuffled` を utils から import
- [ ] 2-3 `useHissanDnD.ts` 作成
- [ ] 2-4 筆算3アプリを `useHissanDnD` に切り替え

### フェーズ3
- [ ] 3-1 `suuzu-block` コンポーネント名修正
- [ ] 3-2 `suuzu-block` prompt/alert 置換
- [ ] 3-3 筆算アプリ alert置換 + pageYOffset修正
- [ ] 3-4 `useDragDrop` / `okane` pageYOffset修正
- [ ] 3-5 `PutShiki` CSSモジュール → Tailwind
- [ ] 3-6 `PutText` 未使用prop削除
- [ ] 3-7 `apps.ts` disabled フラグ追加
- [ ] 3-8 `sangenshoku` HEXパース共通化

### フェーズ4
- [ ] 4-1 `gakuten` img → next/image
- [ ] 4-2 `tashi-hissan`・`hiki-hissan` img → next/image
- [ ] 4-3 `kake-hissan-1`・`okane` img → next/image

### フェーズ5
- [ ] 5-1 `se.ts` コメント整備
- [ ] 5-2 `useCategoryAudio` コメント強化
- [ ] 5-3 `useCoins` Supabase移行コメント

---

## 参考：調査レポート全文

詳細な調査内容は会話ログを参照。調査対象ファイル数：全30アプリページ + 全コンポーネント・フック・lib・dataファイル（合計77ファイル精査）
