// ======================================================
// h を「1段ずつ」小さくする段と、なめらかな動き
//
// ■ 段：h = 1 → 0.5 → 0.1 → 0.01 → 0.001（左からは符号を逆に）
//   授業スライドと同じ値。微分（平均変化率）でも積分アプリ（増えた面積 ÷ のばした量）でも同じ段を使う。
//
// 微分の意味がわかる（bibun）の approach.ts から移した（2026-10-25、積分アプリと共有するため）。
// 別のアプリでも使えるよう、アプリ固有の事情は持ち込まない。
// ======================================================

/** h の段（正の向き）。左からはこれに −1 をかける */
export const H_STEPS = [1, 0.5, 0.1, 0.01, 0.001] as const

/** 右から（h > 0）＝ 1、左から（h < 0）＝ −1 */
export type Side = 1 | -1

/** 「1段ずつ」で次の段へ動く長さ（ミリ秒） */
export const STEP_MS = 500

export function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t))
}

/**
 * 「1段ずつ」を押したときの行き先。count はこれまでに埋めた行数（0〜5）、h はいまの h。
 *   target    次の段の h（side × H_STEPS[count]）
 *   nextCount 押したあとの行数（count + 1）
 *   animate   動かすか。1回目（h = ±1 にいる）や、スライダーで反対向きにしていたときは動かさずにその段へ
 * 5段とも埋まっていれば null（押せない）。
 * 例（微分の意味がわかるの受け入れ基準1。x²・a = 2）：初期状態（h = 1）で4回押すと 5 → 4.5 → 4.1 → 4.01、5回目で 4.001。
 */
export function nextStep(count: number, side: Side, h: number): { target: number; nextCount: number; animate: boolean } | null {
  if (count >= H_STEPS.length) return null
  const target = side * H_STEPS[count]
  const animate = Math.sign(h) === side && Math.abs(h - target) >= 1e-12
  return { target, nextCount: count + 1, animate }
}

/** なめらかに動き出して止まる（0〜1 → 0〜1） */
export function easeInOut(u: number): number {
  const x = clamp01(u)
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

/**
 * 「1段ずつ」の途中の h。from から to へ、|h| の対数の上でイージングしながら動かす。
 * 0.1 → 0.01 も 1 → 0.5 も同じくらいの見え方で動く。from と to は同じ符号であること。
 */
export function stepH(from: number, to: number, u: number): number {
  const sign = Math.sign(to)
  const la = Math.log(Math.abs(from))
  const lb = Math.log(Math.abs(to))
  return sign * Math.exp(la + (lb - la) * easeInOut(u))
}
