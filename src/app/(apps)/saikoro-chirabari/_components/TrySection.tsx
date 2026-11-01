// ======================================================
// セクション1：ふってみる（F-1〜F-4）
//
// 方式を切りかえたら結果は消す（A と B の得点を混ぜないため）。
// key={method} で中身ごと作り直すと、useRoller の state も一緒に初期化される。
// ======================================================

"use client"

import { useState } from "react"
import type { Method } from "../_lib/dice"
import { tallyMean } from "../_lib/stats"
import { ConvergenceChart } from "./ConvergenceChart"
import { DotPlot } from "./DotPlot"
import { MethodTabs } from "./MethodTabs"
import { RollControls } from "./RollControls"
import { Section } from "./Section"
import { StatsCard } from "./StatsCard"
import { useRoller } from "./useRoller"
import { METHOD_LABEL } from "./methodStyle"

const METHODS = ["A", "B"] as const

export function TrySection() {
  const [method, setMethod] = useState<Method>("A")
  return (
    <Section
      id="furu"
      num={1}
      title="ふってみる"
      lead="回数を選んでさいころをふろう。回数を増やすと、標準偏差は理論値に近づいていく。"
    >
      <MethodTabs options={METHODS} current={method} onChange={setMethod} />
      <TryBody key={method} method={method} />
    </Section>
  )
}

function TryBody({ method }: { method: Method }) {
  const { tallies, busy, roll, reset } = useRoller([method])
  const t = tallies[0]
  return (
    <>
      <RollControls roll={roll} reset={reset} busy={busy} n={t.n} />
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-2 shadow-sm">
          <DotPlot method={method} counts={t.counts} n={t.n} mean={tallyMean(t)} label={`${METHOD_LABEL[method]}の得点のドットプロット`} />
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-2 shadow-sm">
          <ConvergenceChart series={[{ method, history: t.sdHistory }]} />
        </div>
      </div>
      <StatsCard method={method} tally={t} />
    </>
  )
}
