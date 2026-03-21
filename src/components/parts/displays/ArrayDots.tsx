// ======================================================
// ArrayDots コンポーネント
//
// 9×9 のドット配列を描画する純粋な表示コンポーネント。
// rows 行 × cols 列 のドットを点灯（warm色）、残りは消灯（グレー）。
//
// showLabels=false（デフォルト）:
//   シンプルな9×9ドットグリッド（kuku-array 本体で使用）
//
// showLabels=true:
//   行・列番号ラベル付きの10×10グリッド（kuku-yomi で使用）
//   ラベルはクリック不可の div。
//   かけられる数（行）= rose（ピンク）、かける数（列）= accent（青）で色分け。
//   アクティブなラベル（≤rows / ≤cols）をハイライト。
//
// 使い方:
//   <ArrayDots rows={3} cols={4} />              // ラベルなし
//   <ArrayDots rows={3} cols={4} showLabels />   // ラベルあり
// ======================================================

"use client"

import { Fragment } from "react"

// ── 型定義 ────────────────────────────────────────────

interface ArrayDotsProps {
  /** かけられる数（点灯する行数） */
  rows: number
  /** かける数（点灯する列数） */
  cols: number
  /** 行・列番号ラベルを表示するか（kuku-yomi用、デフォルト: false） */
  showLabels?: boolean
}

// ── コンポーネント ────────────────────────────────────

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
  // ラベルはクリック不可の div
  // かけられる数（行）= rose（ピンク）、かける数（列）= accent（青）
  const activeRowLabelCls = "bg-rose-500 text-white"    // かけられる数
  const activeColLabelCls = "bg-accent-500 text-white"  // かける数
  const inactiveLabelCls  = "bg-white border border-gray-200 text-gray-300"

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
