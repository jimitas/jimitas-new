// ======================================================
// さいころの散らばり — 班のデータの入力（セクション4）
//
// 入力欄は10個。1つめの欄に「4,7,9,…」のように区切って貼り付けたときは
// splitPasted で10個の欄に配る。
//   A方式：2〜12 の整数
//   B方式：2〜12 の偶数（1個の目を2倍するので奇数は出ない）
// ======================================================

import type { Method } from "./dice"

export const GROUP_SIZE = 10

/** 区切り（カンマ・読点・空白）で分かれていたら配列にする。1個だけなら null */
export function splitPasted(text: string): string[] | null {
  const parts = text.split(/[,，、\s]+/).filter((s) => s !== "")
  return parts.length > 1 ? parts : null
}

/**
 * 貼り付けた値を、start 番目の欄から順に配る。
 * 入りきらなかった値は捨てるが、黙って捨てないよう dropped で返す（画面で知らせる）。
 */
export function distribute(cells: readonly string[], start: number, parts: readonly string[]): { cells: string[]; dropped: string[] } {
  const next = cells.slice()
  const room = Math.max(0, cells.length - start)
  parts.slice(0, room).forEach((p, k) => (next[start + k] = p))
  return { cells: next, dropped: parts.slice(room) }
}

/** 全角数字を半角にする（タブレットの日本語入力で全角が入ることがあるため） */
function toHalfWidth(s: string): string {
  return s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
}

/** 1欄ぶんの判定。正しければ数、空なら null、間違いなら文言 */
export function checkCell(raw: string, method: Method): { value: number } | { error: string } | null {
  const s = toHalfWidth(raw.trim())
  if (s === "") return null
  if (!/^\d+$/.test(s)) return { error: "整数で入れてください" }
  const v = Number(s)
  if (v < 2 || v > 12) return { error: "2〜12 で入れてください" }
  if (method === "B" && v % 2 === 1) return { error: "B方式は偶数だけです" }
  return { value: v }
}

export interface GroupResult {
  /** 10個すべて正しく入っていれば得点の配列、そうでなければ null */
  values: number[] | null
  /** 欄ごとの間違い（なければ空文字） */
  errors: string[]
  /** 入っている（空でない）欄の数 */
  filled: number
}

export function readGroup(cells: readonly string[], method: Method): GroupResult {
  const errors: string[] = []
  const values: number[] = []
  let filled = 0
  for (const raw of cells) {
    const r = checkCell(raw, method)
    if (r === null) {
      errors.push("")
      continue
    }
    filled++
    if ("error" in r) errors.push(r.error)
    else {
      errors.push("")
      values.push(r.value)
    }
  }
  const ok = values.length === GROUP_SIZE && cells.length === GROUP_SIZE
  return { values: ok ? values : null, errors, filled }
}
