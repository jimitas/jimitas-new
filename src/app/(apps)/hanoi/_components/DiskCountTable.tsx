// ======================================================
// 円盤ごとの回数表（要件 F2-7）：①〜ⓝ がそれぞれ何回動いたかをリアルタイムに数える
// 最後まで行くと ⓝ＝1, ⓝ₋₁＝2, …, ①＝2ⁿ⁻¹ になり、合計＝2ⁿ−1。
// ======================================================

"use client"

import { useText } from "@/components/parts/graph/Display"
import { DISK_STROKE, DISK_STROKE_WIDTH, diskColor, labelColor } from "../_lib/colors"
import { diskMark } from "../_lib/play"
import { COUNT_TITLE, countSum } from "../_lib/text"

interface Props {
  n: number
  /** k 手目までの円盤ごとの回数（添字 1〜n） */
  counts: number[]
  k: number
  total: number
}

export function DiskCountTable({ n, counts, k, total }: Props) {
  const readout = useText("readout")
  return (
    <section aria-label={COUNT_TITLE} className="space-y-2">
      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{COUNT_TITLE}</p>
      <div className="flex flex-wrap gap-2" data-count-table>
        {Array.from({ length: n }, (_, i) => i + 1).map((d) => (
          <div key={d} className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-1">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-base font-bold"
              style={{ background: diskColor(d), color: labelColor(diskColor(d)), border: `${DISK_STROKE_WIDTH}px solid ${DISK_STROKE}` }}
            >
              {diskMark(d)}
            </span>
            <span className="text-xl font-bold tabular-nums text-gray-800 dark:text-gray-100" data-count={d}>
              {counts[d]}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">回</span>
          </div>
        ))}
      </div>
      <p className={`font-bold tabular-nums text-gray-800 dark:text-gray-100 ${readout}`} data-count-sum>
        {k >= total ? `ぜんぶで ${countSum(counts, n)}` : `いまの合計 ${k} 回`}
      </p>
    </section>
  )
}
