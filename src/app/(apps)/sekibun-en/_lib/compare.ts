// ======================================================
// ステップ④ 速さと距離とくらべる（要件 §4.4）の計算
//
// 2つのグラフはどちらも「原点を通る直線 y = kx の下の三角形」。
//   左：速さ 2x（k = 2）の下の面積 ＝ ½ × x × 2x ＝ x²（距離）
//   右：円周 2πr（k = 2π）の下の面積 ＝ ½ × r × 2πr ＝ πr²（円の面積）
// 軸の名前がちがうだけで、やっていることは同じ（F4-4）。
//
// ■ 細い長方形の積み上げ（F4-3）
//   0〜X を n 等分し、i 本目の長方形の高さは、その幅のまん中での直線の高さ k·(i − ½)Δ にする。
//   右のグラフでは、これが ③ の帯1本（長さ ＝ 輪のまん中の円周 2π·rm、太さ Δ）とぴったり同じになる。
//   直線なので、まん中の高さの長方形の合計は、本数によらず三角形の面積とちょうど等しい
//   （はみ出す三角と足りない三角が打ち消し合う。要件 §5.2 の帯の面積の合計と同じ性質）。
// ======================================================

/** 左のグラフ：速さ 2x の傾き */
export const K_SPEED = 2
/** 右のグラフ：円周 2πr の傾き */
export const K_CIRCLE = 2 * Math.PI

/** 共通のスライダー（x ＝ r）の範囲と初期値（2026-10-25 オーナー決定：0〜4、初期値 2） */
export const X_MAX = 4
export const X_INIT = 2
export const X_STEP = 0.1

/** 細い長方形の本数の選択肢（F4-3：4〜64）と初期値 */
export const RECT_COUNTS = [4, 8, 16, 32, 64] as const
export const DEFAULT_RECTS = 8

/** 直線 y = kx の下、0〜X の三角形の面積 ½·X·kX */
export function triangleArea(k: number, x: number): number {
  return (k * x * x) / 2
}

/** 細い長方形1本（世界座標） */
export interface Rect {
  x0: number
  x1: number
  height: number
}

/** 0〜X を n 等分した、まん中の高さの長方形 */
export function midRects(k: number, x: number, n: number): Rect[] {
  const w = x / n
  return Array.from({ length: n }, (_, j) => ({ x0: j * w, x1: (j + 1) * w, height: k * (j + 0.5) * w }))
}

/** 長方形の面積の合計 */
export function rectsArea(rects: Rect[]): number {
  return rects.reduce((sum, r) => sum + (r.x1 - r.x0) * r.height, 0)
}

/**
 * グラフの表示範囲（世界座標）。スライダーの右はしでも直線の先と目盛りが収まるよう余らせる。
 * 横は x = 5 まで：横軸の名前（「時間 x（秒）」）は右はしに描かれ、共通の座標平面では中身より先に描くので、
 * x = 4 までの長方形と重なると隠れてしまう（2026-10-26 の画面確認で見つけた）。
 */
export const VIEW_X_MAX = X_MAX * 1.25
export function compareView(k: number): { xMin: number; xMax: number; yMin: number; yMax: number } {
  const top = k * X_MAX
  return { xMin: -0.3, xMax: VIEW_X_MAX, yMin: -top * 0.08, yMax: top * 1.12 }
}
