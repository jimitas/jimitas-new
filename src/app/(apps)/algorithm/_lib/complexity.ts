// ======================================================
// 計算量の実測と、折れ線グラフの座標計算
//
// 実測は CountRecorder を通す。アニメーションと同じ生成器を使うので、
// グラフの数値と画面のカウンタが食いちがうことがない
//（両者が一致することは単体テストで固定している）。
//
// 描画そのものは _components/ComplexityChart.tsx。
// ここは純粋な計算だけを持ち、React にも DOM にも触らない。
// ======================================================

import { ALGOS, countOperations, type RunOptions } from "./algorithms"
import { makeData, pickTarget, sortedCopy } from "./random"
import type { AlgoId, DataKind } from "./types"

/** グラフに出す n の範囲。UI のスライダーと同じ */
export const CHART_N_MIN = 5
export const CHART_N_MAX = 50
export const CHART_N_STEP = 5

/** 折れ線の1点 */
export type Point = { n: number; compares: number }

/** 1本の折れ線 */
export type Series = {
  id: string
  label: string
  points: readonly Point[]
  /** 理論の線か（実測は実線、理論は点線で描く） */
  theoretical: boolean
}

/** グラフに出す n の一覧 */
export function chartSizes(): number[] {
  const out: number[] = []
  for (let n = CHART_N_MIN; n <= CHART_N_MAX; n += CHART_N_STEP) out.push(n)
  return out
}

/**
 * n を変えながら実際に走らせて、くらべた回数を集める。
 *
 * 配列はシード固定で作る。毎回ちがう配列だとグラフのギザギザが
 * 動いてしまって読めないし、テストもできない。
 */
export function measure(algoId: AlgoId, dataKind: DataKind, seed: number): Point[] {
  const algo = ALGOS[algoId]
  return chartSizes().map((n) => {
    const base = makeData(n, dataKind, seed)
    const input = algo.requiresSorted ? sortedCopy(base) : base

    const options: RunOptions = {}
    if (algo.category === "search") {
      // 探索は「ありません」がいちばん回数のかかる場合。
      // 最悪の場合どうなるかを見せたいので、無い値でそろえる。
      options.target = pickTarget(input, false, seed)
    }

    return { n, compares: countOperations(algoId, input, options).compares }
  })
}

/** 理論の目安（そのアルゴリズムの theory をそのまま使う） */
export function theoryPoints(algoId: AlgoId): Point[] {
  const theory = ALGOS[algoId].theory
  return chartSizes().map((n) => ({ n, compares: theory(n) }))
}

// ── 折れ線の座標計算 ───────────────────────────
// SVG の座標に直すところ。ここはバグの温床なので純関数に切り出して
// 空配列・1点・全部同じ値といった端の場合まで単体テストで固定する。

export type Box = { width: number; height: number; padLeft: number; padBottom: number; padTop: number; padRight: number }

/** すべての系列を通した縦軸の最大値。0 にはしない（0除算よけ） */
export function maxCompares(series: readonly Series[]): number {
  let max = 0
  for (const s of series) for (const p of s.points) if (p.compares > max) max = p.compares
  return max > 0 ? max : 1
}

/** 1点を SVG の座標に直す */
export function toXY(
  point: Point,
  box: Box,
  maxY: number,
  nMin = CHART_N_MIN,
  nMax = CHART_N_MAX,
): { x: number; y: number } {
  const innerW = box.width - box.padLeft - box.padRight
  const innerH = box.height - box.padTop - box.padBottom
  // n の幅が 0（点が1つだけ）のときは左はしに置く
  const span = nMax - nMin
  const tx = span === 0 ? 0 : (point.n - nMin) / span
  const ty = point.compares / maxY
  return {
    x: box.padLeft + tx * innerW,
    y: box.padTop + (1 - ty) * innerH,
  }
}

/** polyline の points 属性にそのまま渡せる文字列 */
export function toPolyline(
  points: readonly Point[],
  box: Box,
  maxY: number,
  nMin = CHART_N_MIN,
  nMax = CHART_N_MAX,
): string {
  return points
    .map((p) => {
      const { x, y } = toXY(p, box, maxY, nMin, nMax)
      return `${round(x)},${round(y)}`
    })
    .join(" ")
}

/** SSR とクライアントで文字列が食いちがわないように、桁を固定する */
function round(v: number): number {
  return Math.round(v * 100) / 100
}

/** 縦軸の目盛り。0 と最大値のあいだを等分する */
export function yTicks(maxY: number, count = 4): number[] {
  const out: number[] = []
  for (let k = 0; k <= count; k++) out.push(Math.round((maxY * k) / count))
  return out
}
