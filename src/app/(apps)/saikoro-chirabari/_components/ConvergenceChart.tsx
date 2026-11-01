// ======================================================
// 標準偏差の収束グラフ（SVG）
//
// 横軸 = 試行回数（1, 10, 100, 1,000, 10,000 が等間隔になる目盛り）
// 縦軸 = その回数までで計算した標準偏差
// 理論値の水平線に近づいていく様子を、ふるたびにライブで見せる。
//
// 軸は 1〜10,000回・0〜6 で固定（回数を変えても目盛りが動かないように）。
// 10,000回を超えたときだけ右端をのばす。
// 点が多いときは、等間隔の目盛りの上で約400点に間引いて描く。
// ======================================================

import type { Method } from "../_lib/dice"
import { THEORY } from "../_lib/stats"
import { fmt2, fmtInt } from "../_lib/format"
import { METHOD_LABEL, METHOD_STROKE } from "./methodStyle"

const W = 480
const H = 240
const LEFT = 34
const RIGHT = 92
const TOP = 14
const BOTTOM = 30
const Y_MAX = 6
const SAMPLES = 400

interface Series {
  method: Method
  /** sdHistory[i] = i+1 回目までの標準偏差 */
  history: number[]
}

/** 描く点の番号（0始まり）。1回目は標準偏差が必ず0なので2回目から */
function pickIndices(len: number): number[] {
  if (len <= SAMPLES) return Array.from({ length: Math.max(0, len - 1) }, (_, i) => i + 1)
  const out: number[] = []
  const logMax = Math.log10(len)
  let prev = 0
  for (let s = 0; s <= SAMPLES; s++) {
    const i = Math.round(10 ** ((logMax * s) / SAMPLES)) - 1
    if (i > prev && i < len) {
      out.push(i)
      prev = i
    }
  }
  if (out[out.length - 1] !== len - 1) out.push(len - 1)
  return out
}

export function ConvergenceChart({ series }: { series: Series[] }) {
  const maxN = Math.max(10000, ...series.map((s) => s.history.length))
  const logMax = Math.log10(maxN)
  const plotW = W - LEFT - RIGHT
  const plotH = H - TOP - BOTTOM
  const xOf = (n: number) => LEFT + (Math.log10(n) / logMax) * plotW
  const yOf = (v: number) => TOP + plotH * (1 - Math.min(v, Y_MAX) / Y_MAX)
  const xTicks = [1, 10, 100, 1000, 10000].filter((t) => t <= maxN)

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="試行回数と標準偏差の折れ線グラフ">
        {/* 格子 */}
        {[0, 1, 2, 3, 4, 5, 6].map((v) => (
          <g key={v}>
            <line x1={LEFT} x2={LEFT + plotW} y1={yOf(v)} y2={yOf(v)} className="stroke-gray-200 dark:stroke-gray-700" />
            <text x={LEFT - 6} y={yOf(v) + 4} textAnchor="end" fontSize={12} className="fill-gray-500 dark:fill-gray-400">{v}</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <g key={t}>
            <line x1={xOf(t)} x2={xOf(t)} y1={TOP} y2={TOP + plotH} className="stroke-gray-200 dark:stroke-gray-700" />
            <text x={xOf(t)} y={H - 10} textAnchor="middle" fontSize={12} className="fill-gray-500 dark:fill-gray-400">{fmtInt(t)}</text>
          </g>
        ))}
        <text x={LEFT + plotW} y={H - 10} dx={26} fontSize={11} className="fill-gray-500 dark:fill-gray-400">回</text>

        {/* 理論値の水平線 */}
        {series.map(({ method }) => (
          <g key={`th-${method}`}>
            <line
              x1={LEFT} x2={LEFT + plotW} y1={yOf(THEORY[method].sd)} y2={yOf(THEORY[method].sd)}
              strokeDasharray="6 4" strokeWidth={2} className="stroke-gray-700 dark:stroke-gray-200"
            />
            <text x={LEFT + plotW + 6} y={yOf(THEORY[method].sd) + 4} fontSize={12} fontWeight="bold" className="fill-gray-700 dark:fill-gray-200">
              {series.length > 1 ? `${method} ` : ""}理論値 {fmt2(THEORY[method].sd)}
            </text>
          </g>
        ))}

        {/* 実測の折れ線 */}
        {series.map(({ method, history }) => {
          const idx = pickIndices(history.length)
          if (idx.length === 0) return null
          const d = idx.map((i, k) => `${k === 0 ? "M" : "L"}${xOf(i + 1).toFixed(1)},${yOf(history[i]).toFixed(1)}`).join(" ")
          const last = idx[idx.length - 1]
          return (
            <g key={`ln-${method}`}>
              <path d={d} fill="none" strokeWidth={2.5} strokeLinejoin="round" className={METHOD_STROKE[method]} />
              <circle cx={xOf(last + 1)} cy={yOf(history[last])} r={4} strokeWidth={2.5} className={`${METHOD_STROKE[method]} fill-white dark:fill-gray-900`} />
              {/* 色だけで区別しないよう、線の先に方式の文字も置く */}
              {series.length > 1 && (
                <text x={xOf(last + 1)} y={yOf(history[last]) - 8} textAnchor="middle" fontSize={13} fontWeight="bold" className="fill-gray-800 dark:fill-gray-100">
                  {method}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <figcaption className="text-xs text-gray-500 dark:text-gray-400">
        横：試行回数 ／ 縦：その回数までの標準偏差。破線が理論値。
        {series.length > 1 && ` 線の色：${series.map((s) => METHOD_LABEL[s.method]).join("・")}`}
      </figcaption>
    </figure>
  )
}
