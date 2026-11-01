// ======================================================
// セクション2：A方式とB方式をくらべる（F-5）
//
// 2つの方式を同じ回数ずつ同時にふる。PC では左右、スマホでは上下に並べる。
// 平均はどちらも 7 に近づき、標準偏差だけが違っていくことを見せる。
// ======================================================

"use client"

import { tallyMean } from "../_lib/stats"
import { ConvergenceChart } from "./ConvergenceChart"
import { DotPlot } from "./DotPlot"
import { RollControls } from "./RollControls"
import { Section } from "./Section"
import { StatsCard } from "./StatsCard"
import { useRoller } from "./useRoller"
import { METHOD_BORDER, METHOD_LABEL, METHOD_RULE, METHOD_TEXT } from "./methodStyle"

const METHODS = ["A", "B"] as const

export function CompareSection() {
  const { tallies, busy, roll, reset } = useRoller(METHODS)
  return (
    <Section
      id="kuraberu"
      num={2}
      title="A方式とB方式をくらべる"
      lead="同じ回数ずつ同時にふる。平均はどちらも 7 に近づくのに、散らばり（標準偏差）は違う。"
    >
      <RollControls roll={roll} reset={reset} busy={busy} n={tallies[0].n} />
      <div className="grid gap-4 md:grid-cols-2">
        {METHODS.map((m, i) => (
          <div key={m} className={`flex flex-col gap-2 rounded-xl border-t-8 ${METHOD_BORDER[m]} bg-white dark:bg-gray-800 p-2 shadow-sm`}>
            <h3 className={`text-lg font-bold ${METHOD_TEXT[m]}`}>
              {METHOD_LABEL[m]} <span className="text-sm font-normal text-gray-600 dark:text-gray-300">（{METHOD_RULE[m]}）</span>
            </h3>
            <DotPlot method={m} counts={tallies[i].counts} n={tallies[i].n} mean={tallyMean(tallies[i])} label={`${METHOD_LABEL[m]}の得点のドットプロット`} />
            <StatsCard method={m} tally={tallies[i]} compact />
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-white dark:bg-gray-800 p-2 shadow-sm">
        <ConvergenceChart series={METHODS.map((m, i) => ({ method: m, history: tallies[i].sdHistory }))} />
      </div>
    </Section>
  )
}
