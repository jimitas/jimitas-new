// ======================================================
// ガチャ確率シミュレーター — グラフ用のデータ作り
//
// 移植元 script.js の computeTheory / renderB / renderC / renderCumulative から
// 「数字を作る部分」だけを取り出したもの。描画は _components/ がする。
// 観測値はすべて「セッションに対する割合（0..1）」で返す。
// ======================================================

import * as M from "./gachaMath"
import type { GachaStats } from "./gachaMath"

/** 当たり回数グラフの最大列数（これを超えたら何回ぶんかをまとめる） */
export const MAX_COLUMNS = 30

export interface Theory {
  pAtLeast: number
  pNone: number
  pmf: Float64Array
  edges: [number, number][]
  bucketMass: number[]
  median: number
  mean: number
}

export function computeTheory(p: number, N: number): Theory {
  const edges = M.bucketEdges(N, 10)
  return {
    pAtLeast: M.pAtLeastOne(p, N),
    pNone: M.pNone(p, N),
    pmf: M.binomialPmf(p, N),
    edges,
    bucketMass: M.geometricBucketMass(p, edges),
    median: M.medianFirstHit(p),
    mean: M.meanFirstHit(p),
  }
}

/** 縦棒グラフ1本ぶん */
export interface Column {
  /** 棒の下に出すラベル */
  label: string
  /** 読み上げ・表で使う長いラベル */
  desc: string
  obs: number
  theory: number
}

/**
 * B: 1セッションの当たり回数の分布。
 * 表示範囲は「理論の平均±4σ」と「実際に出た範囲」の和を [0, N] に収めたもの。
 * 列が MAX_COLUMNS を超えるときは w 回ぶんずつまとめる。
 */
export function hitsColumns(stats: GachaStats, theory: Theory): Column[] {
  const { N, p } = stats
  const s = stats.sessions
  const mean = N * p
  const sd = Math.sqrt(N * p * (1 - p))
  let lo = Math.max(0, Math.floor(mean - 4 * sd))
  let hi = Math.min(N, Math.ceil(mean + 4 * sd))
  for (let k = 0; k <= N; k++) if (stats.hitsHist[k] > 0) { lo = Math.min(lo, k); break }
  for (let k = N; k >= 0; k--) if (stats.hitsHist[k] > 0) { hi = Math.max(hi, k); break }
  if (hi <= lo) hi = Math.min(N, lo + 1)
  if (hi <= lo && lo > 0) lo = hi - 1
  const w = Math.ceil((hi - lo + 1) / MAX_COLUMNS)

  const cols: Column[] = []
  for (let a = lo; a <= hi; a += w) {
    const b = Math.min(a + w - 1, hi)
    let c = 0
    let m = 0
    for (let k = a; k <= b; k++) {
      c += stats.hitsHist[k]
      m += theory.pmf[k]
    }
    const label = a === b ? `${a}` : `${a}-${b}`
    cols.push({ label, desc: `${label}回`, obs: s > 0 ? c / s : 0, theory: m })
  }
  return cols
}

/** C: 初当たりの回数の分布（最大10区間＋「出ず」） */
export function firstHitColumns(stats: GachaStats, theory: Theory): Column[] {
  const s = stats.sessions
  const counts = M.bucketize(stats.firstHitHist, theory.edges)
  const cols: Column[] = theory.edges.map(([a, b], i) => {
    const label = a === b ? `${a}` : `${a}〜${b}`
    return { label, desc: `${label}回目`, obs: s > 0 ? counts[i] / s : 0, theory: theory.bucketMass[i] }
  })
  cols.push({ label: "出ず", desc: "出ず", obs: s > 0 ? stats.firstHitHist[0] / s : 0, theory: theory.pNone })
  return cols
}

/**
 * C: 累積カーブ「k 回目までに当たった割合」を最大 100 点の折れ線にする。
 * 座標は viewBox="0 0 100 60"（x: 0..100、y: 60 が 0%、0 が 100%）。
 * 観測がまだ無いときの obs は空文字。
 */
export function cumulativePoints(stats: GachaStats): { theory: string; obs: string } {
  const { N, p } = stats
  const s = stats.sessions
  const step = Math.max(1, Math.ceil(N / 100))
  const ptsTh = ["0,60"]
  const ptsObs = ["0,60"]
  let acc = 0
  let nextSample = step
  for (let k = 1; k <= N; k++) {
    acc += stats.firstHitHist[k]
    if (k === nextSample || k === N) {
      const x = ((k / N) * 100).toFixed(2)
      ptsTh.push(`${x},${(60 - M.geometricCdf(p, k) * 60).toFixed(2)}`)
      if (s > 0) ptsObs.push(`${x},${(60 - (acc / s) * 60).toFixed(2)}`)
      nextSample += step
    }
  }
  return { theory: ptsTh.join(" "), obs: s > 0 ? ptsObs.join(" ") : "" }
}
