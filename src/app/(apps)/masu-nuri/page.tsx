"use client"

// ======================================================
// せんやマスのいろぬり
//
// 14×24 のマス目に「ますをぬる」「せんをひく」「てがき」の
// 3 モードで自由に書き込める。SVG ベースで4レイヤ構成：
//   - セル（180枚の rect）
//   - 水平線セグメント
//   - 垂直線セグメント
//   - 手書きストローク（path 群）
//
// 旧 jimitas.com「もっと学習コンテンツ」内の masu 機能を移植・拡張。
// 手書きは算数ノート風の補足メモ（変化のきまり等）に活用できる。
// ======================================================

import { useState, useCallback, useRef } from "react"
import { useSound } from "@/hooks/useSound"
import { BtnConfirm } from "@/components/parts/buttons/BtnConfirm"

// マス数（旧 10×18 → 14×24）
const ROWS = 14
const COLS = 24

type Mode = "cells" | "lines" | "tegaki"

const COLORS = [
  { value: "#dc2626", label: "あか" },
  { value: "#1f2937", label: "くろ" },
  { value: "#fde047", label: "きいろ" },
  { value: "#2563eb", label: "あお" },
  { value: "#f97316", label: "オレンジ" },
  { value: "#22c55e", label: "みどり" },
  { value: "#a855f7", label: "むらさき" },
  { value: "#ec4899", label: "ピンク" },
  { value: "#8b4513", label: "ちゃいろ" },
  { value: "#ffffff", label: "しろ（けす）" },
]

// セル/ライン1単位を 50 とする（viewBox 用の論理座標）
const CELL = 50
const STROKE_WIDTH = 3

// 確定済みストローク
type Stroke = {
  id: string
  color: string
  d: string  // SVG path "M x,y L x,y L ..."
}

export default function MasuNuriPage() {
  const [mode, setMode] = useState<Mode>("cells")
  const [color, setColor] = useState(COLORS[0].value)
  const [cellColors, setCellColors] = useState<Record<string, string>>({})
  const [hLineColors, setHLineColors] = useState<Record<string, string>>({})
  const [vLineColors, setVLineColors] = useState<Record<string, string>>({})
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const { play } = useSound()

  // 手書き中のストローク：PointerMove 中は state を更新せず DOM 直接更新
  // （memory: feedback_drag_dom_direct に従い追従遅延を防ぐ）
  const inProgressPathRef = useRef<SVGPathElement | null>(null)
  const inProgressDataRef = useRef<string>("")

  // -------------------------------------------------------
  // ますをぬる（同じ色なら消す＝トグル、置く瞬間に pi 効果音）
  // -------------------------------------------------------
  const paintCell = useCallback((r: number, c: number) => {
    if (mode !== "cells") return
    play("/sounds/pi.mp3", 0.4)
    const key = `${r}-${c}`
    setCellColors(prev => {
      if (prev[key] === color) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: color }
    })
  }, [mode, color, play])

  const paintHLine = useCallback((r: number, c: number) => {
    if (mode !== "lines") return
    play("/sounds/pi.mp3", 0.4)
    const key = `${r}-${c}`
    setHLineColors(prev => {
      if (prev[key] === color) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: color }
    })
  }, [mode, color, play])

  const paintVLine = useCallback((r: number, c: number) => {
    if (mode !== "lines") return
    play("/sounds/pi.mp3", 0.4)
    const key = `${r}-${c}`
    setVLineColors(prev => {
      if (prev[key] === color) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: color }
    })
  }, [mode, color, play])

  // -------------------------------------------------------
  // 手書きモード：ポインタイベント処理
  //   onPointerDown: ストローク開始
  //   onPointerMove: in-progress path を DOM 直接更新（再レンダーなし）
  //   onPointerUp:   strokes 配列に確定追加
  // -------------------------------------------------------
  const svgPoint = (svg: SVGSVGElement, clientX: number, clientY: number) => {
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const transformed = pt.matrixTransform(ctm.inverse())
    return { x: transformed.x, y: transformed.y }
  }

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode !== "tegaki") return
    const { x, y } = svgPoint(e.currentTarget, e.clientX, e.clientY)
    inProgressDataRef.current = `M ${x.toFixed(1)},${y.toFixed(1)}`
    if (inProgressPathRef.current) {
      inProgressPathRef.current.setAttribute("d", inProgressDataRef.current)
      inProgressPathRef.current.setAttribute("stroke", color)
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode !== "tegaki" || !inProgressDataRef.current) return
    const { x, y } = svgPoint(e.currentTarget, e.clientX, e.clientY)
    inProgressDataRef.current += ` L ${x.toFixed(1)},${y.toFixed(1)}`
    if (inProgressPathRef.current) {
      inProgressPathRef.current.setAttribute("d", inProgressDataRef.current)
    }
  }

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode !== "tegaki" || !inProgressDataRef.current) return
    // 1点だけのストロークは無視（誤タップ）
    const data = inProgressDataRef.current
    if (data.includes("L")) {
      setStrokes(prev => [...prev, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        color,
        d: data,
      }])
    }
    inProgressDataRef.current = ""
    if (inProgressPathRef.current) {
      inProgressPathRef.current.setAttribute("d", "")
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  // 「ひとつもどす」：直近のストロークを取り消し
  const undoStroke = () => {
    if (strokes.length === 0) return
    play("/sounds/cancel.mp3", 0.4)
    setStrokes(prev => prev.slice(0, -1))
  }

  // 「てがきだけけす」：ストロークすべてクリア（cells / lines は残す）
  // ぬり絵は残したまま、ノート風メモだけ書き直したい時に使う
  const clearStrokes = () => {
    if (strokes.length === 0) return
    play("/sounds/reset.mp3", 0.4)
    setStrokes([])
  }

  // モード/色/リセット ボタン用
  const playSwitchSound = useCallback(() => {
    play("/sounds/set.mp3", 0.4)
  }, [play])

  const reset = () => {
    play("/sounds/reset.mp3", 0.4)
    // BtnConfirm が確認ダイアログをクローズしてから onConfirm を呼ぶので
    // ここでは追加の confirmingReset 操作は不要
    setCellColors({})
    setHLineColors({})
    setVLineColors({})
    setStrokes([])
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        せんやマスのいろぬり
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        マスをぬったり、せんをひいたり、手がきでメモしたりして、じゆうにえや学びをのこそう。
      </p>

      {/* ===== コントロール ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* モード切替（3種） */}
          <div className="flex gap-1">
            <button
              onClick={() => { playSwitchSound(); setMode("cells") }}
              className={`px-3 py-2 rounded-lg text-sm font-bold ${
                mode === "cells"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              ますをぬる
            </button>
            <button
              onClick={() => { playSwitchSound(); setMode("lines") }}
              className={`px-3 py-2 rounded-lg text-sm font-bold ${
                mode === "lines"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              せんをひく
            </button>
            <button
              onClick={() => { playSwitchSound(); setMode("tegaki") }}
              className={`px-3 py-2 rounded-lg text-sm font-bold ${
                mode === "tegaki"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              てがき
            </button>
          </div>

          {/* 色パレット */}
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => { playSwitchSound(); setColor(c.value) }}
                title={c.label}
                aria-label={c.label}
                className={`w-9 h-9 rounded-md border-2 transition-all ${
                  color === c.value
                    ? "border-gray-700 dark:border-gray-200 scale-110 shadow-md"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>

          {/* 右側：てがきモード時の「ひとつもどす」「てがきだけけす」＋ リセット */}
          <div className="ml-auto flex items-center gap-2">
            {mode === "tegaki" && strokes.length > 0 && (
              <>
                <button
                  onClick={undoStroke}
                  className="px-3 py-2 rounded-lg bg-warm-100 dark:bg-warm-900 text-warm-800 dark:text-warm-200 text-sm hover:bg-warm-200 dark:hover:bg-warm-800"
                >
                  ↶ ひとつもどす
                </button>
                <button
                  onClick={clearStrokes}
                  className="px-3 py-2 rounded-lg bg-warm-100 dark:bg-warm-900 text-warm-800 dark:text-warm-200 text-sm hover:bg-warm-200 dark:hover:bg-warm-800"
                  title="てがきメモをぜんぶ消す（マス・線は残ります）"
                >
                  🗑 てがきだけけす
                </button>
              </>
            )}
            <BtnConfirm
              label="リセット"
              promptLabel="もどす？"
              yesColor="red"
              onConfirm={reset}
            />
          </div>
        </div>
      </div>

      {/* ===== マス目 SVG ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
          className="w-full h-auto"
          style={{ touchAction: "none", cursor: mode === "tegaki" ? "crosshair" : "default" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* セル本体（背景） */}
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) => {
              const key = `${r}-${c}`
              return (
                <rect
                  key={`cell-${key}`}
                  x={c * CELL}
                  y={r * CELL}
                  width={CELL}
                  height={CELL}
                  fill={cellColors[key] ?? "#ffffff"}
                  stroke="#e5e7eb"
                  strokeWidth={0.5}
                  onClick={() => paintCell(r, c)}
                  style={{ cursor: mode === "cells" ? "pointer" : "default" }}
                  pointerEvents={mode === "cells" ? "all" : "none"}
                />
              )
            })
          )}

          {/* 水平線（各セルの上端） */}
          {Array.from({ length: ROWS + 1 }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) => {
              const key = `${r}-${c}`
              const fill = hLineColors[key]
              return (
                <rect
                  key={`hl-${key}`}
                  x={c * CELL}
                  y={r * CELL - 4}
                  width={CELL}
                  height={8}
                  fill={fill ?? "transparent"}
                  onClick={() => paintHLine(r, c)}
                  style={{ cursor: mode === "lines" ? "pointer" : "default" }}
                  pointerEvents={mode === "lines" ? "all" : "none"}
                />
              )
            })
          )}

          {/* 垂直線（各セルの左端） */}
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS + 1 }).map((_, c) => {
              const key = `${r}-${c}`
              const fill = vLineColors[key]
              return (
                <rect
                  key={`vl-${key}`}
                  x={c * CELL - 4}
                  y={r * CELL}
                  width={8}
                  height={CELL}
                  fill={fill ?? "transparent"}
                  onClick={() => paintVLine(r, c)}
                  style={{ cursor: mode === "lines" ? "pointer" : "default" }}
                  pointerEvents={mode === "lines" ? "all" : "none"}
                />
              )
            })
          )}

          {/* 手がきストローク（確定済み） */}
          {strokes.map(s => (
            <path
              key={s.id}
              d={s.d}
              stroke={s.color}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
            />
          ))}

          {/* 手がきストローク（描画中・DOM直接更新） */}
          <path
            ref={inProgressPathRef}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        </svg>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        💡 「ますをぬる」「せんをひく」は同じ色をもう一度タップで消去。「てがき」は変化のきまりや矢印などのメモに使えるよ。
      </p>
    </div>
  )
}
