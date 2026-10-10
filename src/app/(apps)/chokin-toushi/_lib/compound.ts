// ======================================================
// 積み立て複利の計算・入力の検証・表示用の文言
//
// 毎月のおわりに積立額を入れ、それまでの残高には月利 r の利息がつく（月複利）。
//   残高[m] = 残高[m−1] × (1 + r) + 毎月の額
// n か月後の残高は等比数列の和になり、公式どおり
//   毎月の額 × ((1 + r)^n − 1) ÷ r
// と一致する（r = 0 のときは 毎月の額 × n）。
//
// 文言はここに置いて jest で固定する。利率を自由に変えられるので、
// 「こんなに増える！」のような固定の言い回しは、条件しだいで嘘になるため。
// ======================================================

/** 利率（年利 %）の範囲と刻み。貯蓄・投資とも同じ */
export const RATE_MIN = 0
export const RATE_MAX = 15
export const RATE_STEP = 0.1

/** 年数の範囲 */
export const YEARS_MIN = 1
export const YEARS_MAX = 50

/** 毎月の積立額（万円）の範囲 */
export const AMOUNT_MIN = 0.1
export const AMOUNT_MAX = 100

/** グラフの真下に1つだけ置く注意書き（文言は 2026-10-10 オーナー確定） */
export const DISCLAIMER =
  "※ このグラフは、毎年同じ割合で増えると仮定した計算です。" +
  "実際の投資では、値上がりや値下がりをくり返しながら変動し、" +
  "元本（積み立てた金額の合計）を下回ることもあります。"

/** 注意書きの次の行に置く一文（2026-10-10 オーナー了承。レビュー指摘3への対応） */
export const TAX_NOTE = "※ 税金や手数料は考えていない計算です。"

/** グラフを描き終えるまでの時間（ミリ秒）。年数によらず同じ */
export const REVEAL_MS = 4000

/** 利率を 0〜15・0.1 刻みにそろえる（スライダーの 5.1000000001 などをつぶす） */
export function normalizeRate(pct: number): number {
  if (!Number.isFinite(pct)) return RATE_MIN
  const clamped = Math.min(RATE_MAX, Math.max(RATE_MIN, pct))
  return Math.round(clamped * 10) / 10
}

/** 年利 % → 月利（小数） */
export function monthlyRate(annualPct: number): number {
  return annualPct / 100 / 12
}

/**
 * 月ごとの残高。長さは 月数 + 1 で、[0] は 0 円（積み立て開始前）。
 * グラフを 0年 から描くため、元の版にはなかった [0] を足している。
 */
export function balances(monthlyYen: number, years: number, annualPct: number): number[] {
  const r = monthlyRate(annualPct)
  const months = years * 12
  const out = [0]
  let b = 0
  for (let m = 1; m <= months; m++) {
    b = b * (1 + r) + monthlyYen
    out.push(b)
  }
  return out
}

/** 公式 ((1 + r)^n − 1) ÷ r。r = 0 なら n（極限値） */
export function annuityFactor(r: number, months: number): number {
  if (r === 0) return months
  return (Math.pow(1 + r, months) - 1) / r
}

// ---- 入力の検証 --------------------------------------------------------------

export interface InputForm {
  /** 毎月の積立額（万円）。入力途中を壊さないため文字列のまま持つ */
  amount: string
  years: number
  savingPct: number
  investPct: number
}

export interface Params {
  monthlyYen: number
  years: number
  savingPct: number
  investPct: number
}

/** 入力を検証する。エラーがあれば errors に文を入れ、params は null */
export function readInput(form: InputForm): { errors: string[]; params: Params | null } {
  const errors: string[] = []
  const amount = Number(form.amount)
  if (form.amount.trim() === "" || !Number.isFinite(amount)) {
    errors.push("毎月の積立額を数字で入れてください。")
  } else if (amount < AMOUNT_MIN || amount > AMOUNT_MAX) {
    errors.push(`毎月の積立額は ${AMOUNT_MIN}〜${AMOUNT_MAX} 万円で入れてください。`)
  }
  if (!Number.isInteger(form.years) || form.years < YEARS_MIN || form.years > YEARS_MAX) {
    errors.push(`年数は ${YEARS_MIN}〜${YEARS_MAX} 年です。`)
  }
  if (errors.length > 0) return { errors, params: null }
  return {
    errors,
    params: {
      // 0.1 万円 = 1000 円。小数の誤差で 29999.999… にならないよう円で丸める
      monthlyYen: Math.round(amount * 10000),
      years: form.years,
      savingPct: normalizeRate(form.savingPct),
      investPct: normalizeRate(form.investPct),
    },
  }
}

// ---- 表示用の整形 --------------------------------------------------------------

/** ¥12,332,827 の形 */
export function fmtYen(v: number): string {
  return "¥" + Math.round(v).toLocaleString("ja-JP")
}

/** 5 → "5"、0.3 → "0.3"（小数1桁まで。5.0 とは書かない） */
export function fmtPct(pct: number): string {
  return String(Math.round(pct * 10) / 10)
}

/**
 * 月利の表示。有効数字6桁（0.00416667 / 0.00025 / 0.0000833333）。
 * 4桁（0.004167）だと、50年（600か月）で代入過程の係数が 0.26 ずれる（金額で約8千円）。
 */
export function fmtRate(r: number): string {
  if (r === 0) return "0"
  return String(Number(r.toPrecision(6)))
}

/** 大きな金額を「万円」「億円」で短く（グラフの目盛り用） */
/**
 * (1 + 月利)^月数 の表示。小数6桁。
 * 3桁だと、表示どおり (値 − 1) ÷ 月利 を電卓で計算したとき次の行の係数と合わない
 * （0.3%×20年で 248.0 と 247.3。月利が小さいほど 0.001 の丸めが大きくひびく）。
 */
export function fmtPow(r: number, months: number): string {
  return Math.pow(1 + r, months).toFixed(6)
}

/** ((1 + r)^n − 1) ÷ r の表示。小数1桁 */
export function fmtFactor(r: number, months: number): string {
  return annuityFactor(r, months).toFixed(1)
}

/** まとめカードの差額の向き */
export function diffLabel(saving: number, invest: number): string {
  const diff = Math.round(invest) - Math.round(saving)
  return diff > 0 ? "投資の方が多い" : diff < 0 ? "貯蓄の方が多い" : "同じ"
}

export function fmtManOku(v: number): string {
  if (v >= 1e8) return `${Number((v / 1e8).toPrecision(3)).toLocaleString("ja-JP")}億円`
  if (v >= 1e4) return `${Math.round(v / 1e4).toLocaleString("ja-JP")}万円`
  return `${Math.round(v).toLocaleString("ja-JP")}円`
}

// ---- 文言（条件で切り替える） -------------------------------------------------

/**
 * 元本に対してどれだけ増えたか。
 * 元の版の「も増加！」「しか増えない...」は、利率を入れかえると逆になるので、
 * 事実だけを書く形にした。
 */
export function growthNote(principal: number, total: number, pct: number): string {
  const gain = total - principal
  // 「増えたかどうか」ではなく利率そのもので分ける（金額の丸めに頼らない）
  if (pct === 0) return `利率が 0% なので利息はつかず、元本 ${fmtYen(principal)} のままです。`
  const ratio = (gain / principal) * 100
  return `元本 ${fmtYen(principal)} に対して、増えた分は ${fmtYen(gain)}（元本の ${ratio.toFixed(1)}%）です。`
}

/**
 * 貯蓄と投資の比較。大小が逆・同じのときも正しい文になるようにする。
 * 「この利率が続いたと仮定すると」を必ず付ける。注意書きから離れた場所に出るので、
 * ここだけ読んでも「投資は必ず多くなる」と受け取られないようにするため。
 */
export function comparisonNote(years: number, saving: number, invest: number): string {
  const diff = Math.round(invest) - Math.round(saving)
  if (diff > 0) {
    return `この利率が続いたと仮定すると、同じ金額を積み立てても、${years}年後には投資の方が ${fmtYen(diff)} 多くなります。`
  }
  if (diff < 0) {
    return `この利率が続いたと仮定すると、同じ金額を積み立てても、${years}年後には貯蓄の方が ${fmtYen(-diff)} 多くなります。`
  }
  return `2つの利率が同じなので、${years}年後の資産も同じになります。`
}

// ---- グラフ ---------------------------------------------------------------------

/** 縦軸の目盛り。1・2・5 × 10^k の刻みで、0 から max を超えるところまで */
export function yTicks(max: number): number[] {
  if (!(max > 0)) return [0]
  const rough = max / 4
  const pow = Math.pow(10, Math.floor(Math.log10(rough)))
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow
  const ticks = [0]
  while (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

/** 横軸の目盛り（年）。年数に応じて 1・5・10 年ごと。最後の年は必ず入れる */
export function xTicks(years: number): number[] {
  const step = years <= 10 ? 1 : years <= 30 ? 5 : 10
  const ticks: number[] = []
  for (let y = 0; y <= years; y += step) ticks.push(y)
  if (ticks[ticks.length - 1] !== years) {
    // 最後の目盛りと近すぎると文字が重なるので、1つ前を外す
    if (years - ticks[ticks.length - 1] < step / 2) ticks.pop()
    ticks.push(years)
  }
  return ticks
}

/**
 * SVG polyline 用の座標。viewBox は 0 0 100 H（下が 0 円、上が top 円）。
 * totalMonths を渡すと、途中までの series でも横軸は全体の月数で決める（アニメ用）。
 */
export function toPoints(series: number[], top: number, H: number, totalMonths: number = series.length - 1): string {
  const n = totalMonths
  return series
    .map((v, i) => `${((i / n) * 100).toFixed(3)},${(H - (v / top) * H).toFixed(3)}`)
    .join(" ")
}

// ---- 表示アニメ ---------------------------------------------------------------

/**
 * アニメの経過時間 → 進み具合（0〜1）。
 * 時間に対して一定の速さで進める。月ごとに同じ時間で描くので、
 * 金額の増え方の加速（指数関数のカーブ）がそのまま見える。
 */
export function revealProgress(elapsedMs: number, durationMs: number = REVEAL_MS): number {
  if (!(durationMs > 0)) return 1
  return Math.min(1, Math.max(0, elapsedMs / durationMs))
}

/**
 * 進み具合 → 何か月目まで描くか。
 * 月数ではなく割合で持つので、再生中に年数を変えても途中から続けられる。
 */
export function drawnMonth(progress: number, months: number): number {
  return Math.min(months, Math.max(0, Math.floor(progress * months)))
}

/** 2本の線のあいだを塗る多角形（投資の線 → 貯蓄の線を逆向き） */
export function bandPoints(upper: number[], lower: number[], top: number, H: number, totalMonths: number): string {
  const xy = (v: number, i: number) => `${((i / totalMonths) * 100).toFixed(3)},${(H - (v / top) * H).toFixed(3)}`
  const a = upper.map(xy)
  const b = lower.map(xy).reverse()
  return [...a, ...b].join(" ")
}

/** 月数 → 「20年後」「3年5か月後」。アニメ中に線の先頭の時点を出すため */
export function fmtElapsed(month: number): string {
  const y = Math.floor(month / 12)
  const mm = month % 12
  if (mm === 0) return `${y}年後`
  return y === 0 ? `${mm}か月後` : `${y}年${mm}か月後`
}
