// ======================================================
// 輪をほどく画面（ステップ②③）の座標系
//
// SVG の viewBox を固定し、画面の幅に合わせて全体を縮小して描く（参考実装と同じ）。
// 座標は px。y は下向きが正（SVG のまま）。
//
// ■ 大きさの決め方
//   円の半径 R_PX = 80。完成形の三角形の底辺は 2π × 80 ≈ 503。
//   切れ目（真下の半径）の x を X0、円の中心の y を CY とする。
//   ほどく途中で輪がいちばん広がるのは、
//     左：t ≈ 0.25〜0.3 で X0 − (4/3)rm くらいまで（輪の左はしが切れ目より左へ出る）
//     上：t ≈ 0.63 で、輪の真下の点から約 4.55rm 上まで
//   要件 §5.1 の v0.1 は「t ≈ 0.5 で最大 4r」としていたが、実際は t ≈ 0.63 の約 4.55r が最大
//   （参考実装の viewBox 660×390 では上に約13px はみ出していた。2026-10-25 計算で確認し、要件書も修正）。
//   これが線の太さこみで収まるよう、viewBox を 660×420、X0 = 120、CY = 300 にした。
//   さらに完成時の底辺のラベルが「大きく表示」（文字 1.3 倍）でも欠けないよう、高さを 430 にした。
//   はみ出さないことは unroll.test.ts で固定している。
// ======================================================

/** viewBox の幅・高さ */
export const VIEW_W = 660
export const VIEW_H = 430

/** 円の半径（px） */
export const R_PX = 80

/** 切れ目（真下の半径）の x。ほどいた帯の左はし（三角形の直角）もここ */
export const X0 = 120

/** 円の中心の y */
export const CY = 300

/** 三角形の底辺の y（いちばん外側の輪の外がわ＝円の下はし） */
export const BASE_Y = CY + R_PX

/** 輪をほどく画面の置き方（unroll.ts の関数に渡す） */
export interface Scene {
  /** 切れ目の x */
  x0: number
  /** 円の中心の y */
  cy: number
  /** 円の半径 */
  r: number
}

export const SCENE: Scene = { x0: X0, cy: CY, r: R_PX }

// ---- 見せ方（進み具合 t に合わせて出し入れするもの） ------------------------------------

/** 完成形の三角形のガイドの濃さ。ほどき始めたら出し始め、t = 2/3 で濃さ1（F3-5） */
export function guideOpacity(t: number): number {
  return Math.min(1, Math.max(0, t * 1.5))
}

/** 切れ目（オレンジの破線）は、ほどき始めの t < CUT_FADE_END のあいだに消していく */
export const CUT_FADE_END = 0.15
export function cutOpacity(t: number): number {
  return t >= CUT_FADE_END ? 0 : 1 - Math.max(0, t) / CUT_FADE_END
}

/** これより先まで進んだら完成とみなす（完成時のラベル・結論・グラフの下の一言） */
export const DONE_T = 0.98

/** 完成したか。図のラベルと結論の文言の両方がこれで決める（2か所で判定を食い違わせない） */
export function isDone(t: number): boolean {
  return t > DONE_T
}

/** 進み具合の段階（グラフの下の一言） */
export function unrollPhase(t: number): "start" | "moving" | "done" {
  if (t < 0.02) return "start"
  return isDone(t) ? "done" : "moving"
}

// ---- 完成時のラベルの位置 -----------------------------------------------------------------

/** ラベルの文字の大きさ（px、viewBox の単位）。大きく表示では倍率をかける */
export const LABEL_FONT = 16

/** 底辺のラベル：底辺の下 BASE_LABEL_GAP（文字の倍率もかける）、三角形の底辺のまん中 */
export const BASE_LABEL_GAP = 26
/** 高さのラベル：切れ目の左 HEIGHT_LABEL_GAP、高さのまん中（右寄せ） */
export const HEIGHT_LABEL_GAP = 10

/** ラベルを置く位置（文字のベースライン。x は textAnchor の基準） */
export interface LabelLayout {
  font: number
  base: { x: number; y: number }
  height: { x: number; y: number }
}

/**
 * 完成時のラベル（底辺・高さ）の位置。scale は文字の倍率（大きく表示で BIG_FONT）。
 * 描画（RingDisk.tsx）と「viewBox に収まる」テストの両方がこれを使う（式を2か所に書かない）。
 *   底辺：三角形の底辺のまん中、底辺の下 BASE_LABEL_GAP × scale（まん中寄せ）
 *   高さ：切れ目の左 HEIGHT_LABEL_GAP × scale、高さのまん中（右寄せ）
 */
export function labelLayout(scale: number, s: Scene = SCENE): LabelLayout {
  const font = LABEL_FONT * scale
  const base = s.cy + s.r
  return {
    font,
    base: { x: s.x0 + Math.PI * s.r, y: base + BASE_LABEL_GAP * scale },
    height: { x: s.x0 - HEIGHT_LABEL_GAP * scale, y: base - s.r / 2 + font / 3 },
  }
}

/**
 * 文字列のだいたいの幅（px）。全角（日本語・全角記号）は1文字＝文字の大きさ、半角は 0.6 倍。
 * ラベルが viewBox からはみ出さないことの検査に使う（多めに見積もる）。
 */
export function labelWidth(s: string, font: number): number {
  let w = 0
  for (const ch of s) w += (ch.codePointAt(0) ?? 0) > 0xff ? font : font * 0.6
  return w
}

/**
 * 完成形の三角形の頂点（ガイドの破線）。直角は切れ目の位置。
 *   底辺 2πr（いちばん外側の輪の長さ ＝ 円周）、高さ r
 */
export function triangleGuide(s: Scene): [number, number][] {
  const base = s.cy + s.r
  return [
    [s.x0, base],
    [s.x0 + 2 * Math.PI * s.r, base],
    [s.x0, base - s.r],
  ]
}
