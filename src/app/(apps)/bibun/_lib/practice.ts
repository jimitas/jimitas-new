// ======================================================
// 練習問題と自動採点（F3-6〜F3-9）
//
// ■ 問題
//   導関数：「f(x) = … の導関数 f'(x) を求めよ」
//   微分係数：「f(x) = … について、x = a における微分係数を求めよ」
//   係数は整数 −5〜5。難しさは「2次まで」「3次まで」（いちばん上の次数の係数は 0 にしない）。
//   同じ問題が続けて出ないよう、前と同じなら引き直す（プロジェクトの決まり：連続同一を防ぐ）。
//
// ■ 採点（式の文字入力はパースせず、係数ごとの入力欄で答えさせる。要件 F3-8）
//   導関数：□x² + □x + □ の各欄を、正しい係数とくらべる。空欄は 0 とみなす（0 の項は書かないため）。
//           どの項がちがうかを返す。
//   微分係数：数を1つ。
//   全角数字・全角マイナス・「−」も受けつける（タブレットの日本語入力で打たれるため）。
//
// ■ 正解数・連続正解（P2。ページの中だけで数え、保存しない）
//   1問につき1回だけ数える。まちがえたあと打ち直して正解したら数える（あきらめずに考えたことを認める）。
//   「答えを見る」を押した問題は正解にしない。
//   まちがえる・答えを見る・正解しないまま次の問題へ進むと、連続正解は 0 にもどる。
//   （2026-10-25 オーナー決定。タブを切りかえても消さない）
//
// 乱数は外から渡す（テストで決まった値を使うため）。
// ======================================================

import { derivative, evaluate } from "./polynomial"
import type { Poly } from "./polynomial"

/** いちばん上の次数（2次まで／3次まで） */
export type MaxDegree = 2 | 3

/** 0 以上 1 未満の乱数（Math.random と同じ形） */
export type Rng = () => number

export const COEF_MIN = -5
export const COEF_MAX = 5
/** 微分係数の問題の x = a の範囲 */
export const POINT_MIN = -3
export const POINT_MAX = 3

const randInt = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1))

/** 0 でない整数 −5〜5 */
const randNonZero = (rng: Rng) => {
  const v = randInt(rng, COEF_MIN, COEF_MAX - 1)
  return v >= 0 ? v + 1 : v
}

/** 問題の関数。いちばん上の次数の係数は 0 にしない */
export function randomPoly(maxDeg: MaxDegree, rng: Rng): Poly {
  const c = [0, 1, 2, 3].map((k) => (k < maxDeg ? randInt(rng, COEF_MIN, COEF_MAX) : 0))
  c[maxDeg] = randNonZero(rng)
  return [c[0], c[1], c[2], c[3]]
}

export type Problem =
  | { kind: "derivative"; poly: Poly; maxDeg: MaxDegree }
  | { kind: "coefficient"; poly: Poly; maxDeg: MaxDegree; a: number }

const same = (p: Problem, q: Problem | null) =>
  !!q && p.kind === q.kind && p.poly.every((c, i) => c === q.poly[i]) &&
  (p.kind !== "coefficient" || (q.kind === "coefficient" && p.a === q.a))

/** 新しい問題。前の問題と同じなら引き直す */
export function newProblem(kind: Problem["kind"], maxDeg: MaxDegree, rng: Rng, prev: Problem | null): Problem {
  for (let i = 0; i < 100; i++) {
    const poly = randomPoly(maxDeg, rng)
    const p: Problem = kind === "derivative"
      ? { kind, poly, maxDeg }
      : { kind, poly, maxDeg, a: randInt(rng, POINT_MIN, POINT_MAX) }
    if (!same(p, prev)) return p
  }
  throw new Error("newProblem: 前と違う問題を作れなかった")
}

// ---- 入力の読み取り -----------------------------------------------------------------

/** 全角数字・全角マイナス・「−」を半角にして数にする。空欄は null、読めなければ NaN */
export function readNumber(s: string): number | null {
  const t = s.trim()
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
    .replace(/[−－ー‐‑‒–—―﹣]/g, "-")
    .replace(/[＋]/g, "+")
    .replace(/[．]/g, ".")
  if (t === "") return null
  return /^[-+]?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN
}

// ---- 採点 ------------------------------------------------------------------------

/** 導関数の答えの欄の次数（上から）。3次までなら x²・x・定数、2次までなら x・定数 */
export function answerDegrees(maxDeg: MaxDegree): number[] {
  return maxDeg === 3 ? [2, 1, 0] : [1, 0]
}

export interface TermResult {
  /** x の次数（2, 1, 0） */
  deg: number
  expected: number
  given: number
  correct: boolean
}

export type Grade =
  | { status: "invalid"; message: string }
  | { status: "graded"; correct: boolean; terms: TermResult[] }

/**
 * 導関数の採点。inputs は answerDegrees の順（上の次数から）の入力欄の文字。
 * 空欄は 0（0 の項は書かないため）。ただし全部空欄なら「入力してね」。
 */
export function gradeDerivative(poly: Poly, maxDeg: MaxDegree, inputs: string[]): Grade {
  const degs = answerDegrees(maxDeg)
  const vals = inputs.map(readNumber)
  if (vals.every((v) => v === null)) return { status: "invalid", message: "係数を入力してください（0 の項は空欄でもかまいません）" }
  if (vals.some((v) => v !== null && Number.isNaN(v))) return { status: "invalid", message: "数（整数）を入力してください" }
  const d = derivative(poly)
  const terms = degs.map((deg, i) => {
    const given = vals[i] ?? 0
    return { deg, expected: d[deg], given, correct: given === d[deg] }
  })
  return { status: "graded", correct: terms.every((t) => t.correct), terms }
}

/** 微分係数の採点 */
export function gradeCoefficient(poly: Poly, a: number, input: string): Grade {
  const v = readNumber(input)
  if (v === null) return { status: "invalid", message: "答えを入力してください" }
  if (Number.isNaN(v)) return { status: "invalid", message: "数（整数）を入力してください" }
  const expected = evaluate(derivative(poly), a)
  return { status: "graded", correct: v === expected, terms: [{ deg: -1, expected, given: v, correct: v === expected }] }
}

// ---- 正解数・連続正解（P2） ----------------------------------------------------------

export interface Score {
  /** 正解した問題の数 */
  correct: number
  /** 連続正解 */
  streak: number
  /** いまの問題をもう数えたか（1問1回） */
  counted: boolean
  /** いまの問題で答えを見たか（見たら正解にしない） */
  peeked: boolean
}

export const INITIAL_SCORE: Score = { correct: 0, streak: 0, counted: false, peeked: false }

export type ScoreEvent = "new" | "correct" | "wrong" | "peek"

export function scoreReducer(s: Score, e: ScoreEvent): Score {
  switch (e) {
    case "new":
      // 正解しないまま次へ進んだら、連続正解は切れる
      return { ...s, streak: s.counted ? s.streak : 0, counted: false, peeked: false }
    case "correct":
      if (s.counted || s.peeked) return s
      return { correct: s.correct + 1, streak: s.streak + 1, counted: true, peeked: false }
    case "wrong":
      return s.counted ? s : { ...s, streak: 0 }
    case "peek":
      return { ...s, streak: s.counted ? s.streak : 0, peeked: true }
  }
}
