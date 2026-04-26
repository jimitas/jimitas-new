"use client"

// ======================================================
// せんやマスのいろぬり
//
// 14×24 のマス目に「せんをひく」または「ますをぬる」モードで色を塗れる。
// SVG ベースで、セル・水平線・垂直線の3レイヤを切り替え可能。
// 旧 jimitas.com「もっと学習コンテンツ」内の masu 機能を移植。
// ======================================================

import { useState, useCallback } from "react"
import { useSound } from "@/hooks/useSound"

// マス数を拡大（旧 10×18 → 14×24、約1.86倍）
const ROWS = 14
const COLS = 24

type Mode = "cells" | "lines"

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

export default function MasuNuriPage() {
  const [mode, setMode] = useState<Mode>("cells")
  const [color, setColor] = useState(COLORS[0].value)
  const [cellColors, setCellColors] = useState<Record<string, string>>({})
  const [hLineColors, setHLineColors] = useState<Record<string, string>>({})
  const [vLineColors, setVLineColors] = useState<Record<string, string>>({})
  const [confirmingReset, setConfirmingReset] = useState(false)
  const { play } = useSound()

  // -------------------------------------------------------
  // 塗る処理（同じ色なら消す＝トグル）
  // 元実装に合わせて、置く瞬間に pi 効果音
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

  // モード/色/リセット ボタン用：ひと呼吸ある set 音
  const playSwitchSound = useCallback(() => {
    play("/sounds/set.mp3", 0.4)
  }, [play])

  const reset = () => {
    play("/sounds/reset.mp3", 0.4)
    setCellColors({})
    setHLineColors({})
    setVLineColors({})
    setConfirmingReset(false)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        せんやマスのいろぬり
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        マスをぬったり、せんをひいたりして、じゆうにえをかこう。
      </p>

      {/* ===== コントロール ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* モード切替 */}
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

          {/* リセット */}
          <div className="ml-auto">
            {!confirmingReset ? (
              <button
                onClick={() => { playSwitchSound(); setConfirmingReset(true) }}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-red-100 dark:hover:bg-red-900"
              >
                リセット
              </button>
            ) : (
              <div className="flex gap-1 items-center bg-red-50 dark:bg-red-950 rounded-lg p-1">
                <span className="text-xs text-red-700 dark:text-red-300 px-1">もどす？</span>
                <button
                  onClick={reset}
                  className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs font-bold"
                >
                  はい
                </button>
                <button
                  onClick={() => setConfirmingReset(false)}
                  className="px-2 py-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 text-xs"
                >
                  いいえ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== マス目 SVG ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
          className="w-full h-auto"
          style={{ touchAction: "none" }}
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

          {/* 水平線（各セルの上端） - row=0..ROWS, col=0..COLS-1 */}
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

          {/* 垂直線（各セルの左端） - row=0..ROWS-1, col=0..COLS */}
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
        </svg>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        💡 同じ色をもう一度クリックすると、消せるよ。
      </p>
    </div>
  )
}
