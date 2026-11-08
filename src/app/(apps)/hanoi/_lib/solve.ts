// ======================================================
// ハノイの塔：最少手順の作り方と、k 手目の状態（要件 §5.1）
//
// 手順は先に全部つくって配列に持ち、k 手目の状態は「0手目から k 手ぶん適用」で求める
// （/algorithm の recorder と同じ考え方）。スライダーで飛んでももたつかないよう、
// SNAPSHOT_EVERY 手ごとに状態を持つ。
// ======================================================

export type Peg = "A" | "B" | "C"
export const PEGS: Peg[] = ["A", "B", "C"]

/** disk は 1＝いちばん小さい */
export interface Move {
  disk: number
  from: Peg
  to: Peg
}

/** 各棒の円盤（下から上の順。数字は円盤の番号） */
export type Pegs = Record<Peg, number[]>

/** 状態のスナップショットを持つ間隔（手） */
export const SNAPSHOT_EVERY = 64

/** n 枚を from → to へ（via は補助の棒）。最少手順 */
export function solve(n: number, from: Peg, to: Peg, via: Peg): Move[] {
  if (n <= 0) return []
  return [
    ...solve(n - 1, from, via, to),
    { disk: n, from, to },
    ...solve(n - 1, via, to, from),
  ]
}

/** 移動先が to のときの最少手順（B のときは via と to を入れかえるだけ） */
export function solveTo(n: number, to: Peg = "C"): Move[] {
  const via: Peg = to === "C" ? "B" : "C"
  return solve(n, "A", to, via)
}

/** 最初の状態：すべて A（下から n … 1） */
export function initialPegs(n: number): Pegs {
  return { A: Array.from({ length: n }, (_, i) => n - i), B: [], C: [] }
}

export function clonePegs(p: Pegs): Pegs {
  return { A: [...p.A], B: [...p.B], C: [...p.C] }
}

/** 1手を適用した新しい状態（元は変えない）。置けない手は呼ばない前提 */
export function applyMoveTo(p: Pegs, m: Move): Pegs {
  const q = clonePegs(p)
  q[m.from].pop()
  q[m.to].push(m.disk)
  return q
}

/** 手順 moves から、SNAPSHOT_EVERY 手ごとの状態をつくる（添字 i が i × SNAPSHOT_EVERY 手目） */
export function buildSnapshots(moves: Move[], n: number): Pegs[] {
  const snaps: Pegs[] = [initialPegs(n)]
  let cur = initialPegs(n)
  moves.forEach((m, i) => {
    cur = applyMoveTo(cur, m)
    if ((i + 1) % SNAPSHOT_EVERY === 0) snaps.push(cur)
  })
  return snaps
}

/** k 手目（0〜moves.length）が終わった状態。スナップショットから近い所まで飛んで、残りを適用 */
export function stateAt(moves: Move[], n: number, k: number, snaps?: Pegs[]): Pegs {
  const kk = Math.max(0, Math.min(moves.length, k))
  const s = snaps ?? [initialPegs(n)]
  const idx = Math.min(Math.floor(kk / SNAPSHOT_EVERY), s.length - 1)
  let cur = s[idx]
  for (let i = idx * SNAPSHOT_EVERY; i < kk; i++) cur = applyMoveTo(cur, moves[i])
  return cur
}

/** 最少手数 2ⁿ − 1 */
export function minCount(n: number): number {
  return 2 ** n - 1
}

/** 手順の最初の k 手で、円盤ごとに何回動いたか（添字 1〜n。0 は使わない） */
export function diskCounts(moves: Move[], n: number, k: number = moves.length): number[] {
  const c = new Array<number>(n + 1).fill(0)
  for (let i = 0; i < Math.min(k, moves.length); i++) c[moves[i].disk]++
  return c
}

// ---- 3つの区切り（F2-5・F2-6）-------------------------------------------------

export type Zone = "first" | "middle" | "last"

/** n 枚（手数 2ⁿ−1）の中での k 手目（1〜）が、前半・中央・後半のどれか */
export function zoneOf(k: number, n: number): Zone {
  const half = 2 ** (n - 1)
  if (k < half) return "first"
  if (k === half) return "middle"
  return "last"
}

/** 区間（開始手・終了手は 1 始まりで両端を含む） */
export interface Segment {
  zone: Zone
  /** この区間にいる枚数（前半・後半は n−1 枚、中央は動く円盤 1 枚） */
  n: number
  start: number
  end: number
  /** 中央の区間で動く円盤の番号（前半・後半は undefined） */
  disk?: number
}

/**
 * n 枚の手順を、offset 手ぶんずらして3つに分けたもの。
 * 入れ子：前半・後半の区間に n−1 を渡してもう一度呼べば、その中がさらに3つに分かれる。
 */
export function splitSegments(n: number, offset = 0): [Segment, Segment, Segment] {
  const half = 2 ** (n - 1) - 1
  return [
    { zone: "first", n: n - 1, start: offset + 1, end: offset + half },
    { zone: "middle", n: 1, start: offset + half + 1, end: offset + half + 1, disk: n },
    { zone: "last", n: n - 1, start: offset + half + 2, end: offset + 2 * half + 1 },
  ]
}

// ---- 2進法（F2-8）-------------------------------------------------------------

/** k 手目に動く円盤の番号：k を2進法で書いたとき、右から何けた目に初めて 1 があるか */
export function diskByBinary(k: number): number {
  // k = 0 だと x % 2 === 0 が永久に真になり止まらない。無言で固まらないよう、範囲外は例外にする
  if (!Number.isInteger(k) || k < 1) throw new RangeError(`diskByBinary: k は 1 以上の整数（${k}）`)
  let d = 1
  let x = k
  while (x % 2 === 0) {
    x = x / 2
    d++
  }
  return d
}

/** k を n けたの2進法で（例：k=5, n=4 → "0101"） */
export function binaryDigits(k: number, n: number): string {
  return k.toString(2).padStart(n, "0")
}

// ---- いちばん小さい円盤①の向き（F2-9）------------------------------------------

/**
 * ①は 1 手おきに、いつも同じ向きにぐるぐる動く。
 * 向きは「n が偶数なら A→B→C→A…（移動先が B の最少手順では、偶数枚のとき A→C→B…）」のように
 * 枚数と移動先で決まるので、手順から実際に読みとる（ここが唯一の正解）。
 * 戻り値：①が動くときの [from, to] の並び（最初の2〜3回で向きがわかる）
 */
export function smallestDirection(moves: Move[]): { from: Peg; to: Peg } | null {
  const m = moves.find((x) => x.disk === 1)
  return m ? { from: m.from, to: m.to } : null
}
