// ======================================================
// 記録表（F2-4）
//
// 列：h ／ x = a + h ／ f(a + h) − f(a) ／ 平均変化率
// 行は段の値（±1, 0.5, 0.1, 0.01, 0.001）のうち、通った（押した）ぶんだけ埋まる。
// 値は段の値ちょうどで計算する（アニメの途中のフレームの h ではない）。
// まだ埋まっていない行も空欄で出しておき、書き込まれても表の高さが変わらないようにする。
// ======================================================

import { H_STEPS } from "../_lib/approach"
import type { Side } from "../_lib/approach"
import { deltaY, diffQuotient, formatNumber } from "../_lib/polynomial"
import type { Poly } from "../_lib/polynomial"
import { SIDE_LABEL, tableHeaders } from "../_lib/text"
import { useMotion, useText } from "./Display"

interface Props {
  p: Poly
  a: number
  side: Side
  /** 埋まっている行の数（0〜5） */
  count: number
  /** いま動かしている向きなら強調する */
  active: boolean
}

export function RecordTable({ p, a, side, count, active }: Props) {
  const tableText = useText("table")
  const headers = tableHeaders(useMotion())
  return (
    <div className={`rounded-lg border-2 ${active ? "border-warm-400" : "border-gray-200 dark:border-gray-700"}`}>
      <p className={`px-2 pt-1 text-sm font-bold ${active ? "text-warm-700 dark:text-warm-300" : "text-gray-600 dark:text-gray-300"}`}>
        {SIDE_LABEL[side]}
      </p>
      <div className="overflow-x-auto">
        <table className={`w-full ${tableText} tabular-nums text-gray-800 dark:text-gray-100`}>
          <thead>
            <tr className="text-xs text-gray-600 dark:text-gray-300">
              {headers.map((hd, i) => (
                // 最後の列（平均変化率）は「平均の速さ（平均変化率）」と長くなるので折り返してよい
                <th key={hd} className={`px-2 py-1 text-right font-bold ${i < 3 ? "whitespace-nowrap" : ""}`}>{hd}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {H_STEPS.map((s, i) => {
              const h = side * s
              const filled = i < count
              const latest = filled && i === count - 1
              return (
                <tr
                  key={s}
                  data-filled={filled}
                  className={`border-t border-gray-100 dark:border-gray-800 ${latest ? "bg-warm-50 dark:bg-warm-950" : ""}`}
                >
                  <td className="px-2 py-1 text-right">{filled ? formatNumber(h) : ""}</td>
                  <td className="px-2 py-1 text-right">{filled ? formatNumber(a + h) : ""}</td>
                  <td className="px-2 py-1 text-right">{filled ? formatNumber(deltaY(p, a, h)) : ""}</td>
                  <td className="px-2 py-1 text-right font-bold text-warm-700 dark:text-warm-300">
                    {filled ? formatNumber(diffQuotient(p, a, h)) : ""}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
