// ======================================================
// 数値の表示用の書式（座標平面の目盛り・数値パネル・記録表）
//
// 微分の意味がわかる（bibun）から移した（2026-10-25、積分アプリと共有するため）。
// 別のアプリでも使えるよう、アプリ固有の事情は持ち込まない。
// ======================================================

/** 表示用のマイナス記号（ハイフンではなく U+2212） */
export const MINUS = "−"

/** 有効数字（桁）。h = 0.001 でも 4.001 のように出せる長さにしてある */
const SIG_DIGITS = 10

/**
 * 数値を表示用の文字列にする。有効数字で丸めて末尾の 0 を落とす（4.0100 → 4.01）。
 * 浮動小数の誤差（4.1000000000000005 など）もここで消える。負の数は「−」。
 */
export function formatNumber(v: number): string {
  if (!Number.isFinite(v)) return "—"
  const r = Number(v.toPrecision(SIG_DIGITS))
  if (r === 0) return "0" // −0 も "0" にする
  // toString は 1e-7 以下で指数表記になるので、その場合は小数で書く
  let s = r.toString()
  if (s.includes("e")) s = r.toFixed(20).replace(/0+$/, "").replace(/\.$/, "")
  return s.replace("-", MINUS)
}

/**
 * 小数第 d 位までに丸めて、末尾の 0 を落とす（4.0012 → d=3 で 4.001）。
 * アニメ中の h や平均変化率のように、連続して変わる値の表示に使う
 * （formatNumber の10桁だと 0.001234567890 のように長くなり、狭い画面ではみ出すため）。
 */
export function formatFixed(v: number, d: number): string {
  if (!Number.isFinite(v)) return "—"
  const r = Number(v.toFixed(d))
  return formatNumber(r)
}
