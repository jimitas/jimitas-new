// ======================================================
// 位取りの式: 2/8/16進数 → 10進数
//
//   けた      1    0    1    0
//   位の重み  2³   2²   2¹   2⁰
//             =8   =4   =2   =1
//
//   1×8 + 0×4 + 1×2 + 0×1 = 8 + 0 + 2 + 0 = 10
// ======================================================

import { placeValueTerms } from "../_lib/explain"
import type { Base } from "../_lib/converter"

export function PlaceValue({ str, from }: { str: string; from: Base }) {
  const terms = placeValueTerms(str, from)
  const total = terms.reduce((s, t) => s + t.product, 0)
  const hasLetter = terms.some(t => t.value >= 10)

  return (
    <div className="space-y-2">
      <p>
        それぞれのけたに<b>位の重み</b>（いちばん右が 1、左へ1つ進むごとに {from} 倍）をかけて、ぜんぶたす。
        {hasLetter && <>（A=10, B=11, C=12, D=13, E=14, F=15）</>}
      </p>
      <div className="overflow-x-auto">
        <table className="mx-auto border-separate border-spacing-x-1 text-center tabular-nums">
          <tbody>
            <tr>
              <th scope="row" className="pr-1 sm:pr-2 text-xs font-normal text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">けた</th>
              {terms.map((t, i) => (
                <td key={i} className="px-1 sm:px-2 pt-1 text-2xl font-bold font-mono text-gray-800 dark:text-gray-100">
                  {t.digit}
                  {t.value >= 10 && <div className="text-xs font-normal text-gray-500 dark:text-gray-400">({t.value})</div>}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="pr-1 sm:pr-2 text-xs font-normal text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">位の重み</th>
              {terms.map((t, i) => (
                <td key={i} className="px-1 sm:px-2 pb-1 rounded-b-lg bg-gray-50 dark:bg-gray-900">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {from}<sup>{t.exponent}</sup>
                  </div>
                  <div className="font-bold text-brand-600 dark:text-brand-300">{t.weight}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="font-mono text-base sm:text-lg text-gray-800 dark:text-gray-100 text-center leading-relaxed break-words">
        {terms.map((t, i) => (
          <span key={i} className="whitespace-nowrap">
            {i > 0 && " + "}
            {t.value}×<span className="text-brand-600 dark:text-brand-300">{t.weight}</span>
          </span>
        ))}
        {terms.length > 1 && (
          <>
            <br />= {terms.map(t => t.product).join(" + ")}
          </>
        )}
        <br />={" "}
        <b className="text-xl text-accent-700 dark:text-accent-300">{total}</b>
        <span className="text-sm text-gray-400 dark:text-gray-500">(10)</span>
      </div>
    </div>
  )
}
