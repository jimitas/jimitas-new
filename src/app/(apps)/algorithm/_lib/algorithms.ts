// ======================================================
// アルゴリズムの登録表と、ステップ列の入口
//
// ALGOS は Record<AlgoId, AlgoDef>。AlgoId に1つ足すとここが
// 型エラーになるので、タブ・生成器・計算量表の書き忘れが起きない。
// ======================================================

import { CountRecorder, StepRecorder, type Recorder } from "./recorder"
import { mergeSort } from "./mergeSort"
import { quickSort } from "./quickSort"
import { binarySearch, linearSearch } from "./searches"
import { bubbleSort, exchangeSort, insertionSort, selectionSort } from "./sorts"
import type { AlgoId, PointerName, Step } from "./types"

export type AlgoDef = {
  id: AlgoId
  /** タブに出す名前 */
  label: string
  category: "sort" | "search"
  /** アルゴリズム本体。Recorder に対してだけ書く */
  run: (rec: Recorder, options: RunOptions) => void
  /** 理論計算量の表に出す文字列 */
  complexity: { best: string; average: string; worst: string; space: string }
  /** 比較回数の理論値（段階3のグラフの線に使う） */
  theory: (n: number) => number
  /** 入力がソート済みである必要があるか（二分探索だけ true になる予定） */
  requiresSorted: boolean
  /** しくみの解説。画面の解説パネルに出す */
  explanation: {
    /** どうやって並べる（さがす）か。番号つきで出す */
    how: readonly string[]
    /** 長所・短所などのポイント */
    points: readonly string[]
  }
  /**
   * 2つめのカウンタのラベル。
   * 数える中身がアルゴリズムでちがう（入れかえ／ずらし）ので名前も変える。
   * undefined ならそのカウンタを出さない（探索は常に0で意味がないため）。
   */
  moveLabel?: string
  /** 値を取り出して手に持つ操作があるか（挿入ソートだけ true） */
  usesHand?: boolean
  /**
   * 矢印 → コード例での変数名。
   * 「m」がコードの saisho のことだと初学者が気づけるよう、凡例に添える。
   * ここに書いた名前が3言語すべてのコード例に出てくることは単体テストで固定する。
   */
  pointerVars: Partial<Record<PointerName, string>>
  /**
   * 凡例の説明の差しかえ。
   * 同じ矢印でも意味がちがうアルゴリズムのために置いている
   * （マージソートの L / R は「範囲の端」ではなく「読んでいる場所」）。
   * 共通の説明に但し書きを足すと、合体をしないクイックソートや
   * 二分探索にも「（合体のときは…）」と出てしまう。
   */
  pointerHelp?: Partial<Record<PointerName, string>>
}

export type RunOptions = {
  /** 探索アルゴリズムでさがす値（段階2で使う） */
  target?: number
}

export const ALGOS: Record<AlgoId, AlgoDef> = {
  selection: {
    id: "selection",
    label: "選択ソート",
    category: "sort",
    run: (rec) => selectionSort(rec),
    complexity: {
      best: "O(n²)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
    },
    theory: (n) => (n * (n - 1)) / 2,
    requiresSorted: false,
    explanation: {
      how: [
        "まだ並んでいない範囲の中から、いちばん小さい値をさがす（矢印 m がその場所）",
        "見つけたら、その範囲のいちばん前（矢印 i の場所）と入れかえる",
        "前から1つずつ確定していくので、範囲を1つせまくして 1 にもどる",
      ],
      points: [
        "くらべる回数は、はじめの並びかたに関係なく いつも n×(n−1)÷2 回。ほとんど並んでいても手をぬけないのが短所（「ほぼ順番」や「全部同じ」をえらんで確かめてみよう）",
        "入れかえは1巡につき1回だけ。入れかえの回数が n−1 回ですむのは長所で、1つのデータが大きいときほど効いてくる",
        "配列の中だけで並べかえるので、別の入れものを用意しなくてよい（つかうメモリは O(1)）",
      ],
    },
    moveLabel: "入れかえた回数",
    pointerVars: { i: "i", j: "j", min: "saisho" },
  },

  bubble: {
    id: "bubble",
    label: "バブルソート",
    category: "sort",
    run: (rec) => bubbleSort(rec),
    complexity: {
      // 早期終了があるので、ならんでいる入力は1巡（n-1回）で終わる
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
    },
    theory: (n) => (n * (n - 1)) / 2,
    requiresSorted: false,
    explanation: {
      how: [
        "左はしから、となりどうし（矢印 j と その右）をくらべる",
        "左のほうが大きければ入れかえる。これを右はしまでくり返す",
        "1巡すると いちばん大きい値が右はしに来るので、そこを確定して また左はしから",
      ],
      points: [
        "1巡のあいだ1回も入れかえが起きなければ、もう並んでいるので途中でやめる。「全部同じ」や すでに ならんでいるときは、くらべる回数が n−1 回ですむ（最良 O(n)）。「ほぼ順番」も ばらばらより ずっと少ない回数で終わる",
        "逆順のときがいちばん苦手で、くらべる回数も入れかえの回数も n×(n−1)÷2 回になる",
        "となりどうししか くらべないので、値は1マスずつしか動けない。入れかえの回数が多くなりやすいのが短所",
      ],
    },
    moveLabel: "入れかえた回数",
    pointerVars: { j: "j" },
  },

  insertion: {
    id: "insertion",
    label: "挿入ソート",
    category: "sort",
    run: (rec) => insertionSort(rec),
    complexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
    },
    theory: (n) => (n * (n - 1)) / 4,
    requiresSorted: false,
    explanation: {
      how: [
        "左はしの1個は、それだけで「ならんでいる」とみなす",
        "つぎの1個（矢印 i）を tmp に取り出す。取り出した場所が 穴になる",
        "穴の左どなり（矢印 j）が tmp より大きいあいだ、その値を1つ右へずらす。穴が左へ動いていく",
        "ずらせなくなったら、その穴に tmp をさしこむ",
      ],
      points: [
        "ならんでいる範囲に「さしこむ」ので、すでに正しい位置にあれば1回くらべるだけで つぎへ行ける。「ほぼ順番」がいちばん得意（最良 O(n)）",
        "逆順のときは毎回 左はしまで穴が動くので、くらべる回数も ずらす回数も n×(n−1)÷2 回になる",
        "トランプの手札を並べかえるときの動きとほぼ同じ。取り出して持っているカードが tmp にあたる",
      ],
    },
    moveLabel: "ずらした回数",
    usesHand: true,
    // tmp は矢印ではなくオレンジの札で見せるので、ここには入れない
    pointerVars: { i: "i", j: "j" },
  },

  exchange: {
    id: "exchange",
    label: "交換ソート",
    category: "sort",
    run: (rec) => exchangeSort(rec),
    complexity: {
      best: "O(n²)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
    },
    theory: (n) => (n * (n - 1)) / 2,
    requiresSorted: false,
    explanation: {
      how: [
        "Data[i]（矢印 i）を、そのうしろ全部（矢印 j）と1つずつくらべる",
        "うしろのほうが小さければ、その場で入れかえる",
        "うしろを見終わると Data[i] がいちばん小さい値になっているので、i を1つ進める",
      ],
      points: [
        "バブルソートと名前も動きも似ているが、くらべる相手がちがう。バブルは「となりどうし」、交換は「i とそのうしろ全部」",
        "くらべる回数は並びかたに関係なく いつも n×(n−1)÷2 回。早期終了のしくみがないのが短所",
        "選択ソートとほぼ同じ手順だが、いちばん小さい値を見つけてから1回だけ入れかえる選択ソートとちがい、小さい値を見つけるたびに入れかえるので入れかえの回数が多くなる",
      ],
    },
    moveLabel: "入れかえた回数",
    pointerVars: { i: "i", j: "j" },
  },

  linear: {
    id: "linear",
    label: "線形探索",
    category: "search",
    run: (rec, options) => linearSearch(rec, options.target ?? 0),
    complexity: {
      best: "O(1)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
    },
    // グラフの点線と「目安」の数字は最悪の n を出す。
    // 見つからない場合が必ず n 回で、そこが線形探索のいちばん痛いところなので。
    // （配列の中にある値をさがす平均は およそ半分）
    theory: (n) => n,
    requiresSorted: false,
    explanation: {
      how: [
        "左はし（矢印 i）から 1つずつ さがす値とくらべる",
        "同じ値が見つかったら そこで終わり",
        "右はしまで見て見つからなければ「ありません」",
      ],
      points: [
        "ならんでいなくても使える。これが最大の長所で、二分探索にはできない",
        "運がよければ1回、悪いと n 回くらべる。「ありません」と答えるには必ず n 回かかる",
        "n を大きくすると くらべる回数も同じだけ増える（O(n)）。二分探索と同じ n で試すと差がはっきりする",
        "いちばん単純なやり方だからこそ、ほかのアルゴリズムの「ものさし」になる。二分探索が速いと言えるのは、線形探索とくらべているから",
      ],
    },
    pointerVars: { i: "i" },
  },

  binary: {
    id: "binary",
    label: "二分探索",
    category: "search",
    run: (rec, options) => binarySearch(rec, options.target ?? 0),
    complexity: {
      best: "O(1)",
      average: "O(log n)",
      worst: "O(log n)",
      space: "O(1)",
    },
    // 最悪でも ⌊log2 n⌋ + 1 回
    theory: (n) => (n <= 0 ? 0 : Math.floor(Math.log2(n)) + 1),
    requiresSorted: true,
    explanation: {
      how: [
        "しらべる範囲の左はし（矢印 L）と右はし（矢印 R）を決める",
        "まん中（矢印 M）を見て、さがす値と くらべる",
        "さがす値のほうが大きければ右半分、小さければ左半分だけを しらべる。これを くり返す",
      ],
      points: [
        "1回くらべるたびに しらべる範囲が およそ半分になる。n=50 でも 6回くらべれば答えが出る（O(log n)）",
        "ならんでいる配列にしか使えない。これが ゆずれない条件。この画面では二分探索を選ぶと自動でならべている",
        "線形探索と同じ n で「ありません」をさがしてみると、くらべる回数の差がいちばんはっきりする",
      ],
    },
    pointerVars: { left: "hidari", right: "migi", mid: "aida" },
  },

  quick: {
    id: "quick",
    label: "クイックソート",
    category: "sort",
    run: (rec) => quickSort(rec),
    complexity: {
      best: "O(n log n)",
      average: "O(n log n)",
      // 基準の選び方が悪いと範囲が1ずつしか減らない
      worst: "O(n²)",
      space: "O(log n)",
    },
    // 平均。だいたい n log2 n くらい
    theory: (n) => (n <= 1 ? 0 : Math.round(n * Math.log2(n))),
    requiresSorted: false,
    explanation: {
      how: [
        "範囲の右はし（矢印 P）を 基準の値にする",
        "基準より小さい値を 範囲の左がわへ 集めていく（矢印 j で1つずつ見る）",
        "集め終わったところが 基準の正しい場所。そこで確定する",
        "基準より左・右に分かれた範囲を、それぞれ同じやり方で 並べかえる",
      ],
      points: [
        "1回の仕分けで 範囲が だいたい半分ずつに分かれるので、くらべる回数が n×log₂n くらいですむ。O(n²) の4つより けた違いに速い",
        "ただし「ならび」を『ほぼ順番』や『逆順』にすると急に遅くなる。右はしを基準にしているため、範囲が1つずつしか減らず n×(n−1)÷2 回になってしまう。グラフで確かめてみよう",
        "分かれた範囲を あとで処理するために覚えておく必要があるので、メモリを少し使う（O(log n)）",
      ],
    },
    moveLabel: "入れかえた回数",
    pointerVars: { left: "hidari", right: "migi", pivot: "kijun", i: "i", j: "j" },
  },

  merge: {
    id: "merge",
    label: "マージソート",
    category: "sort",
    run: (rec) => mergeSort(rec),
    complexity: {
      best: "O(n log n)",
      average: "O(n log n)",
      worst: "O(n log n)",
      // 作業用の入れものが要る
      space: "O(n)",
    },
    theory: (n) => (n <= 1 ? 0 : Math.round(n * Math.log2(n))),
    requiresSorted: false,
    explanation: {
      how: [
        "はじめは「1個ずつのかたまり」が n 個ならんでいると考える",
        "となりあう2つのかたまりを 作業用の入れものに写し、小さいほうから 順に書きもどす（＝合体）",
        "かたまりの幅を 1 → 2 → 4 → 8 … と倍にしながら、全部が1つになるまで くり返す",
      ],
      points: [
        "どんな並びでも いつも O(n log n)。分かれかたが はじめから決まっているので、クイックソートのように苦手な並びが無いのが長所",
        "合体のために 別の入れものが必要で、つかうメモリが O(n) になる。ほかのソートが O(1) なのに対してここだけ多い",
        "「ならび」を いろいろ変えても くらべる回数がほとんど変わらないことを、グラフで確かめてみよう",
      ],
    },
    moveLabel: "書きもどした回数",
    pointerVars: { left: "p", right: "q", k: "k" },
    // マージソートの L / R は範囲の端ではなく「いま読んでいる場所」
    pointerHelp: {
      left: "合体するとき 左がわを 読んでいる場所",
      right: "合体するとき 右がわを 読んでいる場所",
    },
  },
}

/** タブに並べる順番。似ているもの同士を となりに置いて見くらべやすくする */
export const ALGO_ORDER: readonly AlgoId[] = [
  "selection",
  "exchange",
  "bubble",
  "insertion",
  "quick",
  "merge",
  "linear",
  "binary",
]

/** アニメーション用のステップ列を作る */
export function generateSteps(
  algoId: AlgoId,
  input: readonly number[],
  options: RunOptions = {},
): Step[] {
  const rec = new StepRecorder(input)
  ALGOS[algoId].run(rec, options)
  return rec.steps
}

/**
 * 回数だけ数える（段階3の計算量グラフ用）。
 * 生成器は generateSteps と同じものを通すので、
 * グラフの数値とアニメーションのカウンタが食いちがうことがない。
 */
export function countOperations(
  algoId: AlgoId,
  input: readonly number[],
  options: RunOptions = {},
): { compares: number; swaps: number } {
  const rec = new CountRecorder(input)
  ALGOS[algoId].run(rec, options)
  return rec.counts
}

/** 終わりの合図の種類。画面側がどの音を鳴らすかを決めるのに使う */
export type FinishCue = {
  /** 何ステップ目で鳴らすか */
  index: number
  kind: "found" | "notfound" | "done"
}

/**
 * ステップ列の「終わりの合図」を1か所だけ返す。
 *
 * なぜ1か所に絞るか:
 *   探索は `found`（または `notfound`）のすぐ後ろに `done` を置いている。
 *   kind を見て素直に鳴らすと、見つけた瞬間と終了で**2回続けて鳴る**。
 *   探索は見つかった／見つからなかった瞬間が山場なのでそちらを採り、
 *   ソートは `done` しか無いのでそれを採る。
 *
 * 音そのものはここでは鳴らさない。`_lib/` は React・DOM・`@/lib/se` に
 * 触らない約束（jest が直接読むため）。どの音にするかは画面側の仕事。
 */
export function finishCue(steps: readonly Step[]): FinishCue | null {
  for (let i = 0; i < steps.length; i++) {
    const kind = steps[i].kind
    if (kind === "found" || kind === "notfound") return { index: i, kind }
  }
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].kind === "done") return { index: i, kind: "done" }
  }
  return null
}
