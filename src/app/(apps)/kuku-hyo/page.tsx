"use client"

// ======================================================
// 九九のひょう
//
// 10×10 のテーブルで九九の答えを学習する。
//   - 角の「×」をクリック: 全答えを一括表示/非表示
//   - 列ヘッダ（1〜9）クリック: その列の答えを表示/非表示
//   - 行ヘッダ（1〜9）クリック: その行の答えを表示/非表示
//   - 中央セルクリック: そのセルの答えを表示し、選択色でぬる
//
// 旧 jimitas.com「もっと学習コンテンツ」内の hyou 機能を移植。
// ======================================================

import { useState, useCallback } from "react"
import { useSound } from "@/hooks/useSound"

// セル背景色のパレット（白＝クリア相当は除外、視認できる8色）
const COLORS = [
  { value: "#fbcfe8", label: "ピンク" },
  { value: "#fef08a", label: "きいろ" },
  { value: "#bbf7d0", label: "みどり" },
  { value: "#bfdbfe", label: "あお" },
  { value: "#fed7aa", label: "オレンジ" },
  { value: "#e9d5ff", label: "むらさき" },
  { value: "#d6c4b0", label: "ちゃいろ" },
  { value: "#ffffff", label: "しろ（けす）" },
]

// 個別セルの状態：表示中なら shown=true、その時の色を記録
type CellState = {
  shown: boolean
  color: string
}

export default function KukuHyoPage() {
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value)
  const [showAll, setShowAll] = useState(false)
  // [0]は使わない（インデックス1..9のみ意味あり）。0埋めの10要素配列
  const [showCol, setShowCol] = useState<boolean[]>(Array(10).fill(false))
  const [showRow, setShowRow] = useState<boolean[]>(Array(10).fill(false))
  const [cellState, setCellState] = useState<Record<string, CellState>>({})
  const [confirmingReset, setConfirmingReset] = useState(false)
  const { play } = useSound()

  // ----- セルクリック：個別の答え表示と色塗りトグル -----
  const handleCellClick = useCallback((row: number, col: number) => {
    play("/sounds/pi.mp3", 0.4)
    const key = `${row}-${col}`
    setCellState(prev => {
      const cur = prev[key]
      if (cur?.shown) {
        // 表示中 → 非表示にして色もクリア
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: { shown: true, color: selectedColor } }
    })
  }, [selectedColor, play])

  // ----- 列ヘッダ：その列の答えをすべて表示/非表示 -----
  const handleColHeaderClick = useCallback((col: number) => {
    play("/sounds/pi.mp3", 0.4)
    setShowCol(prev => {
      const next = [...prev]
      next[col] = !prev[col]
      return next
    })
  }, [play])

  // ----- 行ヘッダ：その行の答えをすべて表示/非表示 -----
  const handleRowHeaderClick = useCallback((row: number) => {
    play("/sounds/pi.mp3", 0.4)
    setShowRow(prev => {
      const next = [...prev]
      next[row] = !prev[row]
      return next
    })
  }, [play])

  // ----- × ：全答えを一括表示/非表示 -----
  const handleAllClick = useCallback(() => {
    play("/sounds/set.mp3", 0.4)  // 全切替なので少し違う音
    setShowAll(prev => !prev)
  }, [play])

  // ----- リセット -----
  const reset = () => {
    play("/sounds/reset.mp3", 0.4)
    setShowAll(false)
    setShowCol(Array(10).fill(false))
    setShowRow(Array(10).fill(false))
    setCellState({})
    setConfirmingReset(false)
  }

  // ----- セル表示判定 -----
  const isAnswerVisible = (row: number, col: number) => {
    return showAll
      || showCol[col]
      || showRow[row]
      || cellState[`${row}-${col}`]?.shown
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        九九のひょう
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        マスをタップで答え＋色ぬり、列ヘッダや行ヘッダで一行ずつ表示できるよ。「×」を押すとぜんぶの答えが出るよ。
      </p>

      {/* ===== ツールバー ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* 色パレット */}
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => setSelectedColor(c.value)}
                title={c.label}
                aria-label={c.label}
                className={`w-9 h-9 rounded-md border-2 transition-all ${
                  selectedColor === c.value
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
                onClick={() => setConfirmingReset(true)}
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

      {/* ===== 九九の表 =====
           CSS Grid（10×10）で正方形を保証。table の aspect-square だと
           ブラウザによってはテーブル特有の自動レイアウトで横長になるため、
           div + grid で各セル aspect-square を確実に効かせる。
           最大表示サイズ 560px に制限し、画面幅に応じて縮小（最小は 1 セル ≈ 32px 程度）。 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2">
        <div className="mx-auto grid grid-cols-10 gap-px bg-gray-300 dark:bg-gray-600 border border-gray-300 dark:border-gray-600" style={{ maxWidth: "min(100%, 560px)", aspectRatio: "1 / 1" }}>
          {Array.from({ length: 10 }).flatMap((_, row) =>
            Array.from({ length: 10 }).map((_, col) => {
              // (0,0): × （全表示トグル）
              if (row === 0 && col === 0) {
                return (
                  <button
                    key={`cell-${row}-${col}`}
                    onClick={handleAllClick}
                    className={`flex items-center justify-center text-2xl font-bold transition-colors ${
                      showAll
                        ? "bg-warm-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-warm-100 dark:hover:bg-warm-900"
                    }`}
                  >
                    ×
                  </button>
                )
              }
              // (0, c): 列ヘッダ
              if (row === 0) {
                return (
                  <button
                    key={`cell-${row}-${col}`}
                    onClick={() => handleColHeaderClick(col)}
                    className={`flex items-center justify-center text-xl font-bold transition-colors ${
                      showCol[col]
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900"
                    }`}
                  >
                    {col}
                  </button>
                )
              }
              // (r, 0): 行ヘッダ
              if (col === 0) {
                return (
                  <button
                    key={`cell-${row}-${col}`}
                    onClick={() => handleRowHeaderClick(row)}
                    className={`flex items-center justify-center text-xl font-bold transition-colors ${
                      showRow[row]
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900"
                    }`}
                  >
                    {row}
                  </button>
                )
              }
              // 答えセル
              const key = `${row}-${col}`
              const state = cellState[key]
              const visible = isAnswerVisible(row, col)
              const bgColor = state?.shown ? state.color : "transparent"
              return (
                <button
                  key={`cell-${row}-${col}`}
                  onClick={() => handleCellClick(row, col)}
                  className="flex items-center justify-center text-lg font-bold text-red-600 dark:text-red-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
                  style={{ backgroundColor: bgColor !== "transparent" ? bgColor : undefined }}
                >
                  {visible ? row * col : ""}
                </button>
              )
            })
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        💡 同じセルをもう一度タップすると消せるよ。色を変えてから何度もぬり直せる。
      </p>
    </div>
  )
}
