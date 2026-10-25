// ======================================================
// h を 0 に近づける動き（ステップ②）
//
// ■ 段：h = 1 → 0.5 → 0.1 → 0.01 → 0.001（左からは符号を逆に）
//   スライド10–11（2→3, 2→2.5, 2→2.1, 2→2.01）と同じ値。
//   段の値・「1段ずつ」の動き・イージングは積分アプリと共有するため @/lib/graph/steps に置いた。
//
// ■ 「▶ 近づけてみる」の h(t)
//   |h| = 10^(−3t)（t は 0〜1）。1→0.1→0.01→0.001 の各桁を同じ時間で通る。
//   ふつうに直線で減らすと、0.1 より下が最後の一瞬で終わってしまい、
//   いちばん見せたい「ほとんど重なる」ところが見えないため。
//
// ■ 追いかけズーム
//   h が小さくなるにつれて点A のまわりへ寄り、点A を画面の中央へ運ぶ。
//   拡大されると曲線がまっすぐに見え、2点を結ぶ直線と接線が重なる。
//   点B は縦横とも表示に収まる程度にしか寄らない（2026-10-25 レビュー指摘1・2で改修）。
// ======================================================

import { H_STEPS, clamp01 } from "@/lib/graph/steps"
import { evaluate } from "./polynomial"
import type { Poly } from "./polynomial"
import { fitView, zoomAbout } from "@/lib/graph/viewport"
import type { View } from "@/lib/graph/viewport"

/** 点A の範囲（スライダー・ドラッグ） */
export const A_MIN = -3
export const A_MAX = 5

/** h のスライダーの範囲と刻み（0 は選べない） */
export const H_LIMIT = 2
export const H_SLIDER_STEP = 0.001

/**
 * 点B をドラッグするときの h の刻み。表示の横幅の 1/20 くらいの 10ⁿ（0.001〜0.1）。
 * 拡大して h = 0.001 付近を見ているときに 0.1 刻みにすると、触れただけで h = 0 に丸まってしまう
 * （2026-10-25 レビュー指摘）。
 */
export function hDragStep(viewWidth: number): number {
  const s = 10 ** Math.floor(Math.log10(viewWidth / 20))
  return Math.min(0.1, Math.max(H_SLIDER_STEP, s))
}

/**
 * ステップ②の全体表示。横は a の左右 3、縦は a の左右 1.5 の範囲の曲線が収まるように。
 * h = ±1 の点B が必ず入る。縦を広い範囲で合わせると、x³ などで点A のあたりがつぶれて見えるため。
 */
export function initialView(p: Poly, a: number): View {
  const v = fitView((x) => evaluate(p, x), a - 1.5, a + 1.5, 0.15)
  return { ...v, xMin: a - 3, xMax: a + 3 }
}

/** アニメの最後の |h|（これ以下で接線を実線にする） */
export const H_END = 0.001

/** 「▶ 近づけてみる」の長さ（ミリ秒） */
export const APPROACH_MS = 5000

/** 進み具合 t（0〜1）→ |h| */
export function hAt(t: number): number {
  return 10 ** (-3 * clamp01(t))
}

/** |h| になる進み具合 t（hAt の逆） */
export function timeOf(absH: number): number {
  return -Math.log10(absH) / 3
}

/**
 * 進み具合 t までに通った段の数（0〜5）。
 * t = 0 で h = 1 の段を通ったとみなす（押した瞬間に1行目が入る）。
 */
export function stepsPassed(t: number): number {
  return H_STEPS.filter((s) => timeOf(s) <= t + 1e-9).length
}

/** 点B は縦横とも、点A から表示の半分の 1/CHASE_KEEP 以内に収める */
export const CHASE_KEEP = 4

/**
 * 追いかけズームの表示範囲。full（全体表示）を r 倍に縮める（縦横比は full のまま）。
 *   r = min(1, max(|h|, 点B を収めるのに必要な倍率))
 *   - h = 1 では必ず r = 1（押した瞬間に表示が飛ばない。全体表示が広くても同じ）
 *   - 傾きが急でも、縦方向に点B がはみ出さない程度にしか寄らない
 * 点A の画面上での「中央からのずれ」も r 倍にする（全体表示の端にあっても、最後は真ん中に来る）。
 * dy は f(a + h) − f(a)（点A から点B までの縦の差）。
 */
export function chaseView(full: View, a: number, fa: number, h: number, dy: number): View {
  const halfW = (full.xMax - full.xMin) / 2
  const halfH = (full.yMax - full.yMin) / 2
  const need = Math.max((CHASE_KEEP * Math.abs(h)) / halfW, (CHASE_KEEP * Math.abs(dy)) / halfH)
  const r = Math.min(1, Math.max(Math.abs(h), need))
  const z = zoomAbout(full, a, fa, r)
  // zoomAbout は点A を画面上の同じ位置にとどめる。そこからさらに中央へ寄せる
  const shift = 1 - r
  const cx = a - (z.xMin + z.xMax) / 2
  const cy = fa - (z.yMin + z.yMax) / 2
  return {
    xMin: z.xMin + cx * shift,
    xMax: z.xMax + cx * shift,
    yMin: z.yMin + cy * shift,
    yMax: z.yMax + cy * shift,
  }
}
