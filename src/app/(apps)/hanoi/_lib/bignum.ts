// ======================================================
// ステップ④：大きな数（BigInt）・日本語の単位・年数（要件 §5.2）
//
// 2⁶⁴−1 は Number では正確に表せないので BigInt で持つ。年数だけは有効数字3〜4けたで足りるので Number に変換する。
// ======================================================

/** 最少回数 2ⁿ − 1（BigInt） */
export function minMovesBig(n: number): bigint {
  return (1n << BigInt(n)) - 1n
}

/** 3けたごとのカンマ */
export function withCommas(x: bigint): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

const UNITS = ["", "万", "億", "兆", "京", "垓"]

/** 日本語の大きな数（例：18446744073709551615 → 1844京6744兆737億955万1615）。0 のグループは飛ばす */
export function toJapaneseUnits(x: bigint): string {
  if (x === 0n) return "0"
  let rest = x
  const parts: string[] = []
  let i = 0
  while (rest > 0n) {
    const g = rest % 10000n
    rest = rest / 10000n
    if (g > 0n) parts.unshift(`${g}${UNITS[i] ?? ""}`)
    i++
  }
  return parts.join("")
}

/** 1年（365.25日）の秒数 */
export const SECONDS_PER_YEAR = 31_557_600

/** 1手 secPerMove 秒でかかる年数 */
export function yearsFor(moves: bigint, secPerMove: number): number {
  return (Number(moves) * secPerMove) / SECONDS_PER_YEAR
}

/** 年数を読みやすく（約5845億年／約12万年／約3.5年／約2日…）。ある程度大きいときは有効数字4けた */
export function formatYears(years: number): string {
  if (years < 1 / 365.25 / 24) {
    const sec = years * SECONDS_PER_YEAR
    return `約${trim(sec)}秒`
  }
  if (years < 1 / 365.25) return `約${trim(years * 365.25 * 24)}時間`
  if (years < 1) return `約${trim(years * 365.25)}日`
  if (years < 10000) return `約${trim(years)}年`
  const big = BigInt(Math.round(years))
  return `約${toJapaneseUnitsRounded(big)}年`
}

/** 先頭の2グループだけ残す（例：5845億2千万… → 5845億）。有効数字4けた前後 */
function toJapaneseUnitsRounded(x: bigint): string {
  const full = toJapaneseUnits(x)
  // 先頭グループ（○億・○兆 など）だけにする
  const m = full.match(/^\d+[万億兆京垓]/)
  return m ? m[0] : full
}

function trim(x: number): string {
  return Number(x.toPrecision(3)).toString()
}

/** 比較するもの（年） */
export const COMPARE = [
  { id: "universe", label: "宇宙の年齢", years: 13_800_000_000 },
  { id: "earth", label: "地球の年齢", years: 4_600_000_000 },
  { id: "life", label: "人の一生", years: 80 },
] as const

/** years は宇宙の年齢の何倍か */
export function timesOfUniverse(years: number): number {
  return years / COMPARE[0].years
}
