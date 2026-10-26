// ======================================================
// ▶ ほどく／◀ 巻き戻す の動き（ステップ③ F3-2・F3-3、ステップ② F2-2 の「▶ 切り開く」も同じ）
//
// 進み具合 t を、いまの値から目標（1 か 0）へ動かす。
//   長さ：全部ほどく（0 → 1）で full（③ は UNROLL_MS、② は CUT_MS）。途中からなら残りの割合だけ短くする。
//   動き：微分の意味がわかると同じ easeInOut（3次。@/lib/graph/steps）。
//   「動きを減らす」設定（prefers-reduced-motion）では REDUCED_MS に縮める（要件 §6）。
//   段階表示（いきなり三角形）にしないのは、輪がほどける途中を見せることがこのアプリの目的だから。
// ======================================================

import { clamp01, easeInOut } from "@/lib/graph/steps"
import { PLAY_LABEL } from "./text"
import type { PlayLabels } from "./text"

/** 全部ほどくのにかかる時間（ミリ秒）。要件 F3-2：約3秒 */
export const UNROLL_MS = 3000

/** 「動きを減らす」設定のときの、全部ほどくのにかかる時間（ミリ秒） */
export const REDUCED_MS = 600

/** from から to まで動かす時間（ミリ秒）。full は 0 → 1 全部にかける時間 */
export function durationFor(from: number, to: number, reduce: boolean, full: number = UNROLL_MS): number {
  return (reduce ? Math.min(REDUCED_MS, full) : full) * Math.abs(to - from)
}

/** 動き始めてからの割合 u（0〜1）のときの t */
export function tweenT(from: number, to: number, u: number): number {
  return from + (to - from) * easeInOut(clamp01(u))
}

/** 動かす向き（ほどく／巻き戻す）。止まっているときは null */
export type Direction = 1 | -1 | null

/**
 * 再生ボタンの文字。
 *   動いている（どちら向きでも）→ ⏸ 止める
 *   ほどき終わっている          → ▶ もう一度ほどく（0 からやり直す）
 *   途中で止まっている          → ▶ 続ける
 *   はじめ                      → ▶ ほどく
 */
export function playLabel(t: number, moving: Direction, labels: PlayLabels = PLAY_LABEL): string {
  if (moving !== null) return labels.pause
  if (t >= 1) return labels.again
  if (t > 0) return labels.resume
  return labels.start
}
