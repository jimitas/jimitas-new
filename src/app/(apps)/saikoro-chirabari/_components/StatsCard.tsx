// ======================================================
// 統計量カード — 回数・平均・分散・標準偏差を「実測 ／ 理論値」で並べる
//
// 実測値と理論値を必ず隣に置き、ズレも数で出す（どれだけズレたかが一目で分かるように）。
// 投影して教室の後ろから読めるよう、実測値は大きな字にする。
// ======================================================

import type { Method } from "../_lib/dice"
import { THEORY, tallyMean, tallySd, tallyVariance } from "../_lib/stats"
import type { Tally } from "../_lib/stats"
import { fmt2, fmtInt, roundHalfUp } from "../_lib/format"
import { METHOD_BORDER, METHOD_LABEL, METHOD_TEXT } from "./methodStyle"

interface Props {
  method: Method
  tally: Tally
  /** 2つ並べるとき（セクション2）は少し小さくする */
  compact?: boolean
}

function gap(actual: number, theory: number): string {
  if (!Number.isFinite(actual)) return ""
  const d = roundHalfUp(actual - theory, 2)
  return `ズレ ${d > 0 ? "+" : ""}${fmt2(d)}`
}

export function StatsCard({ method, tally, compact = false }: Props) {
  const th = THEORY[method]
  const has = tally.n > 0
  const rows = [
    { name: "平均", actual: tallyMean(tally), theory: th.mean },
    { name: "分散", actual: tallyVariance(tally), theory: th.variance },
    { name: "標準偏差", actual: tallySd(tally), theory: th.sd },
  ]
  const big = compact ? "text-3xl lg:text-4xl" : "text-3xl sm:text-4xl lg:text-5xl"

  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
      <div className={`rounded-xl border-l-8 ${METHOD_BORDER[method]} bg-white dark:bg-gray-800 px-3 py-2 shadow-sm`}>
        <div className={`text-sm font-bold ${METHOD_TEXT[method]}`}>{METHOD_LABEL[method]}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">試行回数</div>
        <div className={`${big} font-bold tabular-nums text-gray-900 dark:text-gray-50`}>
          <span className="text-xl align-middle text-gray-500 dark:text-gray-400">n = </span>
          {fmtInt(tally.n)}
        </div>
      </div>
      {rows.map((r) => (
        <div key={r.name} className="rounded-xl bg-white dark:bg-gray-800 px-3 py-2 shadow-sm">
          <div className="text-sm font-bold text-gray-600 dark:text-gray-300">{r.name}</div>
          <div className={`${big} font-bold tabular-nums ${METHOD_TEXT[method]}`}>
            {has ? fmt2(r.actual) : "―"}
          </div>
          <div className="text-base lg:text-lg tabular-nums text-gray-700 dark:text-gray-200">
            理論値 <b>{fmt2(r.theory)}</b>
            {has && <span className="block sm:inline sm:ml-2 text-sm text-gray-500 dark:text-gray-400">{gap(r.actual, r.theory)}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
