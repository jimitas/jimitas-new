// ======================================================
// ガチャ確率シミュレーター — アニメ中の1セッション
//
// 移植元 script.js の startSession / advance から DOM を外したもの。
// 1回ずつ引く処理は gachaMath の drawPull を通るので、
// 「一括（runSession）」と「アニメ」で分布がずれない。
// ======================================================

import { drawPull } from "./gachaMath"
import type { Rng } from "./gachaMath"

/** outcomes の値 */
export const UNDRAWN = 0
export const MISS = 1
export const HIT = 2

/** バー上の当たり目印の最大数 */
export const TICK_CAP = 300

export interface CurrentSession {
  /** 何回引いたか */
  k: number
  hits: number
  /** 初当たりの回数(1..N)。まだなら 0 */
  firstHit: number
  /** N 回引き切った */
  done: boolean
  /** 途中で停止した（集計には入れない） */
  aborted: boolean
  /** [i] = i+1 回目の結果（UNDRAWN / MISS / HIT） */
  outcomes: Uint8Array
  /** 当たりが出た回数（バー表示の目印用。最大 TICK_CAP 個） */
  ticks: number[]
}

export function newSession(N: number): CurrentSession {
  return { k: 0, hits: 0, firstHit: 0, done: false, aborted: false, outcomes: new Uint8Array(N), ticks: [] }
}

/** count 回ぶん引き進める（N を超えない）。アニメも「一気に」も必ずここを通る */
export function advanceSession(cur: CurrentSession, p: number, count: number, rng: Rng = Math.random): void {
  if (cur.done) return
  const N = cur.outcomes.length
  const end = Math.min(N, cur.k + count)
  while (cur.k < end) {
    const hit = drawPull(p, rng)
    cur.k++
    cur.outcomes[cur.k - 1] = hit ? HIT : MISS
    if (hit) {
      cur.hits++
      if (cur.firstHit === 0) cur.firstHit = cur.k
      if (cur.ticks.length < TICK_CAP) cur.ticks.push(cur.k)
    }
  }
  if (cur.k >= N) cur.done = true
}
