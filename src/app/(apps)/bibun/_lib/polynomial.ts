// ======================================================
// 3次以下の多項式（微分の意味がわかる）
//
// 関数はすべて係数の配列 [c0, c1, c2, c3] で持つ（f(x) = c3x³ + c2x² + c1x + c0）。
// 導関数・式の文字列化はすべて係数の計算で行い、数式処理ライブラリは使わない。
//
// ■ 差分商（平均変化率）は f(a+h) − f(a) を引き算しない
//   h が小さいと、ほぼ同じ大きさの数どうしの引き算になり、有効数字が消える（桁落ち）。
//   そこで多項式の恒等式
//     (f(a+h) − f(a)) / h = Σ_k c_k · Σ_{j=0}^{k−1} (a+h)^j · a^{k−1−j}
//   で、割り算もせずに直接求める（要件 §5）。
//   記録表の「f(a + h) − f(a)」の欄も、引き算ではなく h × 差分商 で出す。
//
// 積分アプリなど別のアプリでも使えるよう、微分のアプリ固有の事情はここに持ち込まない。
// ======================================================

import { MINUS, formatNumber } from "@/lib/graph/format"

/** 係数の配列 [c0, c1, c2, c3] */
export type Poly = readonly [number, number, number, number]

/** f(x) の値（ホーナー法） */
export function evaluate(p: Poly, x: number): number {
  return ((p[3] * x + p[2]) * x + p[1]) * x + p[0]
}

/** 平均変化率 (f(a+h) − f(a)) / h。h = 0 は呼び出し側で防ぐ */
export function diffQuotient(p: Poly, a: number, h: number): number {
  const b = a + h
  let sum = 0
  for (let k = 1; k <= 3; k++) {
    if (p[k] === 0) continue
    let s = 0
    for (let j = 0; j < k; j++) s += b ** j * a ** (k - 1 - j)
    sum += p[k] * s
  }
  return sum
}

/** f(a + h) − f(a)。引き算をせず h × 差分商 で出す（桁落ち対策） */
export function deltaY(p: Poly, a: number, h: number): number {
  return h * diffQuotient(p, a, h)
}

/** 導関数 f'(x) の係数 */
export function derivative(p: Poly): Poly {
  return [p[1], 2 * p[2], 3 * p[3], 0]
}

// ---- 表示 -----------------------------------------------------------------

const SUP = ["", "", "²", "³"]

/** 1つの項 c·v^k の文字列（符号は付けず絶対値で）。v は "x"・"a"・"(a + h)" など */
function termBody(absC: number, v: string, k: number): string {
  if (k === 0) return formatNumber(absC)
  const coef = absC === 1 ? "" : formatNumber(absC)
  return `${coef}${v}${SUP[k]}`
}

/**
 * 多項式を式の文字列にする。例：[0, 4, −1, 0] → "−x² + 4x"、[−3, 0, 0, 1] は "x³ − 3"。
 * 係数1は省略、負の項は「−」でつなぐ、0の項は省く。すべて 0 なら "0"。
 * variable を "a" や "(a + h)" にすると f(a)・f(a + h) の形で書ける。
 */
export function formatPoly(p: Poly, variable = "x"): string {
  let out = ""
  for (let k = 3; k >= 0; k--) {
    const c = p[k]
    if (c === 0) continue
    const body = termBody(Math.abs(c), variable, k)
    if (out === "") out = c < 0 ? `${MINUS}${body}` : body
    else out += c < 0 ? ` ${MINUS} ${body}` : ` + ${body}`
  }
  return out === "" ? "0" : out
}

/** 0 でない項の数 */
export function termCount(p: Poly): number {
  return p.filter((c) => c !== 0).length
}

// ---- プリセット -----------------------------------------------------------

export interface Preset {
  id: string
  poly: Poly
}

/** 関数のプリセット（要件 §3.1）。先頭が初期値 */
export const PRESETS: readonly Preset[] = [
  { id: "x2", poly: [0, 0, 1, 0] },
  { id: "x3", poly: [0, 0, 0, 1] },
  { id: "-x2+4x", poly: [0, 4, -1, 0] },
  { id: "x3-3x", poly: [0, -3, 0, 1] },
  { id: "2x2-3x+1", poly: [1, -3, 2, 0] },
]

// ---- 自分で作る関数（係数の入力） ------------------------------------------------

/** 係数の入力範囲（要件 §3.1：−10〜10 程度） */
export const COEF_LIMIT = 10

/** 入力欄の文字列（c3, c2, c1, c0 の順。画面の並びと同じ） */
export type CoefText = [string, string, string, string]

/** 入力欄の文字列 → 係数 [c0, c1, c2, c3]。空・数でない・範囲外なら null（呼ぶ側は前の関数のままにする） */
export function parseCoefs(t: CoefText): Poly | null {
  const n = t.map((s) => (s.trim() === "" ? NaN : Number(s)))
  if (n.some((v) => !Number.isFinite(v) || Math.abs(v) > COEF_LIMIT)) return null
  return [n[3], n[2], n[1], n[0]]
}
