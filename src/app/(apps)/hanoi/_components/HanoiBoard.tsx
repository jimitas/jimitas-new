// ======================================================
// 棒と円盤の SVG（ステップ①②⑤で共有）
//
// 円盤の幅は枚数から自動で決める。色は _lib/colors.ts（円盤の色＝その円盤が動く、の意味だけ）。
// 動いている最中の円盤（flying）は、持ち上げる → 横に動く → 下ろす の弧で描く。
// ======================================================

"use client"

import type { Ref } from "react"
import { useBig } from "@/components/parts/graph/Display"
import { BASE_COLOR, DISK_STROKE, DISK_STROKE_WIDTH, POLE_COLOR, diskColor, labelColor } from "../_lib/colors"
import { diskMark } from "../_lib/play"
import { PEGS } from "../_lib/solve"
import type { Move, Peg, Pegs } from "../_lib/solve"

export const BOARD_W = 600
export const PEG_X: Record<Peg, number> = { A: 100, B: 300, C: 500 }
export const BASE_Y = 250
const TOP_Y = 28 // 持ち上げたときの円盤の中心の高さ

/** 円盤1枚の高さ */
export function diskH(n: number): number {
  return Math.min(26, 190 / Math.max(n, 1))
}
/** 円盤の幅（小さい円盤ほど細い） */
export function diskW(d: number, n: number): number {
  if (n <= 1) return 110
  return 54 + ((d - 1) * 116) / (n - 1)
}
/** 棒の下から height 枚目（0 始まり）の円盤の中心の y */
export function centerY(height: number, n: number): number {
  return BASE_Y - diskH(n) * (height + 0.5)
}

export interface Flying {
  move: Move
  /** 0〜1（動き始め → 着地） */
  u: number
  /** 着地する高さ（移動先の棒にすでにある円盤の枚数） */
  destHeight: number
  /** 出発した高さ（動かす円盤の下にある枚数） */
  fromHeight: number
}

interface Props {
  pegs: Pegs
  n: number
  flying?: Flying | null
  /** 持ち上げて止まっている円盤（タップ操作中）：その棒の一番上を持ち上げて描く */
  lifted?: Peg | null
  /** 光らせる棒（移動先の候補・ドロップ先など） */
  highlight?: Peg | null
  onPegClick?: (p: Peg) => void
  onPegPointerDown?: (p: Peg, e: React.PointerEvent) => void
  /** ドラッグ中の円盤（棒には描かず、この位置に描く。SVG 座標） */
  dragging?: { disk: number; x: number; y: number } | null
  svgRef?: Ref<SVGSVGElement>
  ariaLabel?: string
}

export function HanoiBoard({ pegs, n, flying, lifted, highlight, onPegClick, onPegPointerDown, dragging, svgRef, ariaLabel }: Props) {
  const big = useBig()
  const h = diskH(n)
  const fs = Math.min(h * 0.72, big ? 20 : 16)

  const diskShape = (d: number, cx: number, cy: number, key: string, extra?: Record<string, string | number>) => {
    const w = diskW(d, n)
    const fill = diskColor(d)
    return (
      <g key={key} data-disk={d} {...extra}>
        <rect
          x={cx - w / 2}
          y={cy - h / 2 + 0.5}
          width={w}
          height={h - 1}
          rx={Math.min(8, h / 2.2)}
          fill={fill}
          stroke={DISK_STROKE}
          strokeWidth={DISK_STROKE_WIDTH}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fs}
          fontWeight={700}
          fill={labelColor(fill)}
          style={{ pointerEvents: "none" }}
        >
          {diskMark(d)}
        </text>
      </g>
    )
  }

  // 動いている円盤：持ち上げ(0〜0.25) → 横(0.25〜0.75) → 下ろす(0.75〜1)
  let flyShape: React.ReactNode = null
  if (flying) {
    const { move, u, destHeight, fromHeight } = flying
    const x0 = PEG_X[move.from]
    const x1 = PEG_X[move.to]
    const y0 = centerY(fromHeight, n)
    const y1 = centerY(destHeight, n)
    let x: number
    let y: number
    if (u < 0.25) {
      x = x0
      y = y0 + (TOP_Y - y0) * (u / 0.25)
    } else if (u < 0.75) {
      x = x0 + (x1 - x0) * ((u - 0.25) / 0.5)
      y = TOP_Y
    } else {
      x = x1
      y = TOP_Y + (y1 - TOP_Y) * ((u - 0.75) / 0.25)
    }
    flyShape = diskShape(move.disk, x, y, "fly", { "data-flying": 1 })
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${BOARD_W} ${BASE_Y + 40}`}
      className="w-full select-none touch-none"
      role="img"
      aria-label={ariaLabel ?? "3本の棒と円盤"}
      data-board
    >
      {/* 台 */}
      <rect x={20} y={BASE_Y} width={BOARD_W - 40} height={10} rx={4} fill={BASE_COLOR} />
      {PEGS.map((p) => (
        <g key={p}>
          {highlight === p && (
            <rect x={PEG_X[p] - 90} y={8} width={180} height={BASE_Y + 2} rx={10} fill="none" stroke={POLE_COLOR} strokeWidth={2} strokeDasharray="6 4" />
          )}
          <rect x={PEG_X[p] - 4} y={40} width={8} height={BASE_Y - 40} rx={3} fill={POLE_COLOR} />
          {pegs[p].map((d, i) => {
            const isTop = i === pegs[p].length - 1
            if (dragging && dragging.disk === d && isTop) return null
            const up = lifted === p && isTop
            return diskShape(d, PEG_X[p], up ? TOP_Y : centerY(i, n), `${p}${i}`, { "data-peg": p })
          })}
          <text
            x={PEG_X[p]}
            y={BASE_Y + 32}
            textAnchor="middle"
            fontSize={big ? 26 : 20}
            fontWeight={700}
            className="fill-gray-700 dark:fill-gray-200"
          >
            {p}
          </text>
          {/* 当たり判定（棒の周りを広めに） */}
          <rect
            x={PEG_X[p] - 95}
            y={0}
            width={190}
            height={BASE_Y + 40}
            fill="transparent"
            data-hit={p}
            style={{ cursor: onPegClick || onPegPointerDown ? "pointer" : "default" }}
            onClick={onPegClick ? () => onPegClick(p) : undefined}
            onPointerDown={onPegPointerDown ? (e) => onPegPointerDown(p, e) : undefined}
          />
        </g>
      ))}
      {flyShape}
      {dragging && diskShape(dragging.disk, dragging.x, dragging.y, "drag")}
    </svg>
  )
}
