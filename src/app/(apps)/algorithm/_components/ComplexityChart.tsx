// ======================================================
// 計算量の実測グラフ（SVG を自前で描く）
//
// 「n を大きくすると くらべる回数がどう増えるか」を目で見せる。
// 実測は実線、理論の目安は点線。
//
// 依存ライブラリは足していない。折れ線と目盛りだけなので
// SVG を直接書いたほうが軽いし、ダークモードにも素直に乗る。
// ======================================================

"use client"

import { memo, useMemo } from "react"
import { Btn } from "@/components/parts/buttons/Btn"
import { ALGOS, ALGO_ORDER } from "../_lib/algorithms"
import {
  CHART_N_MAX,
  CHART_N_MIN,
  chartSizes,
  maxCompares,
  measure,
  theoryPoints,
  toPolyline,
  toXY,
  yTicks,
  type Box,
  type Series,
} from "../_lib/complexity"
import type { AlgoId, DataKind } from "../_lib/types"

const BOX: Box = {
  width: 640,
  height: 260,
  padLeft: 48,
  padRight: 12,
  padTop: 12,
  padBottom: 34,
}

/** 実測の線の色。比べたいので 4本まで同時に出せるようにしておく */
const LINE_COLOR = [
  "var(--color-accent-500)",
  "var(--color-danger-500)",
  "var(--color-brand-500)",
  "var(--color-warm-500)",
]

type Props = {
  algoId: AlgoId
  dataKind: DataKind
  seed: number
  /** 見くらべる相手。空なら選択中のアルゴリズムだけ */
  compareWith: readonly AlgoId[]
  onToggleCompare: (id: AlgoId) => void
  open: boolean
  onToggle: () => void
}

function ComplexityChartInner({
  algoId,
  dataKind,
  seed,
  compareWith,
  onToggleCompare,
  open,
  onToggle,
}: Props) {
  const series = useMemo<Series[]>(() => {
    // 選択中のものを先頭に、重複なく並べる
    const ids = [algoId, ...compareWith.filter((id) => id !== algoId)]
    const measured: Series[] = ids.map((id) => ({
      id,
      label: ALGOS[id].label,
      points: measure(id, dataKind, seed),
      theoretical: false,
    }))
    // 理論の線は、選択中のアルゴリズムのぶんだけ重ねる
    measured.push({
      id: `${algoId}-theory`,
      label: `${ALGOS[algoId].label}の目安`,
      points: theoryPoints(algoId),
      theoretical: true,
    })
    return measured
  }, [algoId, compareWith, dataKind, seed])

  const maxY = maxCompares(series)
  const ticks = yTicks(maxY)

  return (
    <section className="mt-4">
      <div className="flex justify-center">
        <Btn color="neutral" onClick={onToggle} className="px-3 py-1.5">
          <span aria-hidden="true" className="mr-1">
            {open ? "▼" : "▶"}
          </span>
          n を変えると くらべる回数はどうなる？
        </Btn>
      </div>

      <div
        hidden={!open}
        className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
      >
        {/* 見くらべる相手を選ぶ */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          <span className="text-xs text-gray-600 dark:text-gray-300 shrink-0">見くらべる</span>
          {ALGO_ORDER.filter((id) => id !== algoId).map((id) => (
            <button
              key={id}
              onClick={() => onToggleCompare(id)}
              className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
                compareWith.includes(id)
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-white dark:bg-gray-700 text-brand-700 dark:text-brand-200 border-brand-300 dark:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900"
              }`}
            >
              {ALGOS[id].label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${BOX.width} ${BOX.height}`}
            className="w-full min-w-[420px] h-auto"
            role="img"
            aria-label="n を変えたときの くらべる回数のグラフ"
          >
            {/* 横の目盛り線と縦軸の数値 */}
            {ticks.map((t) => {
              const { y } = toXY({ n: CHART_N_MIN, compares: t }, BOX, maxY)
              return (
                <g key={t}>
                  <line
                    x1={BOX.padLeft}
                    x2={BOX.width - BOX.padRight}
                    y1={y}
                    y2={y}
                    className="stroke-gray-200 dark:stroke-gray-600"
                    strokeWidth={1}
                  />
                  <text
                    x={BOX.padLeft - 6}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-gray-500 dark:fill-gray-400"
                    fontSize={11}
                  >
                    {t}
                  </text>
                </g>
              )
            })}

            {/* 横軸の n */}
            {chartSizes().map((n) => {
              const { x } = toXY({ n, compares: 0 }, BOX, maxY)
              return (
                <text
                  key={n}
                  x={x}
                  y={BOX.height - 12}
                  textAnchor="middle"
                  className="fill-gray-500 dark:fill-gray-400"
                  fontSize={11}
                >
                  {n}
                </text>
              )
            })}
            <text
              x={BOX.width - BOX.padRight}
              y={BOX.height - 12}
              textAnchor="end"
              className="fill-gray-400 dark:fill-gray-500"
              fontSize={11}
            >
              こすう n
            </text>

            {/* 折れ線 */}
            {series.map((s, index) => {
              const color = s.theoretical
                ? "var(--color-gray-400, #9ca3af)"
                : LINE_COLOR[index % LINE_COLOR.length]
              return (
                <g key={s.id}>
                  <polyline
                    points={toPolyline(s.points, BOX, maxY)}
                    fill="none"
                    stroke={color}
                    strokeWidth={s.theoretical ? 2 : 2.5}
                    strokeDasharray={s.theoretical ? "5 4" : undefined}
                  />
                  {!s.theoretical &&
                    s.points.map((p) => {
                      const { x, y } = toXY(p, BOX, maxY)
                      return <circle key={p.n} cx={x} cy={y} r={3} fill={color} />
                    })}
                </g>
              )
            })}
          </svg>
        </div>

        {/* 凡例 */}
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-gray-600 dark:text-gray-300">
          {series.map((s, index) => (
            <span key={s.id} className="flex items-center gap-1">
              <span
                className="inline-block w-5 h-0.5"
                style={{
                  backgroundColor: s.theoretical
                    ? "var(--color-gray-400, #9ca3af)"
                    : LINE_COLOR[index % LINE_COLOR.length],
                  opacity: s.theoretical ? 0.8 : 1,
                }}
              />
              {s.label}
              {s.theoretical && "（点線）"}
            </span>
          ))}
        </div>

        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
          n を {CHART_N_MIN} から {CHART_N_MAX} まで変えて、実際に走らせた「くらべた回数」です。
          配列は毎回同じものを使っています（ならびを変えると線も変わります）。
          探索は いちばん回数のかかる「ない値をさがす」場合で測っています。
        </p>
      </div>
    </section>
  )
}

export const ComplexityChart = memo(ComplexityChartInner)
