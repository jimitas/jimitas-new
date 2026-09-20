// ======================================================
// アルゴリズムシミュレーター — 型定義
//
// 設計の中心は「ステップ列」。
// アルゴリズムを実行しながら描画するのではなく、実行の記録を
// Step の配列として先に全部作り、画面はその添字を進めるだけにする。
// こうすると再生・一時停止・コマ送り・速度変更がすべて
// 「添字の操作」になり、アルゴリズム側に再生制御が漏れない。
// ======================================================

// ── アルゴリズムの種類 ──────────────────────────────
// 段階ごとに増やしていく。
// ALGOS は Record<AlgoId, AlgoDef> の網羅型なので、ここに1つ足すと
// 「登録表・コード例・計算量表」が同時に型エラーになり、書き忘れが起きない。
export type AlgoId =
  | "selection" // 選択ソート
  | "bubble" // バブルソート
  | "insertion" // 挿入ソート
  | "exchange" // 交換ソート（単純交換）
  | "linear" // 線形探索
  | "binary" // 二分探索
  | "quick" // クイックソート
  | "merge" // マージソート

// ── コード例の言語 ────────────────────────────────
// kyotsu = 大学入学共通テスト用プログラム表記（疑似言語）
export type LangId = "python" | "javascript" | "kyotsu"

// ── 配列の区間（lo・hi とも「その位置をふくむ」）────────
// クイックソートの処理範囲・二分探索の探索範囲・マージの対象範囲に共用する。
export type Range = { lo: number; hi: number }

// ── バーの下に出す矢印の名前 ────────────────────────
// 文字列そのままにせず型にしておくと、打ち間違いがコンパイルで落ちる。
export type PointerName =
  | "i" | "j" | "k" | "left" | "right" | "mid" | "pivot" | "min" | "key"
export type Pointers = Partial<Record<PointerName, number>>

// ── 1ステップで何が起きたか ─────────────────────────
// カウンタはこの kind から自動集計する（生成器が手で数えない＝数え忘れない）。
export type StepKind =
  | "init"      // 開始時の状態
  | "compare"   // 2つの値をくらべた             → 比較回数 +1
  | "swap"      // 2つの値を入れかえた           → 交換回数 +1
  | "shift"     // 値を1つずらした（挿入ソート） → 交換回数 +1
  | "write"     // 配列に書きこんだ（マージ）     → 交換回数 +1
  | "take"      // 値を取り出して手に持った（挿入ソートの tmp = Data[i]）※数えない
  | "place"     // 手に持っていた値を置いた（Data[j+1] = tmp）※数えない
  | "mark"      // その位置が確定した
  | "focus"     // 見ている場所・範囲が変わっただけ（数えない）
  | "found"     // 探している値が見つかった
  | "notfound"  // 見つからずに終わった
  | "done"      // 全部おわった

// ── 光らせるコード行の「意味ラベル」──────────────────
// 言語に依存しない。行番号は持たない（コードを1行足すと全部ずれ、
// しかも無言で間違った行が光るため）。
export type CodeTag =
  | "init" | "outerLoop" | "innerLoop" | "compare" | "swap" | "shift"
  | "takeOut" | "insert" | "updateMin" | "markSorted" | "finish"
  | "pivotSelect" | "partition" | "recurseLeft" | "recurseRight"
  | "split" | "mergeCopy" | "mergeBack" | "mergeRest"
  | "searchLoop" | "midCalc" | "narrowLeft" | "narrowRight"
  | "found" | "notfound"

// ── マージソートの作業用配列（段階4で使う）──────────────
export type AuxView = {
  /** 中身。まだコピーされていない場所は null */
  values: readonly (number | null)[]
  /** 今このステップで読んでいる場所（合体のときは くらべている2か所） */
  reading?: readonly number[]
  /** 元の配列のどの範囲を写したものか（元配列の真下に位置を揃えて描くのに使う） */
  source: Range
}

// ── 1ステップ ────────────────────────────────────
// optional のフィールドは段階1の時点ですべて宣言しておく。
// 段階4で型を広げると、既存の生成器とUIが全部巻き込まれてしまうため。
export type Step = {
  kind: StepKind
  /** その時点の配列。変化していないステップは1つ前と同じ配列を使いまわす（構造共有） */
  array: readonly number[]
  /**
   * くらべている場所（kind が "compare" のとき）。
   * ソートは2か所、探索は「A[i] と さがす値」なので1か所になる。
   */
  compared?: readonly number[]
  /** 探索でさがしている値。探索アルゴリズムだけが設定する */
  target?: number
  /**
   * いま手に持っている値（挿入ソートの tmp）。持っていなければ undefined。
   *
   * ずらしている途中は配列の中に同じ値が2つ見える状態になる。
   * 「取り出した値」と「そのあいた場所（gap）」を分けて持つことで、
   * 画面では穴として描き、値が増えたように見えるのを防ぐ。
   */
  held?: number
  /** 手に持っているあいだ、あいている場所の添字 */
  gap?: number
  /** 入れかえた2か所（kind が "swap" のとき） */
  swapped?: readonly [number, number]
  /** 書きこんだ場所（kind が "shift" / "write" のとき） */
  wrote?: number
  /** このステップで確定した場所（kind が "mark" のとき） */
  marked?: number
  /** もう動かない（確定した）場所の一覧。marked を積み上げたもの */
  sorted: readonly number[]
  /** いま処理している区間。二分探索（段階2）・クイック／マージ（段階4）で使う */
  range?: Range
  /** 矢印の位置 */
  pointers: Pointers
  /** 作業用配列。マージソート専用（段階4） */
  aux?: AuxView
  /** これから処理する区間の待ち行列。クイックソート専用（段階4） */
  pendingRanges?: readonly Range[]
  /** 光らせるコード行の意味ラベル */
  codeTag: CodeTag
  /** 学習者向けの説明文（日本語） */
  message: string
  /** ここまでの比較回数 */
  compares: number
  /** ここまでの交換・移動の回数 */
  swaps: number
}

// ── 生成器が Recorder に渡すもの ──────────────────
// array / sorted / compares / swaps は Recorder が自分で埋めるので渡さない。
// message を省略すると describeStep が定型文を作る。
export type StepInput = {
  kind: StepKind
  codeTag: CodeTag
  pointers?: Pointers
  compared?: readonly number[]
  target?: number
  swapped?: readonly [number, number]
  wrote?: number
  marked?: number
  range?: Range
  aux?: AuxView
  pendingRanges?: readonly Range[]
  message?: string
}

// ── データの並び方 ───────────────────────────────
export type DataKind = "random" | "nearly" | "reverse" | "same"
