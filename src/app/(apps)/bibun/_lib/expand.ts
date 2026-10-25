// ======================================================
// 文字式での確認（F2-10）と、項ごとの微分の途中式（F3-5）
//
// どちらも係数の計算だけで組み立てる（多項式なので自動で作れる）。
//
// ■ F2-10 の流れ（x² の例）
//   f(a + h) − f(a)      (a + h)² − a²      2ah + h²
//   ───────────────  =  ─────────────  =  ─────────  =  2a + h   → h → 0 で 2a
//          h                  h                h
//   分子は Σ c_k Σ_{m=1}^{k} C(k, m) a^{k−m} h^m（二項展開で a^k が消える）。
//   h で割ると h の次数が1つずつ下がり、h → 0 で h を含む項が消えて f'(a) が残る。
// ======================================================

import { MINUS, derivative, formatNumber, formatPoly, termCount } from "./polynomial"
import type { Poly } from "./polynomial"

/** a^i h^j の係数を [i][j] に持つ表（i, j = 0〜3） */
type AH = number[][]

const SUP = ["", "", "²", "³"]
const BINOM = [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1]]

function emptyAH(): AH {
  return [0, 1, 2, 3].map(() => [0, 0, 0, 0])
}

/** 分子 f(a + h) − f(a) を a, h の式に展開した係数 */
function numeratorAH(p: Poly): AH {
  const t = emptyAH()
  for (let k = 1; k <= 3; k++) {
    for (let m = 1; m <= k; m++) t[k - m][m] += p[k] * BINOM[k][m]
  }
  return t
}

/** h で割る（h の次数を1つ下げる）。分子の項はすべて h を1つ以上含む */
function divideByH(t: AH): AH {
  const out = emptyAH()
  for (let i = 0; i <= 3; i++) for (let j = 1; j <= 3; j++) out[i][j - 1] = t[i][j]
  return out
}

/**
 * a, h の式を文字列にする。h の次数の低い順、同じなら a の次数の高い順。
 * 例：2ah + h²、−2a + 4 − h
 */
function formatAH(t: AH): string {
  let out = ""
  for (let j = 0; j <= 3; j++) {
    for (let i = 3; i >= 0; i--) {
      const c = t[i][j]
      if (c === 0) continue
      const vars = (i > 0 ? `a${SUP[i]}` : "") + (j > 0 ? `h${SUP[j]}` : "")
      const abs = Math.abs(c)
      const body = vars === "" ? formatNumber(abs) : (abs === 1 ? "" : formatNumber(abs)) + vars
      if (out === "") out = c < 0 ? `${MINUS}${body}` : body
      else out += c < 0 ? ` ${MINUS} ${body}` : ` + ${body}`
    }
  }
  return out === "" ? "0" : out
}

/** 分数の1行。den がなければ分数にしない */
export interface FracLine {
  num: string
  den?: string
}

/**
 * (f(a+h) − f(a)) / h を h の式にするまでの各行（「= 」でつないで1行ずつ見せる）。
 *   [0] f(a + h) − f(a) / h
 *   [1] 関数を代入した形
 *   [2] 分子を展開した形
 *   [3] h で割った形（h の式）
 * このあと h → 0 の行は limitExpr で出す。
 */
export function expandSteps(p: Poly): FracLine[] {
  const fah = formatPoly(p, "(a + h)")
  const fa = formatPoly(p, "a")
  const multi = termCount(p) > 1
  // 2つ目の f(a) は、項が複数あるか先頭が負なら（ ）で囲む（「− −a²」を防ぐ）
  const first = multi ? `{${fah}}` : fah
  const second = multi || fa.startsWith(MINUS) ? `(${fa})` : fa
  const num = numeratorAH(p)
  return [
    { num: "f(a + h) − f(a)", den: "h" },
    { num: `${first} − ${second}`, den: "h" },
    { num: formatAH(num), den: "h" },
    { num: formatAH(divideByH(num)) },
  ]
}

/** h → 0 の行き先（f'(a) を a の式で）。例：x² → "2a" */
export function limitExpr(p: Poly): string {
  return formatPoly(derivative(p), "a")
}

// ---- F3-5：項ごとの微分 ------------------------------------------------------

/** c·x^k だけの多項式 */
function monomial(c: number, k: number): Poly {
  const t: [number, number, number, number] = [0, 0, 0, 0]
  t[k] = c
  return t
}

export interface TermStep {
  /** 微分する項（例："−3x"） */
  term: string
  /** (項)' のあとに「 = 」でつなぐ式（例：["−3 × (x)'", "−3 × 1", "−3"]） */
  chain: string[]
}

/**
 * 項ごとに微分する途中式。次数の高い順、0 の項は省く。
 *   (xⁿ)' = n xⁿ⁻¹、(c)' = 0、(k f(x))' = k f'(x) を使う。
 */
export function derivativeTermSteps(p: Poly): TermStep[] {
  const steps: TermStep[] = []
  for (let k = 3; k >= 0; k--) {
    const c = p[k]
    if (c === 0) continue
    const unit = monomial(1, k)
    const term = monomial(c, k)
    const d = formatPoly(derivative(term))
    if (k === 0) steps.push({ term: formatPoly(term), chain: ["0"] })
    else if (c === 1) steps.push({ term: formatPoly(term), chain: [d] })
    else if (c === -1) {
      // 係数 −1 は「−1 ×」と書かず、項の書き方（−x²）にそろえる
      steps.push({ term: formatPoly(term), chain: [`${MINUS}(${formatPoly(unit)})'`, d] })
    } else {
      // (x)' = 1、(x²)' = 2x、(x³)' = 3x²
      const inner = formatPoly(derivative(unit))
      steps.push({
        term: formatPoly(term),
        chain: [`${formatNumber(c)} × (${formatPoly(unit)})'`, `${formatNumber(c)} × ${inner}`, d],
      })
    }
  }
  return steps
}
