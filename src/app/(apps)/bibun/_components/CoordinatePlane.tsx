// ======================================================
// 座標平面（SVG）
//
// 軸・格子・目盛りを描き、中身（曲線・直線・点）は children で受け取る。
// 中身の部品（PlaneShapes.tsx）は usePlane() で座標変換を受け取って描く。
//
// ■ 操作（onViewChange を渡したときだけ有効。アニメ中は渡さずに止める）
//   - 1本指／マウスのドラッグ：パン
//   - 2本指：ピンチでズーム（指のあいだの点を中心に）
//   - ホイール：カーソルの位置を中心にズーム
//   - 右上のボタン：＋／−／全体表示に戻す
//   ジェスチャーは「始めたときの表示」からの差で計算する（少しずつ足すと誤差がたまってずれる）。
//
// ■ ページがスクロールしないように
//   SVG に touch-action: none を付ける（iPhone の Safari で、点を動かすとページが動く問題の対策）。
//   ホイールは passive: false で登録して preventDefault する（React の onWheel では止められない）。
//
// SVG の座標は px そのもの（viewBox = 実際の幅×高さ）。文字の大きさが画面幅で変わらない。
// 別のアプリ（積分など）でも使えるよう、微分のアプリ固有の事情は持ち込まない。
// ======================================================

"use client"

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import type { PointerEvent, ReactNode } from "react"
import { Btn } from "@/components/parts/buttons/Btn"
import { formatNumber } from "../_lib/polynomial"
import { useScale } from "./Display"
import {
  TICK_FONT, centerOf, makeTransform, panView, pinchView, textWidth, ticks, yLabelPlacement, zoomLimited,
} from "../_lib/viewport"
import type { Pt, Transform, View } from "../_lib/viewport"

const PlaneContext = createContext<Transform | null>(null)

/** 座標平面の中で、座標変換を受け取る */
export function usePlane(): Transform {
  const t = useContext(PlaneContext)
  if (!t) throw new Error("usePlane は CoordinatePlane の中で使う")
  return t
}

/** ボタン1回のズームの倍率 */
const ZOOM_STEP = 1.5
/** ホイールの感度 */
const WHEEL_RATE = 0.0015

interface Props {
  view: View
  /** 渡すとパン・ズームできる。渡さなければ表示は固定（アニメ中など） */
  onViewChange?: (v: View) => void
  /** 「全体表示に戻す」ボタンを押したとき。渡さなければボタンを出さない（パン・ズームを止めていても出せる） */
  onReset?: () => void
  /** 高さ ÷ 幅 */
  aspect?: number
  xLabel?: string
  yLabel?: string
  /** 読み上げ用の説明 */
  ariaLabel: string
  /**
   * 凡例（グラフ上のラベル）。md 以上ではグラフの左上に重ね、狭い画面ではグラフの下に出す
   * （スマホでグラフの上に重ねると、点や線を隠してしまうため）。
   */
  legend?: ReactNode
  /** true なら、どの幅でも凡例をグラフの下に出す（軸のラベルと重なるとき） */
  legendBelow?: boolean
  children?: ReactNode
}

/** 目盛りの数字を、端からこれ以上内側のときだけ出す（px）。「−2」の「−」が欠けて「2」に見えるのを防ぐ */
const EDGE = 16

/** 0〜size の中で、両端から margin 以上内側にあるか */
function inside(p: number, size: number, margin: number): boolean {
  return margin <= p && p <= size - margin
}

/** 画面上の座標 → SVG 内の px */
function local(svg: SVGSVGElement, clientX: number, clientY: number): Pt {
  const r = svg.getBoundingClientRect()
  return { x: clientX - r.left, y: clientY - r.top }
}

export function CoordinatePlane({
  view, onViewChange, onReset, aspect = 0.75, xLabel = "x", yLabel = "y", ariaLabel, legend, legendBelow = false, children,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const clipId = useId()
  const [width, setWidth] = useState(0)
  const legendRef = useRef<HTMLDivElement>(null)
  /**
   * 凡例がグラフに重なっているときの高さ（px）。縦軸の名前をその下に出す（「距離（m）」が凡例に隠れないように）。
   * 凡例が重なるのは md 以上で legendBelow でないときだけなので、実際の position を見て決める。
   */
  const [legendCover, setLegendCover] = useState(0)
  useEffect(() => {
    const el = legendRef.current
    if (!el) return
    const measure = () => setLegendCover(getComputedStyle(el).position === "absolute" ? el.offsetHeight + 8 : 0)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [])
  const height = Math.round(width * aspect)
  const t = makeTransform(view, width, height)
  // 大きく表示（Provider がなければ倍率 1。別のアプリで使っても影響しない）
  const { line, font } = useScale()
  const tickFont = TICK_FONT * font

  // 横幅に追従する
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ホイール・ジェスチャーから最新の値を読むための ref（レンダー中に書かず、描画後に更新する）
  const latest = useRef({ view, t, onViewChange })
  useLayoutEffect(() => {
    latest.current = { view, t, onViewChange }
  })
  /**
   * 表示を変える。描画を待たずに latest.view も書きかえる。
   * パンの直後・描画の前に2本目の指が触れても、1つ前の表示から始め直して飛ばないように。
   */
  const emit = (v: View) => {
    const change = latest.current.onViewChange
    if (!change) return
    latest.current.view = v
    change(v)
  }

  // ---- ホイール ----------------------------------------------------------------
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      const { view: v, t: tr, onViewChange: change } = latest.current
      if (!change) return
      e.preventDefault()
      const p = local(svg, e.clientX, e.clientY)
      const next = zoomLimited(v, tr.fromPx(p.x), tr.fromPy(p.y), Math.exp(e.deltaY * WHEEL_RATE))
      latest.current.view = next
      change(next)
    }
    svg.addEventListener("wheel", onWheel, { passive: false })
    return () => svg.removeEventListener("wheel", onWheel)
  }, [width])

  // ---- パン・ピンチ ----------------------------------------------------------------
  const pointers = useRef(new Map<number, Pt>())
  /** ジェスチャーを始めたときの表示と指の位置 */
  const start = useRef<{ view: View; pts: Map<number, Pt> } | null>(null)
  const restart = () => {
    start.current = { view: latest.current.view, pts: new Map(pointers.current) }
  }

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!onViewChange) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, local(e.currentTarget, e.clientX, e.clientY))
    restart()
  }

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!latest.current.onViewChange || !start.current || !pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, local(e.currentTarget, e.clientX, e.clientY))
    const s = start.current
    const ids = [...pointers.current.keys()].filter((id) => s.pts.has(id))
    const now = (id: number) => pointers.current.get(id)!
    const then = (id: number) => s.pts.get(id)!
    if (ids.length === 1) emit(panView(s.view, then(ids[0]), now(ids[0]), width, height))
    else if (ids.length >= 2) {
      emit(pinchView(s.view, then(ids[0]), then(ids[1]), now(ids[0]), now(ids[1]), width, height))
    }
  }

  // pointerup・pointercancel が来ずにキャプチャだけ外れることがあるので、lostpointercapture でも呼ぶ。
  // （指の記録が残ると、次の1本指の操作がピンチとして扱われてしまう）
  const onPointerEnd = (e: PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.delete(e.pointerId)) return
    // 2本指から1本指になったら、そこからパンを始め直す（表示が飛ばないように）
    if (pointers.current.size > 0) restart()
    else start.current = null
  }

  const zoomButton = (r: number) => {
    const [cx, cy] = centerOf(view)
    emit(zoomLimited(view, cx, cy, r))
  }

  // ---- 目盛り ----------------------------------------------------------------------
  const xt = width > 0 ? ticks(view.xMin, view.xMax, Math.max(3, width / 90)) : []
  const yt = height > 0 ? ticks(view.yMin, view.yMax, Math.max(3, height / 70)) : []
  // 軸が画面の外にあるときは、目盛りの数字を端に寄せて出す
  // 横軸が上の外にあるときも、目盛りの数字は下端に出す（上端は凡例とズームボタンに隠れるため。2026-10-25 レビュー指摘）
  const bottomY = height - tickFont - 6
  const axisY = t.toPy(0) < 0 ? bottomY : Math.min(bottomY, t.toPy(0))
  const ytShown = yt.filter((y) => y !== 0 && inside(t.toPy(y), height, tickFont))
  const yLabel0 = yLabelPlacement(t.toPx(0), width, Math.max(0, ...ytShown.map((y) => textWidth(formatNumber(y), tickFont))))
  const showXAxis = view.yMin <= 0 && 0 <= view.yMax
  const showYAxis = view.xMin <= 0 && 0 <= view.xMax

  return (
    // 枠線は SVG ではなく外側の div に付ける。SVG に付けると、枠線の分だけ描画が縮んで
    // ポインタの位置と 1〜2px ずれる（2026-10-25 レビュー指摘）
    <div className="relative w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <div ref={wrapRef} className="w-full">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          // role="img" にすると中の点（DragPoint）が読み上げから見えなくなるので group にする
          role="group"
          aria-label={ariaLabel}
          className={`block w-full select-none ${onViewChange ? "cursor-move" : ""}`}
          style={{ touchAction: "none", height: height || undefined, aspectRatio: width ? undefined : `${1 / aspect}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onLostPointerCapture={onPointerEnd}
        >
          {width > 0 && (
            <PlaneContext.Provider value={t}>
              <defs>
                <clipPath id={clipId}>
                  <rect x={0} y={0} width={width} height={height} />
                </clipPath>
              </defs>
              <g clipPath={`url(#${clipId})`}>
                {/* 格子 */}
                <g className="stroke-gray-200 dark:stroke-gray-700" strokeWidth={line}>
                  {xt.map((x) => <line key={`gx${x}`} x1={t.toPx(x)} x2={t.toPx(x)} y1={0} y2={height} />)}
                  {yt.map((y) => <line key={`gy${y}`} y1={t.toPy(y)} y2={t.toPy(y)} x1={0} x2={width} />)}
                </g>
                {/* 軸 */}
                <g className="stroke-gray-500 dark:stroke-gray-400" strokeWidth={1.5 * line}>
                  {showXAxis && <line x1={0} x2={width} y1={t.toPy(0)} y2={t.toPy(0)} />}
                  {showYAxis && <line y1={0} y2={height} x1={t.toPx(0)} x2={t.toPx(0)} />}
                </g>
                {/* 目盛りの数字（0 は原点の「O」にまとめる） */}
                {/* 数字は格子や線の上でも読めるよう、背景色のふちどりを付ける */}
                <g
                  className="fill-gray-600 dark:fill-gray-300 stroke-white dark:stroke-gray-900"
                  fontSize={tickFont} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round"
                >
                  {xt.filter((x) => x !== 0 && inside(t.toPx(x), width, EDGE)).map((x) => (
                    <text key={`tx${x}`} x={t.toPx(x)} y={axisY + tickFont + 2} textAnchor="middle">{formatNumber(x)}</text>
                  ))}
                  {ytShown.map((y) => (
                    <text key={`ty${y}`} x={yLabel0.x} y={t.toPy(y) + tickFont / 3} textAnchor={yLabel0.anchor}>{formatNumber(y)}</text>
                  ))}
                  {showXAxis && showYAxis && (
                    <text x={t.toPx(0) - 5} y={t.toPy(0) + tickFont + 2} textAnchor="end">O</text>
                  )}
                  {/* 軸の名前。軸が画面の外にあっても、目盛りの数字と同じく端に寄せて出す
                      （「時間（秒）」「距離（m）」のときは、軸の名前がいちばん大事な情報になるため） */}
                  <text
                    x={width - 6}
                    y={showXAxis ? t.toPy(0) - 6 : axisY - 6}
                    textAnchor="end" fontStyle="italic"
                  >
                    {xLabel}
                  </text>
                  <text
                    x={showYAxis ? t.toPx(0) + 6 : yLabel0.x}
                    y={legendCover + tickFont + 4}
                    textAnchor={showYAxis ? "start" : yLabel0.anchor} fontStyle="italic"
                  >
                    {yLabel}
                  </text>
                </g>
                {children}
              </g>
            </PlaneContext.Provider>
          )}
        </svg>
      </div>

      {legend && (
        // 重ねたときは、下のグラフをパンできるよう pointer-events-none。
        // 幅は右上のズームボタン（約 14rem）にかからないところまで
        <div ref={legendRef} className={legendBelow ? "px-3 pb-2" : "px-3 pb-2 md:absolute md:left-2 md:top-2 md:max-w-[calc(100%-15rem)] md:px-2 md:py-1 md:rounded-lg md:bg-white/90 md:dark:bg-gray-900/90 md:pointer-events-none"}>
          {legend}
        </div>
      )}

      {/* ズームのボタン（グラフの右上に重ねる） */}
      {(onViewChange || onReset) && (
        <div className="absolute top-2 right-2 flex gap-1">
          {onViewChange && (
            <>
              <Btn color="neutral" className="w-10 h-10 text-lg" ariaLabel="拡大" onClick={() => zoomButton(1 / ZOOM_STEP)}>＋</Btn>
              <Btn color="neutral" className="w-10 h-10 text-lg" ariaLabel="縮小" onClick={() => zoomButton(ZOOM_STEP)}>−</Btn>
            </>
          )}
          {onReset && (
            <Btn color="neutral" className="h-10 px-2" onClick={onReset}>全体表示に戻す</Btn>
          )}
        </div>
      )}
    </div>
  )
}
