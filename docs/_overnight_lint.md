# ESLint 結果集約

**作成**: 2026-04-26（夜間自律タスク）
**実行コマンド**: `npm run lint`
**結果概要**: ✖ 9 problems (5 errors, 4 warnings)

---

## エラー一覧（5件）

### E1: `react-hooks/set-state-in-effect` — eawase/page.tsx:43

```
src/app/(apps)/eawase/page.tsx:43:5
setCardOrder(shuffle())  ← useEffect 内で直接 setState
```

**影響**: SSR/CSR ハイドレーション目的（SSR 結果とCSR 結果を一致させるため）
**修正方針**: `useState(() => shuffle())` の遅延初期化パターンに変更する
```tsx
// Before
const [cardOrder, setCardOrder] = useState(...)
useEffect(() => { setCardOrder(shuffle()) }, [])

// After
const [cardOrder, setCardOrder] = useState(() => shuffle())
```
**優先度**: 中（動作に問題はないが eslint-plugin-react-hooks が警告する正当なケース）

---

### E2 / E3: `prefer-const` — jimipri/_lib/problems/bunsu2.ts:30-31

```
'b' is never reassigned. Use 'const' instead
'c' is never reassigned. Use 'const' instead
```

**修正方針**: `let b` / `let c` を `const b` / `const c` に変更するだけ
**優先度**: 低（1行修正、副作用ゼロ）

---

### E4: `react-hooks/set-state-in-effect` — components/common/FontToggle.tsx:34

```
src/components/common/FontToggle.tsx:34:7
setFont("gothic")  ← useEffect 内で直接 setState（localStorage 読み込み目的）
```

**影響**: 全ページで使われる共通コンポーネント。font 状態を localStorage から復元するための初期化。
**修正方針**: `useState` の遅延初期化で useEffect を不要にする
```tsx
// Before
const [font, setFont] = useState<"maru" | "gothic">("maru")
useEffect(() => {
  const saved = localStorage.getItem("jimitas_font")
  if (saved === "gothic") {
    setFont("gothic")
    document.body.style.fontFamily = ...
  } else {
    document.body.style.fontFamily = ...
  }
}, [])

// After（案）
const [font, setFont] = useState<"maru" | "gothic">(() => {
  if (typeof window === "undefined") return "maru"
  return localStorage.getItem("jimitas_font") === "gothic" ? "gothic" : "maru"
})
useEffect(() => {
  document.body.style.fontFamily = FONT_VALUES[font]
}, [font])
```
**注意**: SSR 対応のため `typeof window === "undefined"` ガードが必要
**優先度**: 中（全ページ共通 → 修正リスクあり。翌朝確認 ToDo）

---

### E5: `react-hooks/set-state-in-effect` — hooks/useCoins.ts:44

```
src/hooks/useCoins.ts:44:5
setCoins(readCoins())  ← useEffect 内で直接 setState（localStorage + storage イベント）
```

**影響**: 全アプリのコインシステム。最重要共通フック。
**修正方針**:
```tsx
// Before
const [coins, setCoins] = useState(0)
useEffect(() => {
  setCoins(readCoins())
  const handleCoinsChanged = () => setCoins(readCoins())
  ...
}, [])

// After（案）
const [coins, setCoins] = useState(() => {
  if (typeof window === "undefined") return 0
  return readCoins()
})
useEffect(() => {
  const handleCoinsChanged = () => setCoins(readCoins())
  ...
  // storage イベントリスナーのみここに残す
}, [])
```
**優先度**: 高（useCoins は全アプリで使用。ただし修正で動作変化が起きる可能性あり → 翌朝確認 ToDo）

---

## 警告一覧（4件）

### W1: Unused eslint-disable — fushi-dukuri/page.tsx:212

```
Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')
```

**修正方針**: `// eslint-disable-next-line react-hooks/exhaustive-deps` コメントを削除するだけ
**優先度**: 低

---

### W2: `@typescript-eslint/no-unused-vars` — jimipri/_lib/problems/bunsuKiso.ts:6

```
'reduceFraction' is defined but never used
```

**修正方針**: 関数を削除、または将来使う予定があればアンダースコア付き `_reduceFraction` に変更
**判定**: bunsuKiso.ts は分数計算のライブラリ。`reduceFraction` は約分関数で、汎用的に見える。削除前に利用箇所を Grep で確認推奨
**優先度**: 低

---

### W3: `@typescript-eslint/no-unused-vars` — warizan/page.tsx:14

```
'useCallback' is defined but never used
```

**修正方針**: import 文から `useCallback` を削除するだけ
**優先度**: 低（1行修正）

---

### W4: `@typescript-eslint/no-unused-vars` — layout.tsx:54

```
'themeInitScript' is assigned a value but never used
```

**修正方針**: layout.tsx を確認して `themeInitScript` 変数を削除、または `script` タグ注入を復活させるか判断が必要
**優先度**: 中（`layout.tsx` は全ページのルート → 修正の意図確認が必要。翌朝確認 ToDo）

---

## 修正優先マトリクス

| # | ファイル | ルール | 優先度 | 難易度 | 副作用リスク |
|---|---|---|---|---|---|
| E5 | `hooks/useCoins.ts` | set-state-in-effect | 高 | 中 | 高（全アプリ共通） |
| E4 | `components/common/FontToggle.tsx` | set-state-in-effect | 中 | 中 | 中（全ページ共通） |
| E1 | `eawase/page.tsx` | set-state-in-effect | 中 | 低 | 低（アプリ単体） |
| E2/E3 | `jimipri/bunsu2.ts` | prefer-const | 低 | 低 | なし |
| W1 | `fushi-dukuri/page.tsx` | eslint-disable 削除 | 低 | 低 | なし |
| W3 | `warizan/page.tsx` | unused import | 低 | 低 | なし |
| W4 | `layout.tsx` | unused var | 中 | 要調査 | 中（全ページ） |
| W2 | `jimipri/bunsuKiso.ts` | unused vars | 低 | 要調査 | 低 |

## 翌朝確認 ToDo

- [ ] `useCoins.ts` の `useState` 遅延初期化パターンへの移行（コインが全アプリに影響するため慎重に）
- [ ] `FontToggle.tsx` の SSR 対応遅延初期化（hydration mismatch に注意）
- [ ] `layout.tsx:54` の `themeInitScript` — 削除可能か、それとも復活すべき機能か確認
- [ ] `jimipri/_lib/problems/bunsuKiso.ts` の `reduceFraction` — 削除 or `_` プレフィックスの判断
