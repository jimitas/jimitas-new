// ======================================================
// ステップ③ 回数のひみつ の文言
//
// 「ことばで」では 数学Bの用語4語（要件 §1.2）を使わない（要件 §1.2）。
// ======================================================

import type { Level } from "./text"

export const SECRET_INTRO = "上から順に読むと、回数が 2ⁿ−1 になるわけがわかるよ。まず、表を見て、きまりを見つけよう。"

// ---- 表（F3-1）-----------------------------------------------------------------
export const TABLE_TITLE = "表で気づこう"
export const TABLE_HEAD = ["枚数", "回数", "回数＋1"] as const
export const BTN_PREDICT = "5枚を予想する"
export const BTN_REVEAL = "答えを確かめる"
export const BTN_MORE = "もっと見る"
export const TABLE_PREDICT_NOTE = "5枚のとき、回数はいくつだと思う？　「回数＋1」のならびを見て考えてみよう。"
export const TABLE_NOTICE = "「回数＋1」を見ると、2、4、8、16、32… 2 をかけるたびに、ちょうど 2 倍になっているね。"

// ---- ブロック図（F3-2）---------------------------------------------------------
export const BLOCK_TITLE = "しくみで納得しよう"
export const BLOCK_INTRO = "n 枚の回数は「上の n−1 枚を動かす回数」＋ 1 ＋「上の n−1 枚をもどす回数」。長さで表すと、こうなるよ。"
export const BTN_EXTRA = "おまけの1手をつける"
export const BTN_REGROUP = "同じ長さの2つに組み直す"
export const BTN_BLOCK_RESET = "もとにもどす"
export const BTN_NEXT_N = "1枚ふやす"
export const BLOCK_EXTRA_NOTE = "おまけの1手をつけると、同じ長さのブロックが2組できるよ。"
export const BLOCK_REGROUP_NOTE = "「回数＋1」は、同じ長さの2つに分けられた。1枚ふやすと、ちょうど 2 倍になるんだね。"

export function blockLabel(n: number): string {
  return `${n}枚の「回数＋1」`
}

// ---- 2進法（F3-3）--------------------------------------------------------------
export const BINARY_HEAD = "2進法で見てみよう"
export const BINARY_NOTE = "回数を2進法で書くと 1 が n 個ならぶ。1 をたすと 1 のあとに 0 が n 個ならぶ数（2ⁿ）になるよ。"
export const BINARY_DISK_NOTE = "2進法の各けたは、円盤1枚ずつに対応しているよ。円盤が動いた回数をたすと、1 が並ぶ。"

// ---- 結論（F3-4）---------------------------------------------------------------
export const CONCLUSION_TITLE = "わかったこと"

export function conclusionLines(level: Level): string[] {
  if (level === "symbols") {
    return [
      "n 枚の最少回数 ＝ 2ⁿ − 1",
      "（n枚の回数）＝ 2 ×（n−1枚の回数）＋ 1",
      "2ⁿ−1 = 1 + 2 + 2² + … + 2ⁿ⁻¹ = 111…1₍₂₎",
    ]
  }
  return ["n 枚の最少回数 ＝ 2 を n 回かけて 1 ひいた数 ＝ 2ⁿ − 1"]
}

// ---- 棒グラフ（F3-5）-----------------------------------------------------------
export const CHART_TITLE = "枚数がふえると、回数は？"
export const CHART_NOTE = "1枚ふえるたびに、回数はほぼ 2 倍。グラフは急にのびていくね。"
export const BTN_TO_BIG = "64枚だとどうなる？ ④へ"
export const CHART_RANGES = [10, 20] as const

// ---- なぜ最少か（F3-6）---------------------------------------------------------
export const WHY_TITLE = "なぜこれより少なくできないの？"
export const WHY_LINES = [
  "いちばん下の円盤を動かす瞬間、その上にあった n−1 枚は、ぜんぶ、残りの1本に積まれていないといけないよ。",
  "だから、その前に n−1 枚をぜんぶ動かす回数が、どうしても必要になるよ。",
  "いちばん下の円盤を動かしたあとも、その n−1 枚を上にもどすのに、同じだけ必要だよ。",
]

/** ブロック図の各ブロックの長さ（[a][1][a] ＝ [3][1][3] など） */
export function blockLengths(n: number): { a: number; total: number } {
  const a = 2 ** (n - 1) - 1
  return { a, total: 2 * a + 2 }
}
