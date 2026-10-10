// ======================================================
// 結果のまとめ — 投資／貯蓄／差額 の3枚
// 差額は「投資 − 貯蓄」。貯蓄の方が多いときもマイナスにせず、どちらが多いかを言葉で書く。
// ======================================================

import { diffLabel, fmtPct, fmtYen } from "../_lib/compound"

interface Props {
  years: number
  principal: number
  saving: number
  invest: number
  savingPct: number
  investPct: number
}

export function SummaryCards({ years, principal, saving, invest, savingPct, investPct }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="rounded-xl border-2 border-warm-300 dark:border-warm-700 bg-warm-50 dark:bg-warm-950 px-4 py-3">
        <h3 className="font-bold text-warm-700 dark:text-warm-300">投資（年{fmtPct(investPct)}%）</h3>
        <p className="text-xl lg:text-2xl font-bold tabular-nums break-all text-gray-800 dark:text-gray-100">{fmtYen(invest)}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 tabular-nums">元本 {fmtYen(principal)}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 tabular-nums">運用益 {fmtYen(invest - principal)}</p>
      </div>
      <div className="rounded-xl border-2 border-accent-300 dark:border-accent-700 bg-accent-50 dark:bg-accent-900 px-4 py-3">
        <h3 className="font-bold text-accent-700 dark:text-accent-300">貯蓄（年{fmtPct(savingPct)}%）</h3>
        <p className="text-xl lg:text-2xl font-bold tabular-nums break-all text-gray-800 dark:text-gray-100">{fmtYen(saving)}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 tabular-nums">元本 {fmtYen(principal)}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 tabular-nums">利息 {fmtYen(saving - principal)}</p>
      </div>
      <div className="rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3">
        <h3 className="font-bold text-gray-700 dark:text-gray-200">{years}年後の差</h3>
        <p className="text-xl lg:text-2xl font-bold tabular-nums break-all text-gray-800 dark:text-gray-100">{fmtYen(Math.abs(Math.round(invest) - Math.round(saving)))}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {diffLabel(saving, invest)}
        </p>
      </div>
    </div>
  )
}
