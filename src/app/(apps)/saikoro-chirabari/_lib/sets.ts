// ======================================================
// さいころの散らばり — 「10回ふって標準偏差を出す」をくりかえす（セクション3）
//
// 各セットの標準偏差も ÷10 で出す（授業の手計算と同じ）。
// そのため山は理論値の線よりわずかに左に寄る。不具合ではない（要件定義書 §6 の注）。
// ======================================================

import { rollScore } from "./dice"
import type { Method, Rng } from "./dice"

/** 1セットの回数（授業と同じ） */
export const TRIALS_PER_SET = 10

/** ヒストグラムの横軸（A・B で共通・固定。10回の標準偏差は最大でも 5。区間幅で割り切れる値にする） */
export const SD_AXIS_MAX = 6
export const SD_BIN_WIDTH = 0.2

/** セットごとの標準偏差を S 個 */
export function simulateSetSds(method: Method, sets: number, rng: Rng, trials = TRIALS_PER_SET): Float64Array {
  const out = new Float64Array(sets)
  for (let s = 0; s < sets; s++) {
    let sum = 0
    let sumSq = 0
    for (let i = 0; i < trials; i++) {
      const x = rollScore(method, rng)
      sum += x
      sumSq += x * x
    }
    out[s] = Math.sqrt(Math.max(0, trials * sumSq - sum * sum)) / trials
  }
  return out
}

/** 区間 [i·w, (i+1)·w) ごとの個数。最後の区間だけ右端を含む */
export function histogram(values: ArrayLike<number>, max = SD_AXIS_MAX, width = SD_BIN_WIDTH): number[] {
  const bins = Math.round(max / width)
  const c = new Array(bins).fill(0)
  for (let i = 0; i < values.length; i++) {
    // 0.6 / 0.2 が 2.9999… になるのを防ぐため、わずかに足してから切り捨てる
    const k = Math.min(bins - 1, Math.max(0, Math.floor(values[i] / width + 1e-9)))
    c[k]++
  }
  return c
}

/** 分位点（並べて線形に補間する。q は 0〜1） */
export function quantile(values: ArrayLike<number>, q: number): number {
  if (values.length === 0) return NaN
  const sorted = Float64Array.from(values).sort()
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

/** 真ん中 80% が入る範囲（下から10%の点〜90%の点） */
export function middleBand(values: ArrayLike<number>, share = 0.8): { lo: number; hi: number } {
  const tail = (1 - share) / 2
  return { lo: quantile(values, tail), hi: quantile(values, 1 - tail) }
}

export function average(values: ArrayLike<number>): number {
  if (values.length === 0) return NaN
  let s = 0
  for (let i = 0; i < values.length; i++) s += values[i]
  return s / values.length
}

/** value 以下のセットの割合（班のマーカーの「下から何%」に使う） */
export function shareAtOrBelow(values: ArrayLike<number>, value: number): number {
  if (values.length === 0) return NaN
  let c = 0
  for (let i = 0; i < values.length; i++) if (values[i] <= value + 1e-9) c++
  return c / values.length
}
