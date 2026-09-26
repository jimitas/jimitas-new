// ======================================================
// 縦棒グラフ — シミュレーション（青い棒）＋ 理論値（黒い横線）
//
// Canvas ではなく DOM の棒で描く（移植元と同じ）。
// 理論値の重ね合わせ・レスポンシブ・読み上げラベルが簡単なため。
// 同じデータを sr-only の表でも出す。
// ======================================================

import { formatPercent } from "../_lib/gachaMath"
import type { Column } from "../_lib/chartData"

interface Props {
  columns: Column[]
  /** 集計が1セッション以上あるか（0 のときは観測値を「―」にする） */
  hasData: boolean
  /** グラフ全体の読み上げ名 */
  label: string
  /** 表の見出し（1列目） */
  headLabel: string
}

/** 列がこれより多いと、ラベルを1本おきにして数値ラベルを隠す */
const DENSE = 15

export function ColumnChart({ columns, hasData, label, headLabel }: Props) {
  let max = 0.02
  for (const c of columns) max = Math.max(max, c.obs, c.theory)
  const dense = columns.length > DENSE

  return (
    <>
      <div
        className="flex items-end gap-1 h-40 sm:h-52 pt-2 border-b border-gray-300 dark:border-gray-600"
        aria-label={label}
      >
        {columns.map((c, i) => {
          // 最大の棒でも 88% までにして、上の数値ラベルが枠からはみ出さないようにする
          const hObs = (c.obs / max) * 88
          const hTh = (c.theory / max) * 88
          const desc = `${c.desc}：シミュレーション ${hasData ? formatPercent(c.obs) : "―"}、理論値 ${formatPercent(c.theory)}`
          return (
            <div key={i} role="img" aria-label={desc} title={desc} className="flex-1 min-w-[6px] flex flex-col h-full">
              <div className="relative flex-1">
                <div
                  className="absolute left-[8%] right-[8%] bottom-0 rounded-t-sm bg-accent-500 motion-safe:transition-[height] duration-100"
                  style={{ height: `${hObs}%` }}
                />
                <div className="absolute inset-x-0 h-[3px] bg-gray-800 dark:bg-gray-100" style={{ bottom: `${hTh}%` }} />
                {!dense && hasData && c.obs > 0 && (
                  <span
                    className="absolute inset-x-0 -translate-y-full text-center text-[0.7rem] whitespace-nowrap text-gray-500 dark:text-gray-400"
                    style={{ bottom: `${hObs}%` }}
                  >
                    {formatPercent(c.obs)}
                  </span>
                )}
              </div>
              <span
                className={`h-[1.4em] text-center whitespace-nowrap overflow-hidden text-ellipsis text-gray-500 dark:text-gray-400 ${
                  dense ? "text-[0.65rem]" : "text-xs"
                } ${dense && i % 2 === 1 ? "invisible" : ""}`}
              >
                {c.label}
              </span>
            </div>
          )
        })}
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr><th scope="col">{headLabel}</th><th scope="col">シミュレーション</th><th scope="col">理論値</th></tr>
        </thead>
        <tbody>
          {columns.map((c, i) => (
            <tr key={i}>
              <th scope="row">{c.desc}</th>
              <td>{hasData ? formatPercent(c.obs) : "―"}</td>
              <td>{formatPercent(c.theory)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
