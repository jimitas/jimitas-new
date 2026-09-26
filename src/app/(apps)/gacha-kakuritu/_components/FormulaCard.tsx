// ======================================================
// 数式カード — いまの設定を代入した 1 − (1 − p)^N と理論値
// 設定を変えるとすぐ書きかわる。「なぜこの式？」で余事象の説明を開く。
// ======================================================

import { formatPercent, fractionLabel } from "../_lib/gachaMath"
import { fmtInt, fmtNum } from "../_lib/settings"
import type { Theory } from "../_lib/chartData"
import { Card } from "./Card"

interface Props {
  p: number
  N: number
  theory: Theory
}

/** (1-p)^N の表示。小さすぎる値は有効数字2桁で */
function formatQ(q: number): string {
  if (q >= 0.001) return q.toFixed(3)
  return q === 0 ? "0" : String(+q.toPrecision(2))
}

export function FormulaCard({ p, N, theory }: Props) {
  return (
    <Card title="1回以上当たる確率（理論値）">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        <b className="text-gray-800 dark:text-gray-100">{fractionLabel(p)}</b>（{formatPercent(p)}）のガチャを{" "}
        <b className="text-gray-800 dark:text-gray-100">{fmtInt(N)}</b> 回引いて、1回以上当たる確率
      </p>
      <p className="my-2 text-xl md:text-2xl tabular-nums text-gray-800 dark:text-gray-100" aria-live="polite">
        1 − (1 − {fmtNum(p)})<sup className="text-[0.7em]">{fmtInt(N)}</sup> = 1 − {formatQ(theory.pNone)} ={" "}
        <b className="text-[1.35em] text-accent-700 dark:text-accent-300">{formatPercent(theory.pAtLeast)}</b>
      </p>
      <details className="text-sm text-gray-700 dark:text-gray-200">
        <summary className="cursor-pointer font-bold text-accent-700 dark:text-accent-300">なぜこの式？</summary>
        <p className="mt-2">
          1回引いて<b>はずれる</b>確率は 1 − p。ガチャは毎回独立なので、N 回<b>連続ではずれる</b>確率は
          (1 − p) を N 回かけた (1 − p)<sup>N</sup> になります。
          「1回以上当たる」はその反対（余事象）なので、1 から引けば求まります。
        </p>
        <p className="mt-2">
          1/100 のガチャを 100 回引いても、当たる確率は約 63% しかありません。
          一般に「1/n のガチャを n 回引く」と、当たる確率は約 63%（1 − 1/e）に近づきます。
          3人に1人は 100 回引いても 1 回も当たらない、ということです。
        </p>
      </details>
    </Card>
  )
}
