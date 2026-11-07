// ======================================================
// ステップ④ 見積もりパネル（F4-5）：2¹⁰ ≒ 1000 を使った概算
//   2⁶⁴ = 2⁴ × (2¹⁰)⁶ ≒ 16 × 1000⁶ = 1.6 × 10¹⁹
//   1年 ≒ 3200万秒 → 約5000億年
// 正確な値（約5845億年）とくらべて「見積もりでもだいたい合う」ことを見せる。
// ======================================================

import { yearsFor, minMovesBig } from "./bignum"

/** 見積もりの値（64枚・1手1秒） */
export const ESTIMATE = {
  /** 2⁶⁴ ≒ 1.6 × 10¹⁹ */
  movesMantissa: 1.6,
  movesExp: 19,
  /** 1年 ≒ 3200万秒 */
  secondsPerYear: 32_000_000,
  /** 1.6×10¹⁹ ÷ 3.2×10⁷ = 5×10¹¹ 年 */
  years: (1.6 * 10 ** 19) / 32_000_000,
}

/** 正確な年数（64枚・1手1秒） */
export function exactYears64(): number {
  return yearsFor(minMovesBig(64), 1)
}

/** 見積もりは正確な値の何割か（0.85 くらい） */
export function estimateRatio(): number {
  return ESTIMATE.years / exactYears64()
}
