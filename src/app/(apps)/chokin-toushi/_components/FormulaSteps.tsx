// ======================================================
// 公式と代入の過程
//
// n か月後の資産 = 毎月の額 × ((1 + 月利)^n − 1) ÷ 月利
//
// 移植元は (1 + 月利) を "1." + 文字列 で組み立てていて、月利が 1% 以上
// （年利 12% 以上）になると表示がこわれた。ここでは (1 + 0.004167) と
// 足し算のまま見せる。数値の整形は _lib/compound.ts。
//
// 月利 0% のときは公式が 0 で割ることになるので、「元本 = 毎月の額 × 月数」に切り替える。
// ======================================================

import { fmtFactor, fmtPct, fmtPow, fmtRate, fmtYen, growthNote, monthlyRate } from "../_lib/compound"

interface StepProps {
  name: string
  pct: number
  monthlyYen: number
  years: number
  total: number
  /** 見出しの色（グラフの線とそろえる） */
  titleClass: string
}

function Step({ name, pct, monthlyYen, years, total, titleClass }: StepProps) {
  const r = monthlyRate(pct)
  const n = years * 12
  const principal = monthlyYen * n
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2">
      <p className={`font-bold ${titleClass}`}>【{name}：年利 {fmtPct(pct)}%】</p>
      <ul className="mt-1 space-y-0.5 overflow-x-auto whitespace-nowrap pb-1 text-sm md:text-base text-gray-800 dark:text-gray-100 tabular-nums">
        {r === 0 ? (
          <>
            <li>月利 = 0% なので、利息はつきません</li>
            <li>
              {years}年後の資産 = {fmtYen(monthlyYen)} × {n} = <b>{fmtYen(total)}</b>
            </li>
          </>
        ) : (
          <>
            <li>月利 = {fmtPct(pct)}% ÷ 12 = {fmtRate(r)}</li>
            <li>
              {years}年後の資産 = {fmtYen(monthlyYen)} × {"{"}(1 + {fmtRate(r)})<sup>{n}</sup> − 1{"}"} ÷ {fmtRate(r)}
            </li>
            <li>
              <span className="invisible">{years}年後の資産 </span>≒ {fmtYen(monthlyYen)} × ({fmtPow(r, n)} − 1) ÷ {fmtRate(r)}
            </li>
            <li>
              <span className="invisible">{years}年後の資産 </span>≒ {fmtYen(monthlyYen)} × {fmtFactor(r, n)}
            </li>
            <li>
              <span className="invisible">{years}年後の資産 </span>≒ <b>{fmtYen(total)}</b>
            </li>
          </>
        )}
      </ul>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{growthNote(principal, total, pct)}</p>
    </div>
  )
}

interface Props {
  monthlyYen: number
  years: number
  savingPct: number
  investPct: number
  saving: number
  invest: number
  comparison: string
}

export function FormulaSteps({ monthlyYen, years, savingPct, investPct, saving, invest, comparison }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-200">
        <b>複利</b>とは、「利息に利息がつく」しくみです。毎月積み立てたお金に利息がつき、
        その利息にもまた利息がつくので、時間がたつほど増え方が大きくなります。
      </p>
      <div className="rounded-lg border-2 border-brand-300 dark:border-brand-700 px-3 py-2 text-gray-800 dark:text-gray-100">
        <p className="text-sm text-gray-600 dark:text-gray-300">{years}年後の資産を計算する式</p>
        <p className="text-base sm:text-lg md:text-xl my-1">
          資産 = 毎月の積立額 × {"{"}(1 + 月利)<sup>月数</sup> − 1{"}"} ÷ 月利
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ※ 月利 = 年利 ÷ 12、月数 = {years}年 × 12 = {years * 12}か月。毎月のおわりに積み立てる計算です。
        </p>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-200">例：{fmtYen(monthlyYen)} を毎月積み立てた場合</p>
      <Step name="投資" pct={investPct} monthlyYen={monthlyYen} years={years} total={invest} titleClass="text-warm-700 dark:text-warm-300" />
      <Step name="貯蓄" pct={savingPct} monthlyYen={monthlyYen} years={years} total={saving} titleClass="text-accent-700 dark:text-accent-300" />
      <p className="rounded-lg bg-brand-50 dark:bg-brand-900 px-3 py-2 text-sm md:text-base font-bold text-gray-800 dark:text-gray-100">
        {comparison}
      </p>
      <details className="text-sm text-gray-700 dark:text-gray-200">
        <summary className="cursor-pointer font-bold text-accent-700 dark:text-accent-300">なぜこの式？（等比数列の和）</summary>
        <p className="mt-2">
          最初の月に積み立てたお金は、最後までに (1 + 月利) を (月数 − 1) 回かけられます。
          次の月の分は 1 回少なく、最後の月の分は 1 回もかけられません。
        </p>
        <p className="mt-2">
          つまり資産は 毎月の額 × {"{"}1 + (1 + 月利) + (1 + 月利)<sup>2</sup> + … + (1 + 月利)<sup>月数 − 1</sup>{"}"} で、
          かっこの中は公比 (1 + 月利) の等比数列の和です。和の公式を使うと上の式になります。
        </p>
      </details>
    </div>
  )
}
