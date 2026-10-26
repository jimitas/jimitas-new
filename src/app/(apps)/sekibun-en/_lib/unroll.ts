// ======================================================
// 輪をほどく計算（要件 §5.1）— このアプリの核
//
// 円を n 本の輪に分け、真下に切れ目を入れて、輪を1本ずつまっすぐな帯にのばす。
// ほどき終わると、外側の輪ほど低い位置・長い帯になり、直角三角形に積み上がる。
//
// ■ 輪 i（i = 1..n、内側から数える）
//   幅 Δr = r/n、中心線の半径 rm = (i − ½)Δr。
//   輪は「中心線を太さ Δr の線（端は butt）」で描く。
//   輪の面積はちょうど 中心線の長さ × 太さ ＝ 2πrm·Δr（近似ではなく等式）。
//
// ■ 進み具合 t（0〜1）
//   輪の真下の点を固定し、長さ L = 2πrm を保ったまま、曲率 k = (1 − t)/rm の円弧として描く。
//     t = 0：k = 1/rm（もとの輪）
//     t = 1：k = 0（まっすぐな帯）
//   弧に沿った距離 s（0〜L）の点：x = x₀ + sin(sk)/k、y = y_b − (1 − cos(sk))/k
//   （SVG 座標。y_b = cy + rm は輪の真下の点）。k ≈ 0 では直線 x = x₀ + s、y = y_b。
//
// 描画（SVG）は _components/RingDisk.tsx。ここは React・DOM に触らない（jest が直接読む）。
// ======================================================

import { clamp01, easeInOut } from "@/lib/graph/steps"
import type { Pt } from "@/lib/graph/viewport"
import type { Scene } from "./scene"

/** 輪の数の選択肢（F3-1） */
export const RING_COUNTS = [4, 8, 16, 32, 64] as const
/** 輪の数の初期値（選択肢に入っていることはテストで固定） */
export const DEFAULT_RINGS = 8

/** これより曲率が小さければ直線とみなす（sin(sk)/k を 0 に近い k で割らない） */
export const STRAIGHT_K = 1e-6

/** 折れ線の点の間隔（px）と、最低の点の数 */
const POINT_GAP = 3
const MIN_POINTS = 60

/** 輪の幅 Δr（描くときの線の太さ）。はみ出しの検査と描画の両方がこれを使う */
export function ringWidth(n: number, r: number): number {
  return r / n
}

/**
 * 進み具合を 0〜1 にそろえる。NaN は 0（もとの円）として扱う
 * （スライダーの値の読み違いで NaN が来ても、輪が消えずに円のまま見えるように）。
 */
function progressOf(t: number): number {
  return Number.isNaN(t) ? 0 : clamp01(t)
}

/** 輪 i（1..n）の中心線の半径 */
export function ringMidRadius(i: number, n: number, r: number): number {
  return (i - 0.5) * ringWidth(n, r)
}

/**
 * 長さ L の輪を何点の折れ線で描くか。長さに比例させ（64本でも点を増やしすぎない。要件 §6）、
 * 短い内側の輪でも円に見えるよう最低 MIN_POINTS 点にする。
 */
export function ringStepCount(length: number): number {
  return Math.max(MIN_POINTS, Math.ceil(length / POINT_GAP))
}

/**
 * 中心線の半径 rm の輪を、進み具合 t までほどいたときの折れ線の点（s = 0 から L まで）。
 * s = 0 の点（切れ目の右がわ）は、どの t でも輪の真下の点 (x₀, cy + rm) にとどまる。
 */
export function ringPoints(rm: number, t: number, s: Scene): Pt[] {
  const L = 2 * Math.PI * rm
  const k = (1 - progressOf(t)) / rm
  const yb = s.cy + rm
  const steps = ringStepCount(L)
  const pts: Pt[] = []
  for (let j = 0; j <= steps; j++) {
    const d = (L * j) / steps
    if (k < STRAIGHT_K) pts.push({ x: s.x0 + d, y: yb })
    else pts.push({ x: s.x0 + Math.sin(d * k) / k, y: yb - (1 - Math.cos(d * k)) / k })
  }
  return pts
}

/** 矩形（px） */
export interface Box {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

/**
 * n 本の輪を進み具合 t まで（mode に応じて輪ごとに）ほどいたときの外接矩形。線の太さ Δr こみ。
 * 太さの分は上下左右に Δr/2 ずつ広げる（線の向きによらず、はみ出す分はこれ以下）。
 * 描画領域からはみ出さないこと（受け入れ基準3）の検査に使う。
 */
export function unrollBounds(n: number, t: number, s: Scene, mode: UnrollMode = "all"): Box {
  const half = ringWidth(n, s.r) / 2
  const box: Box = { xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity }
  for (let i = 1; i <= n; i++) {
    for (const p of ringPoints(ringMidRadius(i, n, s.r), ringShapeProgress(i, n, t, mode), s)) {
      box.xMin = Math.min(box.xMin, p.x - half)
      box.xMax = Math.max(box.xMax, p.x + half)
      box.yMin = Math.min(box.yMin, p.y - half)
      box.yMax = Math.max(box.yMax, p.y + half)
    }
  }
  return box
}

/**
 * ほどき方
 *   all    全部の輪が同時にほどける（F3-2）
 *   outer  外側の輪から1本ずつ（F3-8。ロープを外から1周ずつほどく実演に近い）
 *   inner  内側の輪から1本ずつ
 */
export type UnrollMode = "all" | "outer" | "inner"

/** ほどき方の選択肢（ボタンの並び順） */
export const UNROLL_MODES: readonly UnrollMode[] = ["all", "outer", "inner"]

/**
 * 全体の進み具合 t のときの、輪 i（1..n）の進み具合（0〜1）。
 * 1本ずつのときは、t の 0〜1 を n 等分して、順番の来た輪だけがほどける。
 */
export function ringProgress(i: number, n: number, t: number, mode: UnrollMode): number {
  const tt = progressOf(t)
  if (mode === "all") return tt
  const order = mode === "outer" ? n - i : i - 1 // 何番目にほどけるか（0 始まり）
  return clamp01(tt * n - order)
}

/**
 * 描くときの輪 i の進み具合。1本ずつのときは、輪ごとにもなめらかに動き出して止まる（F3-8）。
 * 描画（RingDisk.tsx）とはみ出し検査（unrollBounds）の両方がこれを使う（形の計算を2か所に書かない）。
 * 1本ずつのとき全体の t は一定の速さで進める（playback.ts）ので、どの輪も同じ時間でほどける。
 */
export function ringShapeProgress(i: number, n: number, t: number, mode: UnrollMode): number {
  const p = ringProgress(i, n, t, mode)
  return mode === "all" ? p : easeInOut(p)
}

/** 最初にほどけ始める輪・最後にほどけ終わる輪の番号（全部いっしょなら、どの輪も同じ） */
export function firstRing(n: number, mode: UnrollMode): number {
  return mode === "inner" ? 1 : n
}
export function lastRing(n: number, mode: UnrollMode): number {
  return mode === "outer" ? 1 : n
}

/**
 * 最初の輪・最後の輪の進み具合。
 *   図の下の一言の「はじめ」は「最初の輪」がまだ動いていないとき
 *   切れ目は「最後の輪」がほどけ始めたら消す（まだ切れ目の入っていない輪が残っているうちに消さない）
 *   完成は「最後の輪」がほどけ終わったかで決める（1本ずつのとき、最後の輪がまだ円なのに完成扱いにしないため。
 *   全体の t > 0.98 で決めると、内側から1本ずつ・64 本で、底辺になる外側の輪がまだ円のうちに完成のラベルが出た。2026-10-27 レビュー指摘）
 */
export function firstRingProgress(n: number, t: number, mode: UnrollMode): number {
  return ringProgress(firstRing(n, mode), n, t, mode)
}
export function lastRingProgress(n: number, t: number, mode: UnrollMode): number {
  return ringProgress(lastRing(n, mode), n, t, mode)
}

/**
 * 中心からの距離 dist（px）にある輪の番号（1..n）。円の外なら null。
 * 引数の並びは ringMidRadius・ringWidth と同じ（n, r の順）。
 * 輪と輪の境目は外側の輪に入れる（円のふちちょうどは、いちばん外側の輪）。
 * ステップ②で、タップした輪を選ぶのに使う。
 */
export function ringIndexAt(dist: number, n: number, r: number): number | null {
  if (!(dist >= 0) || dist > r) return null
  return Math.min(n, Math.floor((dist / r) * n) + 1)
}

/** viewBox の座標 (x, y) にある輪の番号（1..n）。円の外なら null。ステップ②でタップした輪を選ぶ */
export function ringAtPoint(x: number, y: number, n: number, s: Scene): number | null {
  return ringIndexAt(Math.hypot(x - s.x0, y - s.cy), n, s.r)
}
