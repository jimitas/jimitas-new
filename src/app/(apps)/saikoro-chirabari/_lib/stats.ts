// ======================================================
// さいころの散らばり — 平均・分散・標準偏差
//
// ⚠ 分散は「偏差の2乗の和 ÷ n」（要件定義書 §6）。
//   授業で生徒が手計算する式と同じにするため、n−1 で割る式は使わない。
//   テスト（stats.test.ts）で ÷n であることを固定している。
// ======================================================

import type { Method } from "./dice"

/** 横軸の得点（2〜12 の 11 列。模造紙と同じ軸） */
export const SCORES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
export const SCORE_MIN = 2
export const SCORE_MAX = 12

/**
 * 理論値。
 *   A方式：さいころ1個の分散 35/12 が2個ぶんで 35/6
 *   B方式：さいころ1個の分散 35/12 を 2² 倍して 35/3（A のちょうど2倍）
 */
export const THEORY: Record<Method, { mean: number; variance: number; sd: number }> = {
  A: { mean: 7, variance: 35 / 6, sd: Math.sqrt(35 / 6) },
  B: { mean: 7, variance: 35 / 3, sd: Math.sqrt(35 / 3) },
}

export function mean(xs: readonly number[]): number {
  if (xs.length === 0) return NaN
  let s = 0
  for (const x of xs) s += x
  return s / xs.length
}

/** 偏差（それぞれの値 − 平均） */
export function deviations(xs: readonly number[]): number[] {
  const m = mean(xs)
  return xs.map((x) => x - m)
}

/** 分散（÷n） */
export function variance(xs: readonly number[]): number {
  if (xs.length === 0) return NaN
  let s = 0
  for (const d of deviations(xs)) s += d * d
  return s / xs.length
}

export function sd(xs: readonly number[]): number {
  return Math.sqrt(variance(xs))
}

/** 得点ごとの回数（SCORES と同じ並びの 11 個） */
export function countScores(xs: readonly number[]): number[] {
  const c = new Array(SCORES.length).fill(0)
  for (const x of xs) c[x - SCORE_MIN]++
  return c
}

// ------------------------------------------------------
// ふった結果をためていく入れ物（セクション1・2）
//
// 得点はすべて整数なので、合計と2乗の合計を整数で持てば分散は誤差なく出る。
//   分散 = (n·Σx² − (Σx)²) / n²   … 偏差の2乗の和 ÷ n と同じ値
// sdHistory[i] は「i+1 回目までで計算した標準偏差」。収束グラフに使う。
// ------------------------------------------------------
export interface Tally {
  n: number
  sum: number
  sumSq: number
  counts: number[]
  sdHistory: number[]
}

export function emptyTally(): Tally {
  return { n: 0, sum: 0, sumSq: 0, counts: new Array(SCORES.length).fill(0), sdHistory: [] }
}

/** 得点を足した新しい Tally を返す（元は書きかえない） */
export function addScores(t: Tally, scores: readonly number[]): Tally {
  let { n, sum, sumSq } = t
  const counts = t.counts.slice()
  const sdHistory = t.sdHistory.slice()
  for (const x of scores) {
    n++
    sum += x
    sumSq += x * x
    counts[x - SCORE_MIN]++
    sdHistory.push(Math.sqrt(Math.max(0, n * sumSq - sum * sum)) / n)
  }
  return { n, sum, sumSq, counts, sdHistory }
}

export function tallyMean(t: Tally): number {
  return t.n === 0 ? NaN : t.sum / t.n
}

export function tallyVariance(t: Tally): number {
  return t.n === 0 ? NaN : Math.max(0, t.n * t.sumSq - t.sum * t.sum) / (t.n * t.n)
}

export function tallySd(t: Tally): number {
  return Math.sqrt(tallyVariance(t))
}
