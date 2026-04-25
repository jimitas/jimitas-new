// 分数ユーティリティ
// 元: bunsuu.js
// 約分・通分・加減乗除の純粋関数 + HTML生成ヘルパー

/** 最大公約数を求める */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/** 約分する → [分子, 分母] */
export function reduceFraction(numerator: number, denominator: number): [number, number] {
  const d = gcd(Math.abs(numerator), Math.abs(denominator))
  return [numerator / d, denominator / d]
}

/** 分数の足し算（約分なし） → [分子, 分母] */
export function bunsuAdd(n1: number, d1: number, n2: number, d2: number): [number, number] {
  return [n1 * d2 + n2 * d1, d1 * d2]
}

/** 分数の引き算（約分なし） → [分子, 分母] */
export function bunsuMinus(n1: number, d1: number, n2: number, d2: number): [number, number] {
  return [n1 * d2 - n2 * d1, d1 * d2]
}

/** 分数のかけ算（帯分数対応・約分あり） → [分子, 分母] */
export function bunsuMultiplication(
  tai1: number, n1: number, d1: number,
  tai2: number, n2: number, d2: number
): [number, number] {
  // 帯分数を仮分数に変換
  const num1 = tai1 * d1 + n1
  const num2 = tai2 * d2 + n2
  const resultN = num1 * num2
  const resultD = d1 * d2
  return reduceFraction(resultN, resultD)
}

/** 分数のわり算（帯分数対応・約分あり） → [分子, 分母] */
export function bunsuDivision(
  tai1: number, n1: number, d1: number,
  tai2: number, n2: number, d2: number
): [number, number] {
  const num1 = tai1 * d1 + n1
  const num2 = tai2 * d2 + n2
  const resultN = num1 * d2
  const resultD = d1 * num2
  return reduceFraction(resultN, resultD)
}

// -------------------------------------------------------
// HTML生成ヘルパー（印刷用）
// CustomProblemDisplay が dangerouslySetInnerHTML で描画する
// -------------------------------------------------------

/** 分数のHTML（分子/分母を縦に並べる） */
export function fracHtml(numerator: number, denominator: number): string {
  return `<span class="jf"><span class="jf-n">${numerator}</span><span class="jf-d">${denominator}</span></span>`
}

/** 帯分数のHTML（整数部 + 分数） */
export function mixedFracHtml(whole: number, numerator: number, denominator: number): string {
  return `<span class="jf-whole">${whole}</span>${fracHtml(numerator, denominator)}`
}

/** 答え用の分数テキスト（テキスト形式） */
export function fracText(numerator: number, denominator: number): string {
  if (denominator === 1) return `${numerator}`
  return `${numerator}/${denominator}`
}
