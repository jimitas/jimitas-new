// ======================================================
// 累積カーブ — 「k 回目までに当たった人の割合」
// 青い実線がシミュレーション、黒い点線が理論値 1 − (1 − p)^k。
// 座標の計算は _lib/chartData.ts の cumulativePoints がする。
// ======================================================

import { fmtInt } from "../_lib/settings"

interface Props {
  N: number
  theory: string
  obs: string
}

export function CumulativeCurve({ N, theory, obs }: Props) {
  return (
    <div className="grid grid-cols-[3.2em_1fr] grid-rows-[150px_auto] gap-x-1.5">
      <div className="col-start-1 row-start-1 flex flex-col justify-between text-right text-xs text-gray-500 dark:text-gray-400">
        <span>100%</span><span>50%</span><span>0%</span>
      </div>
      <svg
        className="col-start-2 row-start-1 w-full h-[150px] rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        role="img"
        aria-label="累積の当たり割合。青がシミュレーション、黒が理論値"
      >
        <line x1="0" y1="0" x2="100" y2="0" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
        <line x1="0" y1="30" x2="100" y2="30" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
        <polyline
          points={theory} fill="none" className="stroke-gray-800 dark:stroke-gray-100"
          strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke"
        />
        <polyline points={obs} fill="none" className="stroke-accent-500" strokeWidth={3} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="col-start-2 row-start-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>1回目</span>
        <span>{N >= 2 ? `${fmtInt(Math.round(N / 2))}回目` : ""}</span>
        <span>{fmtInt(N)}回目</span>
      </div>
    </div>
  )
}
