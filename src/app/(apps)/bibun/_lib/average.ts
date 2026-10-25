// ======================================================
// ステップ① 平均変化率の計算と表示
//
// 2点 A(a, f(a))・B(b, f(b)) の平均変化率 = Δy ÷ Δx = (f(b) − f(a)) ÷ (b − a)。
// Δy は f(b) − f(a) を引き算せず、差分商（polynomial.ts）から出す（ステップ②と同じ計算にそろえる）。
// ======================================================

import { A_MAX, A_MIN } from "./approach"
import { MINUS, deltaY, diffQuotient, evaluate, formatFixed, formatNumber } from "./polynomial"
import type { Poly } from "./polynomial"
import { fitView, snap } from "./viewport"
import type { View } from "./viewport"

export interface Average {
  fa: number
  fb: number
  /** Δx = b − a */
  dx: number
  /** Δy = f(b) − f(a) */
  dy: number
  /** 平均変化率 Δy ÷ Δx */
  rate: number
}

/** a ≠ b であること（呼ぶ側で防ぐ） */
export function average(p: Poly, a: number, b: number): Average {
  const h = b - a
  return { fa: evaluate(p, a), fb: evaluate(p, b), dx: h, dy: deltaY(p, a, h), rate: diffQuotient(p, a, h) }
}

/** 負の数は（ ）でくるむ（「9 − −4」と書かないため） */
function paren(v: number): string {
  const s = formatNumber(v)
  return s.startsWith(MINUS) ? `(${s})` : s
}

/**
 * 平均変化率の値。割り切れない値（1/3 など）は小数第3位までにして approx = true。
 * 表示では「＝」の代わりに「≒」を使う（「＝ ≒ 0.333」と記号を2つ並べない）。
 */
export function rateValue(v: number): { text: string; approx: boolean } {
  const exact = formatNumber(v)
  const short = formatFixed(v, 3)
  const same = Number(exact.replace(MINUS, "-")) === Number(short.replace(MINUS, "-"))
  return same ? { text: exact, approx: false } : { text: short, approx: true }
}

/** 「5」「≒ 0.333」の形（グラフ上のラベル用） */
export function formatRate(v: number): string {
  const r = rateValue(v)
  return r.approx ? `≒ ${r.text}` : r.text
}

/** 「＝ 5」「≒ 0.333」の形（式の続き用） */
export function eqRate(v: number): string {
  const r = rateValue(v)
  return `${r.approx ? "≒" : "="} ${r.text}`
}

/**
 * 途中式（F1-4）。例：a = 2, b = 3（x²）→ "(9 − 4) ÷ (3 − 2) = 5 ÷ 1 = 5"
 * a = b（Δx = 0）では作らずエラーにする。差分商は割り算をしないので h = 0 でも値が出てしまい、
 * 「0 ÷ 0 = 4」のような、それらしく見える誤った式になるため（2026-10-25 レビュー指摘）。
 */
export function averageExpr(p: Poly, a: number, b: number): string {
  if (a === b) throw new Error("averageExpr: a = b（Δx = 0）では平均変化率は求められない")
  const { fa, fb, dx, dy, rate } = average(p, a, b)
  return `(${formatNumber(fb)} − ${paren(fa)}) ÷ (${formatNumber(b)} − ${paren(a)}) = ${formatNumber(dy)} ÷ ${paren(dx)} ${eqRate(rate)}`
}

// ---- 点を動かす ---------------------------------------------------------------------

/** 点を動かす刻み。範囲は ② と同じ A_MIN〜A_MAX（② に a を引き継ぐため、そろえておく） */
export const POINT_STEP = 0.1

const toGrid = (x: number) => snap(Math.min(A_MAX, Math.max(A_MIN, x)), POINT_STEP)

export type Which = "a" | "b"

/**
 * 点を x へ動かした結果。範囲に収めて 0.1 刻みにそろえる。
 * もう一方の点と重なるときは null（動かさない。呼ぶ側はメッセージを出す）。
 */
export function movePoint(a: number, b: number, which: Which, x: number): { a: number; b: number } | null {
  const v = toGrid(x)
  const next = which === "a" ? { a: v, b } : { a, b: v }
  return next.a === next.b ? null : next
}

/**
 * キーで 0.1 ずつ動かす。もう一方の点に重なるときは、その向こうへ1つ跳ばす
 * （重なる手前で止まって、向こう側へ越えられなくなるのを防ぐ）。端で越えられないときは null。
 */
export function stepPoint(a: number, b: number, which: Which, dir: 1 | -1): { a: number; b: number } | null {
  const cur = which === "a" ? a : b
  const r = movePoint(a, b, which, cur + POINT_STEP * dir)
  if (r && (which === "a" ? r.a : r.b) !== cur) return r
  const jump = movePoint(a, b, which, cur + 2 * POINT_STEP * dir)
  return jump && (which === "a" ? jump.a : jump.b) !== cur ? jump : null
}

/**
 * ② から a を受け取ったときに b と重なっていたら、b を1つずらす（右、端なら左）。
 */
export function separate(a: number, b: number): number {
  if (a !== b) return b
  return a + POINT_STEP <= A_MAX ? toGrid(a + POINT_STEP) : toGrid(a - POINT_STEP)
}

/**
 * 2点が両方入る表示。横は2点の外側に 2 ずつ（最低でも幅 6）、縦は2点のまわりの曲線が収まるように。
 * 点が画面の外に出たときだけ作り直す（毎回作り直すと縮尺が変わり続け、傾きを見比べにくい。
 * ドラッグ中は作り直さず、指を離したときに確かめる。指の下で座標がずれて点が逃げるため）。
 */
export function twoPointView(p: Poly, a: number, b: number): View {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const c = (lo + hi) / 2
  const half = Math.max(3, (hi - lo) / 2 + 2)
  const v = fitView((x) => evaluate(p, x), lo - 0.5, hi + 0.5, 0.2)
  return { ...v, xMin: c - half, xMax: c + half }
}
