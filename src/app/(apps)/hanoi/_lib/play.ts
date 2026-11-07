// ======================================================
// ステップ①（あそぶ）のルールと記録表
// ======================================================

import { applyMoveTo, initialPegs, minCount } from "./solve"
import type { Move, Peg, Pegs } from "./solve"

/** from の一番上の円盤を to へ動かせるか。動かせない理由も返す */
export type CanMove = { ok: true; disk: number } | { ok: false; reason: "empty" | "same" | "bigOnSmall" }

export function canMove(p: Pegs, from: Peg, to: Peg): CanMove {
  if (from === to) return { ok: false, reason: "same" }
  const top = p[from][p[from].length - 1]
  if (top === undefined) return { ok: false, reason: "empty" }
  const dest = p[to][p[to].length - 1]
  if (dest !== undefined && dest < top) return { ok: false, reason: "bigOnSmall" }
  return { ok: true, disk: top }
}

/** 動かせるときだけ動かした新しい状態と、その手を返す。置けなければ null（回数に数えない） */
export function tryMove(p: Pegs, from: Peg, to: Peg): { pegs: Pegs; move: Move } | null {
  const c = canMove(p, from, to)
  if (!c.ok) return null
  const move: Move = { disk: c.disk, from, to }
  return { pegs: applyMoveTo(p, move), move }
}

/** 全部の円盤が target の棒にあるか（n 枚） */
export function isSolved(p: Pegs, n: number, target: Peg): boolean {
  return p[target].length === n
}

/** 手の履歴から、いまの状態をつくり直す（「1つもどす」用） */
export function replay(n: number, moves: Move[]): Pegs {
  let cur = initialPegs(n)
  for (const m of moves) cur = applyMoveTo(cur, m)
  return cur
}

/** 「3手目：③を A→C」 */
export function moveLabel(k: number, m: Move): string {
  return `${k}手目：${diskMark(m.disk)}を ${m.from}→${m.to}`
}

const MARKS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"]
/** 円盤の番号の丸数字（11 以上は数字のまま） */
export function diskMark(d: number): string {
  return MARKS[d - 1] ?? String(d)
}

// ---- クリア時の評価（F1-10）-----------------------------------------------------

export type Verdict = "best" | "more"

export function verdict(n: number, count: number): Verdict {
  return count <= minCount(n) ? "best" : "more"
}

// ---- 記録表（F1-9）--------------------------------------------------------------

export type Records = Record<number, number>

/** 同じ枚数はいちばん少ない回数を残す（元は変えない） */
export function upsertRecord(rec: Records, n: number, count: number): Records {
  const old = rec[n]
  if (old !== undefined && old <= count) return rec
  return { ...rec, [n]: count }
}

/** 枚数の小さい順の行 */
export function recordRows(rec: Records): { n: number; count: number }[] {
  return Object.keys(rec)
    .map(Number)
    .sort((a, b) => a - b)
    .map((n) => ({ n, count: rec[n] }))
}
