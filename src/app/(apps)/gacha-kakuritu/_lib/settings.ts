// ======================================================
// ガチャ確率シミュレーター — 設定欄の読み取りと上限値
//
// 移植元 script.js の readSettings / mirrorFromDenom / mirrorFromPct を
// DOM から切り離したもの。文字列（入力欄の値）を受け取って数値にする。
// ======================================================

export const N_MAX = 10000
export const S_MAX = 100000
export const DENOM_MAX = 10000000
/** S × N の上限（超えたら S を切り詰める） */
export const WORK_CAP = 1e8

/** 入力欄の中身。pSource は「最後に編集した確率の欄」で、そちらを p の真値とする */
export interface SettingsForm {
  denom: string
  pct: string
  n: string
  s: string
  pSource: "denom" | "pct"
}

export interface ParsedSettings {
  errors: string[]
  /** errors が空のときだけ意味を持つ */
  p: number
  N: number
  S: number
}

export const fmtInt = (n: number) => n.toLocaleString("ja-JP")
/** 有効数字6桁で短く（0.01 → "0.01"、1/3 → "0.333333"） */
export const fmtNum = (x: number) => String(+x.toPrecision(6))

export function readSettings(f: SettingsForm): ParsedSettings {
  const errors: string[] = []
  let p = NaN
  if (f.pSource === "denom") {
    const d = parseFloat(f.denom)
    if (!Number.isFinite(d) || d < 1 || d > DENOM_MAX) errors.push(`分母は 1〜${fmtInt(DENOM_MAX)} で入力してください。`)
    else p = 1 / d
  } else {
    const q = parseFloat(f.pct)
    if (!Number.isFinite(q) || q <= 0 || q > 100) errors.push("確率は 0 より大きく 100% 以下で入力してください。")
    else p = q / 100
  }
  const N = parseInt(f.n, 10)
  if (!Number.isInteger(N) || N < 1 || N > N_MAX || String(N) !== f.n.trim()) {
    errors.push(`回数 N は 1〜${fmtInt(N_MAX)} の整数で入力してください。`)
  }
  const S = parseInt(f.s, 10)
  if (!Number.isInteger(S) || S < 1 || S > S_MAX || String(S) !== f.s.trim()) {
    errors.push(`セッション数 S は 1〜${fmtInt(S_MAX)} の整数で入力してください。`)
  }
  return { errors, p, N, S }
}

/** 分母欄を書きかえたときの % 欄の値。換算できないときは今の値のまま */
export function pctFromDenom(denom: string, currentPct: string): string {
  const d = parseFloat(denom)
  return Number.isFinite(d) && d >= 1 ? fmtNum(100 / d) : currentPct
}

/** % 欄を書きかえたときの分母欄の値。換算できないときは今の値のまま */
export function denomFromPct(pct: string, currentDenom: string): string {
  const q = parseFloat(pct)
  return Number.isFinite(q) && q > 0 && q <= 100 ? fmtNum(100 / q) : currentDenom
}

/** まとめて実行するセッション数。S × N が WORK_CAP を超えるなら切り詰める */
export function capSessions(S: number, N: number): number {
  return S * N > WORK_CAP ? Math.max(1, Math.floor(WORK_CAP / N)) : S
}
