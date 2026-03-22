# ハンドオーバー（2026-03-22 後半）

新しい会話を始めるときに最初に読んでください。

---

## 直前の作業内容

### 1. トップ画面メニュー整理（1〜3年生）

`src/data/apps.ts` と `src/app/page.tsx` を変更。

- タイトル修正：たしざん１→たしざん、ひきざん１→ひきざん、たしざんの練習→たしざんのれんしゅう、ひきざんの練習→ひきざんのれんしゅう
- 削除：`kuku`（九九のれんしゅう）、`kake-hissan`（旧版）
- grades 修正：各アプリの対象学年を整理（とけいは1〜2年のみ、けんばんハーモニカは1・2・4〜6年、Classroom English は全学年など）
- `page.tsx` に `order[]` フィールドを追加し、1〜3年生セクションのカード表示順を明示指定
- 1年生のセクションタイトルを「１ねんせい」に変更

**4〜6年生のメニュー整理はまだ。次の作業候補。**

---

### 2. 音楽記号を覚えよう（gakuten）移植・完成

`src/app/(apps)/gakuten/page.tsx` を新規作成。旧版 HTML/CSS/JS から移植済み。

**機能：**
- フラッシュカードモード（背景：ペールグリーン `bg-brand-50`）
- クイズモード（背景：ペールブルー `bg-accent-50`）
- クイズにコイン機能（`useProblemCoins`・最大40コイン）

**詳細設計は** `memory/project_gakuten.md` を参照。

---

## 現在のファイル構成（主要部分）

```
src/app/(apps)/
├── gakuten/page.tsx          ← 音楽記号（完成）
├── tashi-hissan/page.tsx     ← たし算ひっ算（完成）
├── hiki-hissan/page.tsx      ← ひき算ひっ算（完成）
└── kake-hissan-1/page.tsx    ← かけ算ひっ算①（完成）

src/data/apps.ts              ← 1〜3年生のメニュー整理済み
src/app/page.tsx              ← order[] による表示順制御を実装済み

public/images/gakuten/        ← 音楽記号画像40枚
```

---

## git 状態（2026-03-22 時点）

未コミットファイルなし。全作業コミット済み。

最新コミット：
```
b4ace46 fix(gakuten): コイン表示をクイズ画面の下部に移動
9f24f26 feat(gakuten): クイズモードにコイン機能を追加
674943a fix(gakuten): 名前・意味テーブルの罫線を太く・濃く
9c78d82 fix(gakuten): クイズUIの細かい調整
70d58a5 feat(gakuten): 音楽記号を覚えようを移植
b34c255 refactor(menu): トップ画面のメニュー整理（1〜3年生）
2372f47 feat(hissan): ひっ算2本にヒント表示・せいかい！演出を追加
```

**git push はまだ。次の会話の最初に確認する。**

---

## 次にやること（候補）

### 優先度 高
- **git push & Vercel デプロイ確認**
  最近の作業分をまとめて push する。

- **4〜6年生のメニュー整理**
  `src/data/apps.ts` の grades と `src/app/page.tsx` の order を追記。
  1〜3年生と同じ手順で進める。

### 優先度 中
- **kake-hissan-2（かけ算の筆算②）の移植**
  旧ファイル：`jimitas-old/motto/16kah2.js`
  難易度：高（小数対応あり）
  `kake-hissan-1` の実装を参考に設計する。

- **warizan（わり算の考え方①②）の移植**
  旧ファイル：`jimitas-old/motto/17war1.js`, `17war2.js`

- **wari-hissan（わり算の筆算）の移植**
  旧ファイル：`jimitas-old/motto/18warih.js`
  難易度：高（6段階難易度・D&D）

### 優先度 低
- じみぷり（算数プリント自動生成）の移植
- カタカナ・ローマ字練習の移植

---

## メモリへのポインタ

| ファイル | 内容 |
|---|---|
| `memory/project_gakuten.md` | gakuten の全アーキテクチャ詳細 |
| `memory/project_hissan.md` | 筆算3本の全アーキテクチャ詳細 |
| `memory/feedback_coin_dedup.md` | コイン重複防止パターン |
| `memory/feedback_seikai_display.md` | 正解演出パターン（seikaiRef）|
| `memory/project_parts_structure.md` | parts/・hooks/の共通部品一覧 |
