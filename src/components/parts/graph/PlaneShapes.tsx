// ======================================================
// 座標平面の中に描く部品（CoordinatePlane の children に置く）
//
// どれも世界座標で受け取り、usePlane() の座標変換で px にして描く。
// 色は className（stroke-* / fill-*）で渡す。色だけに頼らないよう、線種は dashed で変えられる。
//
// ■ DragPoint（ドラッグで動かせる点）
//   当たり判定は半径 20px 以上（微分の意味がわかるの要件：タッチ操作。HIT_RADIUS は @/lib/graph/viewport でテスト固定）。
//   見える点より大きい透明な円を重ねる。キーボードで選んだときは点線の枠を出す。
//   押した点で setPointerCapture し、指が点から外れても追いかける。押しただけでは動かさない。
//   stopPropagation して、点を動かしているあいだ座標平面がパンしないようにする。
// ======================================================

"use client"

import type { KeyboardEvent, PointerEvent, ReactNode } from "react"
import { useRef } from "react"
import { HIT_RADIUS, curvePoints, lineEnds } from "@/lib/graph/viewport"
import { usePlane } from "./CoordinatePlane"
import { blurAfterPointer, useScale } from "./Display"

/** 破線の模様（px）。大きく表示では線の倍率だけ伸ばす */
const dash = (k: number) => `${8 * k} ${6 * k}`

/** これ以上（px）指が動いたらドラッグとみなす */
const DRAG_THRESHOLD = 4

/** 関数のグラフ */
export function Curve({ fn, className, width = 3, dashed = false }: {
  fn: (x: number) => number
  className: string
  width?: number
  dashed?: boolean
}) {
  const t = usePlane()
  const { line } = useScale()
  const d = curvePoints(fn, t).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("")
  return <path d={d} fill="none" className={className} strokeWidth={width * line} strokeDasharray={dashed ? dash(line) : undefined} strokeLinejoin="round" />
}

/** 点 (x0, y0) を通る傾き slope の直線（表示の端から端まで） */
export function InfiniteLine({ x0, y0, slope, className, width = 2.5, dashed = false }: {
  x0: number
  y0: number
  slope: number
  className: string
  width?: number
  dashed?: boolean
}) {
  const t = usePlane()
  const { line } = useScale()
  const [x1, y1, x2, y2] = lineEnds(x0, y0, slope, t)
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className={className} strokeWidth={width * line} strokeDasharray={dashed ? dash(line) : undefined} strokeLinecap="round" />
}

/** 線分 */
export function Segment({ x1, y1, x2, y2, className, width = 2, dashed = false }: {
  x1: number
  y1: number
  x2: number
  y2: number
  className: string
  width?: number
  dashed?: boolean
}) {
  const t = usePlane()
  const { line } = useScale()
  return (
    <line
      x1={t.toPx(x1)} y1={t.toPy(y1)} x2={t.toPx(x2)} y2={t.toPy(y2)}
      className={className} strokeWidth={width * line} strokeDasharray={dashed ? dash(line) : undefined}
    />
  )
}

/** 文字。dx, dy は px でのずらし */
export function PlaneText({ x, y, dx = 0, dy = 0, anchor = "start", className, size = 16, children }: {
  x: number
  y: number
  dx?: number
  dy?: number
  anchor?: "start" | "middle" | "end"
  className: string
  size?: number
  children: ReactNode
}) {
  const t = usePlane()
  const { font } = useScale()
  // ずらし量も文字に合わせて広げる（文字だけ大きくすると点に重なるため）
  return (
    <text
      x={t.toPx(x) + dx * font} y={t.toPy(y) + dy * font} textAnchor={anchor} fontSize={size * font} fontWeight="bold"
      className={className} paintOrder="stroke" strokeWidth={4} strokeLinejoin="round"
    >
      {children}
    </text>
  )
}

/**
 * 塗りつぶした多角形（三角形・長方形など）。points は世界座標の頂点。
 * 円の面積と円周のひみつ（積分アプリ）の ④ で、グラフの下の三角形と細い長方形を塗るために足した（2026-10-26）。
 */
export function Polygon({ points, className, opacity }: {
  points: [number, number][]
  className: string
  opacity?: number
}) {
  const t = usePlane()
  const d = points.map(([x, y]) => `${t.toPx(x).toFixed(1)},${t.toPy(y).toFixed(1)}`).join(" ")
  return <polygon points={d} className={className} opacity={opacity} />
}

/** 動かせない点 */
export function Dot({ x, y, className, r = 7 }: { x: number; y: number; className: string; r?: number }) {
  const t = usePlane()
  const { font } = useScale()
  return <circle cx={t.toPx(x)} cy={t.toPy(y)} r={r * font} className={className} strokeWidth={2} />
}

interface DragPointProps {
  x: number
  y: number
  /** 見える点の色（fill-* と stroke-*） */
  className: string
  /** ドラッグ中、指の位置の世界座標 x を渡す（スナップや曲線上への移動は呼ぶ側で行う） */
  onDrag: (x: number) => void
  /** ドラッグを終えたとき（実際に動かしたときだけ。押して離しただけでは呼ばない） */
  onDragEnd?: () => void
  /** ←→ キーで動かすとき（step は呼ぶ側で決める）。渡さなければキー操作なし */
  onKeyStep?: (dir: 1 | -1) => void
  /** 読み上げ用（例："点A"） */
  label: string
  disabled?: boolean
  r?: number
}

/** ドラッグで動かせる点 */
export function DragPoint({ x, y, className, onDrag, onDragEnd, onKeyStep, label, disabled = false, r = 9 }: DragPointProps) {
  const t = usePlane()
  const { font } = useScale()
  /** 押したときの指の位置と、そのときの点の位置（画面座標） */
  const press = useRef<{ clientX: number; clientY: number; px: number; moved: boolean } | null>(null)
  const cx = t.toPx(x)
  const cy = t.toPy(y)

  // 押しただけでは動かさない。DRAG_THRESHOLD 以上動かしたらドラッグとみなし、
  // 「押したときの点の位置 ＋ 指が動いた分」へ動かす（指の位置へ飛ばさない）。
  // 投影中に点を指し示すつもりでクリックしただけで値が変わり、記録表が消えるのを防ぐ（微分の意味がわかる。2026-10-25 レビュー指摘）。
  const onPointerDown = (e: PointerEvent<SVGGElement>) => {
    if (disabled) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    press.current = { clientX: e.clientX, clientY: e.clientY, px: cx, moved: false }
  }
  const onPointerMove = (e: PointerEvent<SVGGElement>) => {
    const p = press.current
    if (!p) return
    e.stopPropagation()
    const dx = e.clientX - p.clientX
    if (!p.moved && Math.hypot(dx, e.clientY - p.clientY) < DRAG_THRESHOLD) return
    p.moved = true
    onDrag(t.fromPx(p.px + dx))
  }
  const onPointerEnd = (e: PointerEvent<SVGGElement>) => {
    // マウス・タッチで触り終えたら選択を外す（残ると、リモコンの → が点を動かしてしまう）
    if (e.type === "pointerup") blurAfterPointer(e)
    const p = press.current
    if (!p) return
    e.stopPropagation()
    press.current = null
    if (p.moved) onDragEnd?.()
  }
  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    if (!onKeyStep || disabled) return
    if (e.key === "ArrowRight" || e.key === "ArrowUp") onKeyStep(1)
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onKeyStep(-1)
    else return
    e.preventDefault()
  }

  return (
    <g
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={`group outline-none ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    >
      {/* 当たり判定（透明） */}
      <circle cx={cx} cy={cy} r={HIT_RADIUS} fill="transparent" />
      {/* キーボードで選んだときだけ見える枠（マウス・タッチでは出ない） */}
      <circle
        cx={cx} cy={cy} r={HIT_RADIUS - 4} fill="none" strokeWidth={2} strokeDasharray="4 3"
        className="stroke-gray-700 dark:stroke-gray-200 opacity-0 group-focus-visible:opacity-100"
      />
      <circle cx={cx} cy={cy} r={r * font} className={className} strokeWidth={3} />
    </g>
  )
}
