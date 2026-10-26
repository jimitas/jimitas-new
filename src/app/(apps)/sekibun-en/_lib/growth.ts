// ======================================================
// ステップ① 面積の増え方（要件 §4.1）の計算
//
// 半径 r の円の半径を h だけのばすと、増える面積は細い輪1本。
//   増えた面積       π(r + h)² − πr² ＝ h·π(2r + h)
//   増えた面積 ÷ h   π(2r + h)          → h を 0 に近づけると 2πr（円周）
// どちらも π(r + h)² − πr² の引き算をせずに式で直接出す（h が小さいと桁落ちするため。要件 §5.2、微分アプリ §5 と同じ方針）。
//
// ■ 図の大きさ（px）
//   円の中心は (FIG_C, FIG_C)、1 あたり UNIT px。半径 2 で 80px（③の円と同じ大きさ）。
//   のばした量は最大 1 なので、いちばん外側は 3 × 40 = 120px。viewBox FIG_SIZE の中に収まる。
//
// ■ 拡大の小窓（F1-4）
//   輪の右はし（中心の右、半径 r + h/2 の点）を中心に、半辺 LOUPE_SPAN × h × UNIT の正方形を見せる。
//   h がいくつでも、輪の太さは小窓の幅の 1/(2·LOUPE_SPAN) に見える（h が小さくなるほど拡大される＝追いかけズーム）。
// ======================================================

/** 円の半径（初期値。要件 F1-1：r = 2） */
export const R0 = 2

/** h の範囲。0 は選べない（要件 F1-1） */
export const H_MIN = 0.001
export const H_MAX = 1

/** 図：viewBox の一辺・円の中心・1 あたりの px */
export const FIG_SIZE = 280
export const FIG_C = FIG_SIZE / 2
export const UNIT = 40

/** 小窓の半辺は h の LOUPE_SPAN 倍（輪の太さが小窓の幅の 1/5 に見える） */
export const LOUPE_SPAN = 2.5

/** 増えた面積 h·π(2r + h)（引き算をしない） */
export function addedArea(r: number, h: number): number {
  return h * Math.PI * (2 * r + h)
}

/** 増えた面積 ÷ h ＝ π(2r + h)（割り算もしない） */
export function addedPerH(r: number, h: number): number {
  return Math.PI * (2 * r + h)
}

/** 円周 2πr（増えた面積 ÷ h の行き先） */
export function circumference(r: number): number {
  return 2 * Math.PI * r
}

/** スライダーの位置 p（0〜1）→ h。対数の目盛り（1 → 0.1 → 0.01 → 0.001 を同じ幅で） */
export function hFromSlider(p: number): number {
  const q = Number.isNaN(p) ? 0 : Math.min(1, Math.max(0, p))
  return 10 ** (-3 * q)
}

/** h → スライダーの位置（hFromSlider の逆） */
export function sliderFromH(h: number): number {
  return Math.min(1, Math.max(0, -Math.log10(h) / 3))
}

/** 拡大の小窓の範囲（viewBox の座標）と倍率 */
export interface LoupeWindow {
  x: number
  y: number
  size: number
  /** 図全体（FIG_SIZE）に対する倍率 */
  mag: number
}

export function loupeWindow(r: number, h: number): LoupeWindow {
  const half = LOUPE_SPAN * h * UNIT
  const cx = FIG_C + (r + h / 2) * UNIT
  return { x: cx - half, y: FIG_C - half, size: 2 * half, mag: FIG_SIZE / (2 * half) }
}

/**
 * 図の上に描く「拡大しているところ」の四角を、図（0〜FIG_SIZE）の中に切りつめる。
 * h が大きいと小窓の範囲が図の右へはみ出すので、はみ出した辺を描かない（2026-10-26 レビュー指摘）。
 */
export function clipToFigure(w: LoupeWindow): { x: number; y: number; width: number; height: number } {
  const x0 = Math.max(0, w.x)
  const y0 = Math.max(0, w.y)
  const x1 = Math.min(FIG_SIZE, w.x + w.size)
  const y1 = Math.min(FIG_SIZE, w.y + w.size)
  return { x: x0, y: y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0) }
}
