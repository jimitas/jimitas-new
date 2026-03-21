// ======================================================
// 九九のアレイ図 ページ
//
// URL: /kuku-array
// 対象: 小学2〜4年生
// 内容: ●の配列でかけ算を視覚的に理解する
//
// 操作:
//   上段ボタン（1〜9）→ かける数（列数）を選択
//   左側ボタン（1〜9）→ かけられる数（行数）を選択
//   同じボタンを再度押すと選択解除
//   「こたえをかくす/みせる」で積の表示を切り替え
// ======================================================

"use client"

import { Fragment, useState } from "react"
import * as se from "@/lib/se"

// ── ArrayDots コンポーネント ──────────────────────────────
//
// 9×9 のドット配列を描画する純粋な表示コンポーネント。
// rows 行 × cols 列 のドットを点灯（warm色）、残りは消灯（グレー）。
//
// showLabels=true のとき、行・列番号ラベル付きの10×10グリッドを表示。
//   ラベルはクリック不可の div（kuku-yomi で使用）。
//   アクティブなラベル（≤rows / ≤cols）は brand 色でハイライト。
//
// ※ kuku-yomi でも同じコンポーネントを使う想定。
//   将来的に src/components/parts/displays/ArrayDots.tsx に切り出す。
//
interface ArrayDotsProps {
  rows: number        // かけられる数（点灯する行数）
  cols: number        // かける数（点灯する列数）
  showLabels?: boolean  // 行・列番号ラベルを表示するか（kuku-yomi用）
}

export function ArrayDots({ rows, cols, showLabels = false }: ArrayDotsProps) {

  // ── ラベルなし：シンプルな9×9ドットグリッド ──────────────
  if (!showLabels) {
    return (
      <div className="grid grid-cols-9 gap-1">
        {Array.from({ length: 81 }, (_, i) => {
          const row = Math.floor(i / 9) + 1  // 1-indexed
          const col = (i % 9) + 1            // 1-indexed
          const lit = row <= rows && col <= cols
          return (
            <div
              key={i}
              className={`w-8 h-8 rounded-full border transition-colors duration-150 ${
                lit
                  ? "bg-warm-400 border-warm-500"
                  : "bg-gray-100 border-gray-300"
              }`}
            />
          )
        })}
      </div>
    )
  }

  // ── ラベルあり：10×10グリッド（行・列番号付き）──────────────
  // 左上コーナー + 列ラベル9 + 行ラベル9 + ドット9×9
  // ラベルはクリック不可の div（ポインターイベントなし）
  // かけられる数（行）= rose、かける数（列）= accent（青） で色分け
  const activeRowLabelCls  = "bg-rose-500 text-white"    // かけられる数
  const activeColLabelCls  = "bg-accent-500 text-white"  // かける数
  const inactiveLabelCls   = "bg-white border border-gray-200 text-gray-300"

  // w-7(28px) × 10 + gap-0.5(2px) × 9 = 298px → 50%カラム（約312px）に収まる
  return (
    <div
      className="grid gap-0.5"
      style={{ gridTemplateColumns: "repeat(10, 1.75rem)" }}
    >
      {/* 1行目: ×ラベル + かける数（列）ラベル 1〜9 */}
      <div className="w-7 h-7 flex items-center justify-center
                      text-xs font-bold text-gray-400">
        ×
      </div>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(col => (
        <div
          key={col}
          className={`w-7 h-7 rounded text-xs font-bold
                      flex items-center justify-center
                      ${col <= cols ? activeColLabelCls : inactiveLabelCls}`}
        >
          {col}
        </div>
      ))}

      {/* 2〜10行目: かけられる数（行）ラベル + ドット9個 */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(row => (
        <Fragment key={row}>

          {/* 行ラベル（かけられる数）= rose */}
          <div
            className={`w-7 h-7 rounded text-xs font-bold
                        flex items-center justify-center
                        ${row <= rows ? activeRowLabelCls : inactiveLabelCls}`}
          >
            {row}
          </div>

          {/* ドット9個 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(col => {
            const lit = row <= rows && col <= cols
            return (
              <div
                key={col}
                className={`w-7 h-7 rounded-full border transition-colors duration-150 ${
                  lit
                    ? "bg-warm-400 border-warm-500"
                    : "bg-gray-100 border-gray-300"
                }`}
              />
            )
          })}

        </Fragment>
      ))}
    </div>
  )
}

// ── ページ本体 ────────────────────────────────────────────
export default function KukuArrayPage() {

  // かけられる数（左側ボタン = 行数）/ かける数（上段ボタン = 列数）
  // 0 = 未選択
  const [multiplicand, setMultiplicand] = useState(0)
  const [multiplier,   setMultiplier]   = useState(0)
  const [showAnswer,   setShowAnswer]   = useState(true)

  const selected = multiplicand > 0 && multiplier > 0

  // ── かけられる数ボタン（左側）──────────────────────────
  const handleMultiplicand = (n: number) => {
    se.playSe(se.pi)
    setMultiplicand(prev => prev === n ? 0 : n)  // 再押しで選択解除
  }

  // ── かける数ボタン（上段）────────────────────────────
  const handleMultiplier = (n: number) => {
    se.playSe(se.pi)
    setMultiplier(prev => prev === n ? 0 : n)    // 再押しで選択解除
  }

  // かけられる数ボタン（左側）= rose（ピンク）
  const multiplicandBtnCls = (active: boolean) =>
    `w-10 h-10 rounded text-sm font-bold transition-all active:scale-95 ${
      active
        ? "bg-rose-500 text-white"
        : "bg-white border border-rose-200 text-rose-400 hover:bg-rose-100"
    }`

  // かける数ボタン（上段）= accent（青）
  const multiplierBtnCls = (active: boolean) =>
    `w-10 h-10 rounded text-sm font-bold transition-all active:scale-95 ${
      active
        ? "bg-accent-500 text-white"
        : "bg-white border border-accent-200 text-accent-600 hover:bg-accent-100"
    }`

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800">
        九九のアレイ図
      </h1>

      {/* ── インタラクティブグリッド ──────────────────────────
          レイアウト: 10列 × 10行（コーナー + 上段ボタン9 + 左側ボタン9 + ドット9×9）
          gridTemplateColumns: repeat(10, 2.5rem)
          → 全幅 = 10 × 40px + 9 × gap = 436px（タブレット以上で収まる）
      */}
      <div className="overflow-x-auto">
        <div
          className="grid gap-1 w-fit mx-auto"
          style={{ gridTemplateColumns: "repeat(10, 2.5rem)" }}
        >

          {/* 1行目: × ラベル + かける数ボタン（1〜9） */}
          <div className="w-10 h-10 flex items-center justify-center
                          text-sm font-bold text-gray-400">
            ×
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              onClick={() => handleMultiplier(n)}
              className={multiplierBtnCls(multiplier === n)}
            >
              {n}
            </button>
          ))}

          {/* 2〜10行目: かけられる数ボタン + ドット9個 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(row => (
            <Fragment key={row}>

              {/* 左側ボタン（かけられる数）= rose */}
              <button
                onClick={() => handleMultiplicand(row)}
                className={multiplicandBtnCls(multiplicand === row)}
              >
                {row}
              </button>

              {/* ドット9個（row列目） */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(col => {
                const lit = row <= multiplicand && col <= multiplier
                return (
                  <div
                    key={col}
                    className="flex items-center justify-center"
                  >
                    <div
                      className={`w-8 h-8 rounded-full border transition-colors duration-150 ${
                        lit
                          ? "bg-warm-400 border-warm-500"
                          : "bg-gray-100 border-gray-300"
                      }`}
                    />
                  </div>
                )
              })}

            </Fragment>
          ))}

        </div>
      </div>

      {/* ── 計算式 ────────────────────────────────────────── */}
      <div className="min-h-[4.5rem] flex items-center justify-center">
        {selected ? (
          <p className="text-5xl font-bold tracking-wide">
            <span className="text-rose-500">{multiplicand}</span>
            <span className="mx-2 text-gray-400">×</span>
            <span className="text-accent-600">{multiplier}</span>
            <span className="mx-2 text-gray-400">=</span>
            <span className={showAnswer ? "text-brand-600" : "text-gray-200"}>
              {showAnswer ? multiplicand * multiplier : "？"}
            </span>
          </p>
        ) : (
          <p className="text-gray-400 text-lg">
            ボタンをおして　アレイ図をつくろう
          </p>
        )}
      </div>

      {/* ── こたえをかくす / みせる ─────────────────────── */}
      <div className="flex justify-center">
        <button
          onClick={() => { se.playSe(se.pi); setShowAnswer(prev => !prev) }}
          className={`px-6 py-2 font-bold rounded-lg border-2 transition-all ${
            showAnswer
              ? "bg-warm-500 border-warm-500 text-white hover:bg-warm-600"
              : "bg-white border-warm-200 text-warm-600 hover:bg-warm-100"
          }`}
        >
          {showAnswer ? "こたえをかくす" : "こたえをみせる"}
        </button>
      </div>

    </div>
  )
}
