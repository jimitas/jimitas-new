// ======================================================
// ステップ④ 速さと距離とくらべる（要件 §4.4、スライド15・23・24）
//
// 左：横軸 時間 x、縦軸 速さ 2x。右：横軸 半径 r、縦軸 円周 2πr。
// 共通のスライダーで x（＝ r）を動かすと、両方のグラフの下の三角形が同時に塗られ、
// 面積が「左：x²（距離）」「右：πr²（円の面積）」と出る（F4-2）。
// 「細い長方形を積み上げて塗る」にすると、三角形をまん中の高さの長方形で塗る（F4-3。_lib/compare.ts）。
//
// グラフは共通の座標平面（@/components/parts/graph）。表示範囲は固定（パン・ズームしない）。
// 色は ③ の輪と同じ濃い青・明るい青を交互に（右の長方形1本 ＝ ③ の帯1本、を色でも結びつける）。
// ======================================================

"use client"

import { useState } from "react"
import { BtnMode } from "@/components/parts/buttons/BtnMode"
import { CoordinatePlane } from "@/components/parts/graph/CoordinatePlane"
import { blurAfterPointer, useText } from "@/components/parts/graph/Display"
import { Curve, Dot, PlaneText, Polygon } from "@/components/parts/graph/PlaneShapes"
import { formatFixed, formatNumber } from "@/lib/graph/format"
import {
  DEFAULT_RECTS, K_CIRCLE, K_SPEED, RECT_COUNTS, X_INIT, X_MAX, X_STEP, compareView, midRects, rectsArea, triangleArea,
} from "../_lib/compare"
import {
  CIRCLE_AXES, CIRCLE_TITLE, RECTS_NOTE, RECTS_TOGGLE, SAME_SHAPE_NOTE, SPEED_AXES, SPEED_TITLE, STEP4_GUIDE, SUMMARY,
  circleAreaResult, circleAreaText, distanceResult, distanceText,
} from "../_lib/text"

/** 長方形の色（③ の輪と同じ2色を交互に。RingDisk.tsx の RING_CLASS と同じ濃さ） */
const RECT_FILL = ["fill-accent-600 dark:fill-accent-500", "fill-accent-300 dark:fill-accent-200"]

/** 面積・値の表示（小数第2位まで、末尾の 0 は落とす。受け入れ基準6：x = 2 で「4」「12.57」） */
const show = (v: number) => formatFixed(v, 2)

interface GraphProps {
  k: number
  x: number
  rects: number | null
  axes: { x: string; y: string }
  title: string
  ariaLabel: string
}

/** 直線 y = kx と、0〜x の下の三角形（または細い長方形） */
function Graph({ k, x, rects, axes, title, ariaLabel }: GraphProps) {
  const view = compareView(k)
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="text-base font-bold text-gray-800 dark:text-gray-100">{title}</figcaption>
      {/* 横軸の名前は共通の座標平面に描かせず（中身より先に描くので、塗りに隠れる）、塗りの上に自分で描く */}
      <CoordinatePlane view={view} ariaLabel={ariaLabel} xLabel="" yLabel={axes.y} aspect={0.8}>
        {rects === null ? (
          <Polygon points={[[0, 0], [x, 0], [x, k * x]]} className="fill-accent-300 dark:fill-accent-700" opacity={0.8} />
        ) : (
          midRects(k, x, rects).map((r, j) => (
            <Polygon
              key={j} className={RECT_FILL[j % 2]}
              points={[[r.x0, 0], [r.x1, 0], [r.x1, r.height], [r.x0, r.height]]}
            />
          ))
        )}
        <Curve fn={(t) => k * t} className="stroke-gray-800 dark:stroke-gray-100" />
        <PlaneText
          x={view.xMax} y={0} dx={-6} dy={-6} anchor="end" size={14}
          className="fill-gray-600 stroke-white dark:fill-gray-300 dark:stroke-gray-900"
        >
          {axes.x}
        </PlaneText>
        {x > 0 && <Dot x={x} y={k * x} className="fill-warm-500 stroke-white dark:stroke-gray-900" />}
      </CoordinatePlane>
    </figure>
  )
}

export function StepCompare() {
  const [x, setX] = useState(X_INIT)
  const [useRects, setUseRects] = useState(false)
  const [n, setN] = useState<number>(DEFAULT_RECTS)
  const readoutText = useText("readout")
  const rects = useRects ? n : null
  const xs = formatNumber(x)
  /** 面積。長方形で塗っているときは長方形の合計から出す（三角形と同じ値になることを、画面でも確かめられるように） */
  const area = (k: number) => (rects === null ? triangleArea(k, x) : rectsArea(midRects(k, x, rects)))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-gray-700 dark:text-gray-200">{STEP4_GUIDE}</p>

      {/* 2つのグラフ（F4-1）。スマホでは上下 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Graph k={K_SPEED} x={x} rects={rects} axes={SPEED_AXES} title={SPEED_TITLE}
            ariaLabel={`速さ 2x のグラフ。x = ${xs} までの下の面積は ${show(triangleArea(K_SPEED, x))}`}
          />
          <p className="text-lg text-gray-800 dark:text-gray-100 tabular-nums">{distanceText(xs)}</p>
          <p className={`${readoutText} font-bold tabular-nums text-gray-800 dark:text-gray-100`} data-testid="area-speed">
            {distanceResult(show(area(K_SPEED)))}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Graph k={K_CIRCLE} x={x} rects={rects} axes={CIRCLE_AXES} title={CIRCLE_TITLE}
            ariaLabel={`円周 2πr のグラフ。r = ${xs} までの下の面積は ${show(triangleArea(K_CIRCLE, x))}`}
          />
          <p className="text-lg text-gray-800 dark:text-gray-100 tabular-nums">{circleAreaText(xs)}</p>
          <p className={`${readoutText} font-bold tabular-nums text-gray-800 dark:text-gray-100`} data-testid="area-circle">
            {circleAreaResult(show(area(K_CIRCLE)))}
          </p>
        </div>
      </div>

      {/* 共通のスライダー（F4-2） */}
      <div className="flex flex-col gap-1">
        <p className="text-base font-bold text-gray-800 dark:text-gray-100 tabular-nums">
          <label htmlFor="sekibun-x">x（＝ r）</label>
          <span aria-hidden="true"> ＝ {xs}</span>
        </p>
        <input
          id="sekibun-x" type="range" min={0} max={X_MAX} step={X_STEP} value={x} aria-valuetext={`x = r = ${xs}`}
          onPointerUp={blurAfterPointer} onChange={(e) => setX(Number(e.target.value))} className="w-full accent-warm-500"
        />
      </div>

      {/* 細い長方形（F4-3） */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800 dark:text-gray-100">
          <input type="checkbox" className="w-5 h-5 accent-brand-500" checked={useRects} onChange={(e) => setUseRects(e.target.checked)} />
          {RECTS_TOGGLE}
        </label>
        {useRects && (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="長方形の本数">
              {RECT_COUNTS.map((c) => (
                <BtnMode key={c} value={c} current={n} onChange={setN} className="shrink-0 w-14">{c}</BtnMode>
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{RECTS_NOTE}</p>
          </>
        )}
      </div>

      {/* 説明とまとめ表（F4-4） */}
      <div className="rounded-xl border-2 border-accent-300 dark:border-accent-700 bg-accent-50 dark:bg-gray-800 px-4 py-3 text-lg font-bold text-gray-800 dark:text-gray-100">
        {SAME_SHAPE_NOTE}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-base text-gray-800 dark:text-gray-100 border-collapse">
          <thead>
            <tr>
              {/* 左上は見出しではないので td（中身の無い見出しにすると、読み上げで名前のない見出しになる） */}
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2" />
              {SUMMARY.cols.map((c) => (
                <th key={c} className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-50 dark:bg-gray-800">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUMMARY.rows.map((r) => (
              <tr key={r.head}>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left bg-gray-50 dark:bg-gray-800 whitespace-nowrap">{r.head}</th>
                {r.cells.map((c) => <td key={c} className="border border-gray-300 dark:border-gray-600 px-3 py-2">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
