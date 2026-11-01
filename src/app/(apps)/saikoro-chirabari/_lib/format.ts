// ======================================================
// さいころの散らばり — 数の表示
//
//   平均・分散・標準偏差：小数第2位（四捨五入）
//   偏差：小数第1位（授業の手計算と同じ桁）
//
// toFixed は 2.675 → "2.67" のように2進数の誤差で切り捨て側に転ぶことがあるので使わない。
// 負の数も「絶対値を四捨五入して符号を戻す」（−0.25 → −0.3）。
// −0.0 は出さない（偏差の合計が「−0.0」に見えると授業で混乱するため）。
// ======================================================

export function roundHalfUp(x: number, digits: number): number {
  const p = 10 ** digits
  const r = (Math.sign(x) * Math.round(Math.abs(x) * p + 1e-9)) / p
  return r === 0 ? 0 : r // −0 を 0 にそろえる
}

export function fixed(x: number, digits: number): string {
  if (!Number.isFinite(x)) return "―"
  return roundHalfUp(x, digits).toFixed(digits)
}

/** 平均・分散・標準偏差（小数第2位） */
export const fmt2 = (x: number) => fixed(x, 2)

/** 偏差（小数第1位）。正の数には + を付ける */
export function fmtDev(x: number): string {
  const s = fixed(x, 1)
  return Number.isFinite(x) && roundHalfUp(x, 1) > 0 ? `+${s}` : s
}

/** 回数（1,000 のような3桁区切り） */
export const fmtInt = (n: number) => n.toLocaleString("ja-JP")
