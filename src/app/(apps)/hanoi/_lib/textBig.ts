// ======================================================
// ステップ④ 64枚だと？ の文言（「ことばで」では 数学Bの用語4語（要件 §1.2）を使わない）
// ======================================================

import type { Level } from "./text"

export const BIG_INTRO = "円盤の枚数を ふやしてみよう。最少回数は、どこまで大きくなるかな？　1回動かすのに かかる時間も 選べるよ。"
export const BIG_N_LABEL = "円盤の枚数"
export const BIG_SEC_LABEL = "1回動かすのにかかる時間"
export const BIG_SEC_OPTIONS = [
  { value: 1, label: "1秒" },
  { value: 0.1, label: "0.1秒" },
  { value: 0.000001, label: "0.000001秒（コンピュータ）" },
] as const

export const BIG_MOVES_TITLE = "最少回数"
export const BIG_TIME_TITLE = "かかる時間"

export function formulaLine(n: number, level: Level): string {
  return level === "symbols" ? `2ⁿ−1 ＝ 2^${n} − 1` : `2 を ${n} 回かけて 1 ひいた数`
}

/** 宇宙の年齢の何倍か（例：約42倍／約0.0012倍） */
export function timesText(r: number): string {
  if (r >= 100) return `約${Math.round(r).toLocaleString("ja-JP")}倍`
  if (r >= 1) return `約${Number(r.toPrecision(2))}倍`
  return `約${Number(r.toPrecision(2))}倍`
}

export const COMPARE_TITLE = "くらべてみよう（宇宙の年齢を1本の帯とすると）"
export const COMPARE_NOTE_HUMAN = "人の一生（約80年）は、帯にもならないくらい短いよ。"
export const COMPARE_ANSWER = "かかる時間"

export const ESTIMATE_TITLE = "見積もりで考えてみよう（64枚・1回1秒）"
export const ESTIMATE_LINES = [
  "2¹⁰ ＝ 1024 ≒ 1000 とみなす。",
  "2⁶⁴ ＝ 2⁴ ×（2¹⁰）⁶ ≒ 16 × 1000⁶ ＝ 1.6 × 10¹⁹ 回",
  "1年 ≒ 3200万秒 だから、1.6 × 10¹⁹ ÷ (3.2 × 10⁷) ＝ 5 × 10¹¹ 年 ＝ 約5000億年",
]
export const ESTIMATE_COMPARE = "正確な値（約5845億年）とくらべても、見積もりでだいたい合うよ。"

export const DOUBLE_TITLE = "1枚ふえると？"
export const DOUBLE_NOTE = "1枚ふえると、かかる時間は ちょうど 2 倍（＋1回）になるよ。"
