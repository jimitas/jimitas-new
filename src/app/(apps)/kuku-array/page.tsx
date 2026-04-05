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
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

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
