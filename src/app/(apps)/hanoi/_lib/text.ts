// ======================================================
// ハノイの塔：画面の文言（ステップごとに追記する）
//
// 「ことばで」では 漸化式・数学的帰納法・等比数列・再帰 の語を使わない（要件 §1.2）。
// この4語は「記号で」とステップ⑤の「もっと知りたい人へ」でだけ使ってよい。
// ======================================================

export type Level = "words" | "symbols"

/** 手で動かせる最大枚数（255手）と、自動で解ける最大枚数（1023手）。要件 Q2 */
export const PLAY_MAX = 8
export const AUTO_MAX = 10

export const APP_TITLE = "ハノイの塔"
export const APP_SUBTITLE = "〜2ⁿ−1回のひみつ〜"

export const TABS = [
  { id: 1, label: "① あそぶ" },
  { id: 2, label: "② 自動で解く" },
  { id: 3, label: "③ 回数のひみつ" },
  { id: 4, label: "④ 64枚だと？" },
  { id: 5, label: "⑤ 歴史と解き方" },
] as const
export type Tab = (typeof TABS)[number]["id"]

/** ステップ② の 3つの区切りの合計の式 */
export function segmentSum(n: number, level: Level): string {
  const half = 2 ** (n - 1) - 1
  const total = 2 ** n - 1
  const base = `${half} ＋ 1 ＋ ${half} ＝ ${total}`
  return level === "symbols" ? `${base}　（(2ⁿ⁻¹−1) ＋ 1 ＋ (2ⁿ⁻¹−1) ＝ 2ⁿ−1）` : base
}

/** 円盤ごとの回数の合計の式（例：8＋4＋2＋1＝15）。counts は添字 1〜n */
export function countSum(counts: number[], n: number): string {
  const parts = Array.from({ length: n }, (_, i) => counts[i + 1])
  return `${parts.join("＋")}＝${parts.reduce((a, b) => a + b, 0)}`
}

/** ①の動く向き（例：A→C→B→A…） */
export function cycleText(from: string, to: string): string {
  const third = ["A", "B", "C"].find((p) => p !== from && p !== to) ?? "B"
  return `${from}→${to}→${third}→${from}…`
}

export const TIP_TITLE = "手で解くコツ"
export const TIP_LINES = [
  "いちばん小さい①は、1手おきに、いつも同じ向きにぐるぐる動くよ。",
  "①を動かさない手は、①以外で動かせる手が1つしかないよ。",
]

export const AUTO_INTRO = "▶ を押すと、いちばん少ない手数で自動で動くよ。手順が3つに分かれているのを見てみよう。"
export const SEG_HINT = "前半と後半をクリックすると、その中がさらに3つに分かれて見えるよ。"
export const STRIP_TITLE = "手順の帯（動いた円盤の色）"
export const COUNT_TITLE = "円盤ごとに動いた回数"
export const BINARY_TITLE = "手数を2進法で見ると"

export function binaryNote(k: number, j: number | null): string {
  if (k === 0 || j === null) return "0手目：まだ動いていないよ。"
  return `右から ${j} けた目が変わったので、円盤 ${"①②③④⑤⑥⑦⑧⑨⑩"[j - 1] ?? j} が動くよ。`
}
