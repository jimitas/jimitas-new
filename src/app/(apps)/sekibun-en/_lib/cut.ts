// ======================================================
// ステップ② 輪を切り開く（要件 §4.2）の数値
//
// 半径 RADIUS の円を CUT_RINGS 本の輪に分け、選んだ1本だけを切り開いて帯にする。
// 描く位置（px）は ③ と同じ座標系（scene.ts・unroll.ts）。ここは画面に出す数値と、帯のそばのラベルの位置を出す。
//
// ■ 帯の長さは「輪のまん中を通る円」の円周 2π × rm
//   輪は中心線を太さ Δr で描いているので、ほどいた帯の長さはちょうど 2πrm になる（unroll.ts）。
//   このとき 円周 × 太さ ＝ 2πrm·Δr は、輪の面積 π(外の半径² − 内の半径²) とちょうど等しい（要件 §5.2）。
//   画面では要件どおり「輪の面積 ≒ 円周 × 太さ」と書く（外側の円周で考える生徒にも当てはまるように）。
// ======================================================

import { LABEL_FONT, R_PX, SCENE, VIEW_W, labelWidth } from "./scene"
import { ringMidRadius, ringWidth } from "./unroll"

/** 円の半径（ステップ①の初期値と同じ r = 2） */
export const RADIUS = 2

/** 輪の数（太さ 0.25。タップで選べる太さにするため ③ の初期値と同じ 8 本） */
export const CUT_RINGS = 8

/** 最初に選んでおく輪（いちばん外側。F2-1） */
export const INITIAL_RING = CUT_RINGS

/** 切り開くのにかかる時間（ミリ秒）。要件 F2-2：約2秒 */
export const CUT_MS = 2000

/** 輪 i（1..n、内側から）の数値 */
export interface RingFacts {
  /** 内がわ・外がわの半径 */
  inner: number
  outer: number
  /** 輪のまん中を通る円の半径 */
  mid: number
  /** 太さ Δr */
  width: number
  /** 帯の長さ ＝ 輪のまん中の円周 2π × mid */
  length: number
  /** 円周 × 太さ */
  area: number
  /** 画面に出す長さ（小数第2位で丸めた値）と、それに太さをかけた面積。
   *  画面の式「11.78 × 0.25 ≒ 2.95」を電卓で確かめても合うように、面積は丸めた長さから出す
   *  （丸める前の長さから出すと、内側から4本目の輪で「5.50 × 0.25 ≒ 1.37」になり、検算の 1.38 と合わない。2026-10-26 レビュー指摘） */
  shownLength: number
  shownArea: number
}

export function ringFacts(i: number, n: number = CUT_RINGS, r: number = RADIUS): RingFacts {
  const width = ringWidth(n, r)
  const mid = ringMidRadius(i, n, r)
  const length = 2 * Math.PI * mid
  const shownLength = Math.round(length * 100) / 100
  return {
    inner: (i - 1) * width, outer: i * width, mid, width, length, area: length * width,
    shownLength, shownArea: shownLength * width,
  }
}

/** 輪の番号を 1..n に収める（「内側の輪／外側の輪」ボタン） */
export function clampRing(i: number, n: number = CUT_RINGS): number {
  return Math.min(n, Math.max(1, Math.round(i)))
}

/** 帯のそばのラベル（長さは帯の上、太さは帯の下）の位置。x は文字のまん中、y はベースライン */
export interface StripLabels {
  font: number
  length: { x: number; y: number }
  width: { x: number; y: number }
}

/** viewBox の端から、これ以上内側にラベルを置く（px） */
const STRIP_LABEL_MARGIN = 4

/**
 * 切り開いた帯 i のラベルの位置（F2-3）。帯のまん中に置くが、内側の輪で帯が短いときは
 * 文字が viewBox の左右からはみ出さないよう、端から STRIP_LABEL_MARGIN 内側までずらす。
 * scale は文字の倍率（大きく表示で BIG_FONT）。texts は実際に出す文字（幅の見積もりに使う）。
 */
export function stripLabels(i: number, scale: number, texts: { length: string; width: string }): StripLabels {
  const font = LABEL_FONT * scale
  const rm = ringMidRadius(i, CUT_RINGS, R_PX)
  const half = ringWidth(CUT_RINGS, R_PX) / 2
  const center = SCENE.x0 + Math.PI * rm
  const place = (s: string) => {
    const hw = labelWidth(s, font) / 2
    return Math.min(VIEW_W - STRIP_LABEL_MARGIN - hw, Math.max(STRIP_LABEL_MARGIN + hw, center))
  }
  const y = SCENE.cy + rm // 帯（ほどき終わり）の中心線
  return {
    font,
    length: { x: place(texts.length), y: y - half - 8 * scale },
    width: { x: place(texts.width), y: y + half + font + 2 * scale },
  }
}
