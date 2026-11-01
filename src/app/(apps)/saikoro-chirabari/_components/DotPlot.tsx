// ======================================================
// ドットプロット（SVG）
//
// 横軸は 2〜12 の 11 列で固定（授業の模造紙と同じ軸）。回数が変わっても軸は動かない。
// 100回までは1回を1つの点として縦に積み、それより多いと棒（ヒストグラム）に切り替える。
// 平均の位置に縦の破線を引く。
//
// SVG は viewBox で幅いっぱいに伸ばす。文字も一緒に拡大されるので、投影すると大きく見える。
// 同じ中身を sr-only の表でも出す（読み上げ用）。
// ======================================================

import type { Method } from "../_lib/dice"
import { SCORES, SCORE_MIN } from "../_lib/stats"
import { fmt2 } from "../_lib/format"
import { METHOD_FILL, METHOD_LABEL } from "./methodStyle"

/** これ以下の回数なら点で描く */
export const DOT_MAX = 100

const W = 480
const H = 260
const PAD_X = 10
const TOP = 30
const BOTTOM = 34
const PLOT_H = H - TOP - BOTTOM
const COL_W = (W - PAD_X * 2) / SCORES.length
/** 点の大きさを決めるときの最低の段数（少ない回数で点が大きくなりすぎないように） */
const MIN_ROWS = 8

const xOf = (score: number) => PAD_X + (score - SCORE_MIN + 0.5) * COL_W

interface Props {
  method: Method
  counts: number[]
  n: number
  mean: number
  /** 図の読み上げ名 */
  label: string
}

export function DotPlot({ method, counts, n, mean, label }: Props) {
  const maxCount = Math.max(0, ...counts)
  const dots = n <= DOT_MAX
  const baseY = TOP + PLOT_H

  let body: React.ReactNode
  if (dots) {
    const d = Math.min(COL_W * 0.8, PLOT_H / Math.max(MIN_ROWS, maxCount))
    body = counts.flatMap((c, k) =>
      Array.from({ length: c }, (_, j) => (
        <circle
          key={`${k}-${j}`}
          cx={xOf(SCORES[k])}
          cy={baseY - d * (j + 0.5)}
          r={d * 0.42}
          className={METHOD_FILL[method]}
        />
      )),
    )
  } else {
    body = counts.map((c, k) => {
      const h = maxCount === 0 ? 0 : (c / maxCount) * PLOT_H * 0.88
      return (
        <g key={k}>
          <rect
            x={xOf(SCORES[k]) - COL_W * 0.4}
            y={baseY - h}
            width={COL_W * 0.8}
            height={h}
            rx={2}
            className={METHOD_FILL[method]}
          />
          {c > 0 && (
            <text x={xOf(SCORES[k])} y={baseY - h - 4} textAnchor="middle" fontSize={11} className="fill-gray-600 dark:fill-gray-300">
              {c}
            </text>
          )}
        </g>
      )
    })
  }

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label}>
        {/* 底の線と目盛り */}
        <line x1={PAD_X} x2={W - PAD_X} y1={baseY} y2={baseY} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth={1.5} />
        {SCORES.map((s) => (
          <text key={s} x={xOf(s)} y={baseY + 24} textAnchor="middle" fontSize={17} fontWeight="bold" className="fill-gray-700 dark:fill-gray-200">
            {s}
          </text>
        ))}
        {body}
        {n === 0 && (
          <text x={W / 2} y={TOP + PLOT_H / 2} textAnchor="middle" fontSize={16} className="fill-gray-400 dark:fill-gray-500">
            まだふっていません
          </text>
        )}
        {/* 平均の破線 */}
        {n > 0 && (
          <g>
            <line
              x1={xOf(mean)} x2={xOf(mean)} y1={TOP - 4} y2={baseY}
              strokeDasharray="6 4" strokeWidth={2.5}
              className="stroke-gray-800 dark:stroke-gray-100"
            />
            <text
              x={Math.min(W - 70, Math.max(70, xOf(mean)))} y={TOP - 10} textAnchor="middle" fontSize={15} fontWeight="bold"
              className="fill-gray-800 dark:fill-gray-100"
            >
              平均 {fmt2(mean)}
            </text>
          </g>
        )}
      </svg>
      <figcaption className="text-xs text-right text-gray-500 dark:text-gray-400">
        {dots ? "1回を1つの点で表示" : "回数が多いので棒で表示（棒の上の数は回数）"}
      </figcaption>
      <table className="sr-only">
        <caption>{label}（{METHOD_LABEL[method]}）</caption>
        <thead>
          <tr><th scope="col">得点</th><th scope="col">回数</th></tr>
        </thead>
        <tbody>
          {SCORES.map((s, k) => (
            <tr key={s}><th scope="row">{s}</th><td>{counts[k]}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
