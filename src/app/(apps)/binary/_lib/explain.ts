// ======================================================
// 「変換のしかた」解説用のデータを作る純関数
//
// 画面（JSX）は _components/ 側が持ち、ここは
// 「何を表示するか」の計算だけを受け持つ。jest で固定する。
// ======================================================

import type { Base } from "./converter"

/** 解説を出す上限（8ビット）。超えたら解説パネルは案内文だけにする */
export const EXPLAIN_MAX = 255

/** この数の解説を出すか（0〜255） */
export function canExplain(decimal: number): boolean {
  return Number.isInteger(decimal) && decimal >= 0 && decimal <= EXPLAIN_MAX
}

/** 解説の種類（変換元×変換先 12通りを5種類に振り分ける） */
export type ExplainKind =
  | "division"   // 10 → 2/8/16 : わり算の筆算（すだれ算）
  | "placeValue" // 2/8/16 → 10 : 位取りの式
  | "group"      // 2 → 8/16    : ビットを3つ/4つずつまとめる
  | "expand"     // 8/16 → 2    : 1桁を3ビット/4ビットに広げる
  | "via2"       // 8 ⇔ 16      : 2進数を経由する2段の図解

export function explainKind(from: Base, to: Base): ExplainKind {
  if (from === to) throw new Error(`同じ進数どうしの解説はない: ${from}`)
  if (from === 10) return "division"
  if (to === 10) return "placeValue"
  if (from === 2) return "group"
  if (to === 2) return "expand"
  return "via2"
}

/** 2進数1桁ぶんのビット数（8進→3、16進→4） */
export function bitsPerDigit(base: 8 | 16): 3 | 4 {
  return base === 8 ? 3 : 4
}

// ------------------------------------------------------
// すだれ算
// ------------------------------------------------------
export interface DivisionStep {
  dividend: number  // わられる数
  quotient: number  // 商（次の段のわられる数）
  remainder: number // 余り
}

/**
 * 商が0になるまで base でわり続けた各段を返す（上の段から順）。
 * 0 のときは割る段がないので空配列（画面側で「0はそのまま0」と出す）。
 */
export function divisionSteps(decimal: number, base: Base): DivisionStep[] {
  const steps: DivisionStep[] = []
  let n = decimal
  while (n > 0) {
    steps.push({ dividend: n, quotient: Math.floor(n / base), remainder: n % base })
    n = Math.floor(n / base)
  }
  return steps
}

export interface LadderRow {
  value: number            // この行に書く数（わられる数／最後の行は商の 0）
  remainder: number | null // この行の右に書くあまり（1行目は無し）
}

/**
 * すだれ算の各行。あまりは「わった次の行」の右に書くので1行ずれる。
 *   2 ) 10
 *   2 )  5 … 0
 *        …
 *        0 … 1
 */
export function ladderRows(steps: DivisionStep[]): LadderRow[] {
  return [...steps.map(s => s.dividend), 0].map((value, row) => ({
    value,
    remainder: row >= 1 ? steps[row - 1].remainder : null,
  }))
}

/** あまりを下から上へ読んだ答え（16進は A〜F） */
export function readRemainders(steps: DivisionStep[]): string {
  return steps.map(s => s.remainder.toString(16).toUpperCase()).reverse().join("")
}

// ------------------------------------------------------
// 位取り
// ------------------------------------------------------
export interface PlaceValueTerm {
  digit: string    // 表示上の数字（"A" など）
  value: number    // その数字の値（A → 10）
  exponent: number // 何乗の位か
  weight: number   // 位の重み（base ** exponent）
  product: number  // value × weight
}

/** 左の桁から順に、各桁の「値 × 重み」を返す */
export function placeValueTerms(str: string, base: Base): PlaceValueTerm[] {
  const digits = str.toUpperCase().split("")
  return digits.map((digit, i) => {
    const exponent = digits.length - 1 - i
    const value = parseInt(digit, 16)
    const weight = base ** exponent
    return { digit, value, exponent, weight, product: value * weight }
  })
}

// ------------------------------------------------------
// ビットのまとまり
// ------------------------------------------------------
export interface BitGroup {
  bits: string   // まとまりのビット列（左の0補いを含む）
  padded: number // 左に補った0の数（画面で薄く表示する）
  digit: string  // このまとまりが表す1桁（大文字）
}

/** 2進数を右から size 桁ずつ区切る。戻り値は左のまとまりから順 */
export function groupBits(binary: string, size: 3 | 4): BitGroup[] {
  const padded = (size - (binary.length % size)) % size
  const full = "0".repeat(padded) + binary
  const groups: BitGroup[] = []
  for (let i = 0; i < full.length; i += size) {
    const bits = full.slice(i, i + size)
    groups.push({
      bits,
      padded: i === 0 ? padded : 0,
      digit: parseInt(bits, 2).toString(16).toUpperCase(),
    })
  }
  return groups
}

export interface DigitBits {
  digit: string // 元の1桁（大文字）
  bits: string  // 3ビット/4ビットに広げたもの（0補い済み）
  faint: number // 左はしで取りのぞく0の数（いちばん左の桁だけ。数が0なら最後の1けたは残す）
}

/** 8/16進数を1桁ずつビット列に広げる */
export function expandDigits(str: string, base: 8 | 16): DigitBits[] {
  const size = bitsPerDigit(base)
  return str.toUpperCase().split("").map((digit, i) => {
    const bits = parseInt(digit, 16).toString(2).padStart(size, "0")
    const leadingZeros = bits.search(/1|$/)
    return { digit, bits, faint: i === 0 ? Math.min(leadingZeros, size - 1) : 0 }
  })
}
