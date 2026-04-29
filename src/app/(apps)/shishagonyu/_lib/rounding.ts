// 四捨五入ユーティリティ

/**
 * num を targetDigit の位で四捨五入する
 * targetDigit=2 → 十の位まで（一の位で判断し、十の位のがい数）
 * targetDigit=3 → 百の位まで（十の位で判断し、百の位のがい数）
 * ※ shishagonyu では minTD=2 のため targetDigit=1 は使わない
 */
export function roundToDigit(num: number, targetDigit: number): number {
  const factor = Math.pow(10, targetDigit - 1)
  return Math.round(num / factor) * factor
}
