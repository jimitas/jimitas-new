// ======================================================
// ステップ③ 導関数（各点での接線の傾きを集めた関数）
//
// 上のグラフ：y = f(x) と x = a の接線。下のグラフ：横軸 x、縦軸「接線の傾き」。
// a を動かすと下に点 (a, f'(a)) を打ち、軌跡を残す。「▶ なぞる」で a を左端から右端まで動かすと、
// 軌跡が y = f'(x) のグラフになっていく。
// ======================================================

import { A_MAX, A_MIN } from "./approach"
import { derivative, evaluate } from "./polynomial"
import type { Poly } from "./polynomial"
import { fitView } from "@/lib/graph/viewport"
import type { View } from "@/lib/graph/viewport"

/** ③ の横の範囲（上下のグラフで共通）。x³ でも縦がつぶれすぎない広さ */
export const X3_MIN = -2
export const X3_MAX = 4

/** 「▶ なぞる」の長さ（ミリ秒） */
export const SWEEP_MS = 6000

/** 進み具合 t（0〜1）→ a。左端から右端まで一定の速さで */
export function sweepX(t: number, lo: number, hi: number): number {
  const u = Math.min(1, Math.max(0, t))
  return lo + (hi - lo) * u
}

/** 上（f）と下（f'）の全体表示。横の範囲はそろえる（既定は X3_MIN〜X3_MAX） */
export function stepThreeViews(p: Poly, lo = X3_MIN, hi = X3_MAX): { top: View; bottom: View } {
  const df = derivative(p)
  return {
    top: fitView((x) => evaluate(p, x), lo, hi, 0.1),
    bottom: fitView((x) => evaluate(df, x), lo, hi, 0.15),
  }
}

/**
 * 点A（x = a）が入る全体表示。a が既定の範囲の中なら stepThreeViews と同じ、外なら a のまわり 1 まで広げる。
 * ① ② で a = 4.5 などにしてから ③ を開いたとき、点A が最初から画面の外にならないように（2026-10-25 レビュー指摘）。
 */
export function viewsWithPoint(p: Poly, a: number): { top: View; bottom: View } {
  return stepThreeViews(p, Math.min(X3_MIN, a - 1), Math.max(X3_MAX, a + 1))
}

/** 横の範囲だけ src にそろえる（上下のグラフを一緒にパン・ズームする） */
export function withXRange(v: View, src: View): View {
  return { ...v, xMin: src.xMin, xMax: src.xMax }
}

/**
 * なぞるときの a の範囲。表示の左右の端から幅の 3% 内側（端ちょうどだと点A が半分切れるため）。
 * ただし点A を動かせる範囲（A_MIN〜A_MAX）の中。
 * 表示がその範囲からほとんど外れている（なぞれる幅が 0.5 未満）ときは null。呼ぶ側は全体表示に戻してからなぞる。
 */
export function sweepRange(v: View): [number, number] | null {
  const m = (v.xMax - v.xMin) * 0.03
  const lo = Math.min(A_MAX, Math.max(A_MIN, v.xMin + m))
  const hi = Math.min(A_MAX, Math.max(A_MIN, v.xMax - m))
  return hi - lo >= 0.5 ? [lo, hi] : null
}

/**
 * 軌跡に点を足す。同じ x の点がすでにあれば足さない。
 * ドラッグ中は 0.1 刻みに丸めた同じ x で何度も呼ばれるので、そのまま足すと点が上限なくたまる（2026-10-25 レビュー指摘）。
 */
export function addTracePoint(trace: [number, number][], pt: [number, number]): [number, number][] {
  return trace.some(([x]) => x === pt[0]) ? trace : [...trace, pt]
}

/** 軌跡の点 (x, f'(x)) */
export function tracePoint(p: Poly, x: number): [number, number] {
  return [x, evaluate(derivative(p), x)]
}

/** 説明に出す例の x（F3-4：「1なら2、2なら4、3なら6」） */
export const EXAMPLE_XS = [1, 2, 3] as const
