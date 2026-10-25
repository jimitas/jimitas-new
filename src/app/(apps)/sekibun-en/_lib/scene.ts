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
//   はみ出さないことは unroll.test.ts で固定している。
// ======================================================

/** viewBox の幅・高さ */
export const VIEW_W = 660
export const VIEW_H = 420

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
