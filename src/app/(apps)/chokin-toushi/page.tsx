// ======================================================
// 貯蓄と投資の積み立てシミュレーター ページ
//
// URL: /chokin-toushi
// 対象: 中学・高校（家庭科の資産形成・数学の等比数列）
// 移植元: C:\claude\edu-apps\investment（Vanilla JS ＋ Chart.js 版）
//
// 機能:
//   - 毎月の積立額・年数・貯蓄と投資の利率（0〜15%）を決める
//   - はじめはグラフを伏せておき、「グラフを見る」で 0年から線が伸びていく（約4秒）
//     最初から結果が見えていると驚きが半減するため（2026-10-10 オーナー要望）
//   - 描き終えたら、まとめと公式の代入過程を出す。そのあと条件を変えるとすぐ描き直す
//     （毎回アニメだと、何度もくらべるときに待たされる）。「もう一度再生」で再びアニメ
//   - 推移グラフ（タップした年の金額を表示）・まとめ・公式の代入過程
//
// 移植元との違い:
//   - 利率を変えられる（移植元は 0.3% / 5% 固定）
//   - alert() をやめ、入力の誤りはページ内に出す
//   - グラフを 0年（0円）から描く（移植元は 1か月目に「0年」と書いていた）
//   - 元本割れ・値動きの注意書き、税金・手数料の一文を追加
//
// 計算と文言はすべて _lib/compound.ts（jest でテスト済み）。ここは配線だけ。
// コインは付けない（問題に答える形ではないため）。
// ======================================================

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import * as se from "@/lib/se"
import { Btn } from "@/components/parts/buttons/Btn"
import { BtnMode } from "@/components/parts/buttons/BtnMode"
import {
  AMOUNT_MAX, AMOUNT_MIN, RATE_MAX, RATE_MIN, RATE_STEP, YEARS_MAX, YEARS_MIN,
  REVEAL_MS, balances, comparisonNote, drawnMonth, fmtPct, fmtYen, readInput, revealProgress,
} from "./_lib/compound"
import type { InputForm, Params } from "./_lib/compound"
import { Card } from "./_components/Card"
import { FormulaSteps } from "./_components/FormulaSteps"
import { GrowthChart } from "./_components/GrowthChart"
import { SliderField } from "./_components/SliderField"
import { SummaryCards } from "./_components/SummaryCards"

const INITIAL_FORM: InputForm = { amount: "3", years: 20, savingPct: 0.3, investPct: 5 }
const AMOUNT_PRESETS = ["1", "3", "5", "10"]
const YEAR_PRESETS = [10, 20, 30, 40]
const SAVING_PRESETS = [0.1, 0.3, 0.5, 1]
const INVEST_PRESETS = [1, 3, 5, 7]

/** hidden: まだ見せていない / playing: 線が伸びている / shown: 描き終えた */
type Phase = "hidden" | "playing" | "shown"

export default function ChokinToushiPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  // 最後に正しく読めた入力。金額の欄が空のあいだも、これでグラフを出し続ける
  const [params, setParams] = useState<Params>(() => readInput(INITIAL_FORM).params!)
  const errors = readInput(form).errors
  // 金額を表示する年。null なら最後の年（年数を変えても最後の年についていく）
  const [picked, setPicked] = useState<number | null>(null)

  const update = (next: InputForm) => {
    setForm(next)
    // 年数を変えたら最後の年の表示にもどす（利率を変えたときは、同じ年でくらべられるよう残す）
    if (next.years !== form.years) setPicked(null)
    const r = readInput(next)
    if (r.params) setParams(r.params)
  }

  const { monthlyYen, years, savingPct, investPct } = params
  const series = useMemo(() => {
    const saving = balances(monthlyYen, years, savingPct)
    const invest = balances(monthlyYen, years, investPct)
    const principal = saving.map((_, m) => monthlyYen * m)
    return { saving, invest, principal }
  }, [monthlyYen, years, savingPct, investPct])
  const finalSaving = series.saving[series.saving.length - 1]
  const finalInvest = series.invest[series.invest.length - 1]
  const selectedYear = picked === null ? years : Math.min(picked, years)

  // ---- 表示アニメ ------------------------------------------------------------
  const [phase, setPhase] = useState<Phase>("hidden")
  // 進み具合 0〜1。月数ではなく割合で持つので、再生中に年数を変えても続けられる
  const [progress, setProgress] = useState(0)
  const raf = useRef(0)

  // ページを離れたらアニメを止める
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const play = () => {
    cancelAnimationFrame(raf.current)
    setPicked(null)
    // 「動きを減らす」設定なら、アニメなしで一度に出す
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const duration = reduce ? 0 : REVEAL_MS
    setPhase("playing")
    setProgress(0)
    const start = performance.now()
    const frame = (now: number) => {
      const p = revealProgress(now - start, duration)
      setProgress(p)
      if (p < 1) {
        raf.current = requestAnimationFrame(frame)
        return
      }
      setPhase("shown")
      se.playSe(se.piron)
    }
    raf.current = requestAnimationFrame(frame)
  }
  const drawMonth = phase === "shown" ? years * 12 : drawnMonth(progress, years * 12)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-center mb-1 text-gray-800 dark:text-gray-100">
        貯蓄と投資の積み立てシミュレーター
      </h1>
      <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-5">
        毎月同じ金額を積み立てたら、何年後にいくらになる？ 利率を変えて、貯蓄と投資をくらべてみよう
      </p>

      <div className="flex flex-col gap-4">
        <Card title="条件">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label htmlFor="ct-amount" className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">
                毎月の積立額
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="ct-amount" type="number" inputMode="decimal" min={AMOUNT_MIN} max={AMOUNT_MAX} step="any"
                  className="w-28 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-2xl font-bold text-right text-gray-800 dark:text-gray-100 tabular-nums"
                  value={form.amount}
                  onChange={(e) => update({ ...form, amount: e.target.value })}
                />
                <span className="shrink-0 text-gray-700 dark:text-gray-200">万円</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label="毎月の積立額をえらぶ">
                {AMOUNT_PRESETS.map((v) => (
                  <BtnMode key={v} value={v} current={form.amount} onChange={(a) => update({ ...form, amount: a })} className="py-1 shrink-0">
                    {v}万円
                  </BtnMode>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{AMOUNT_MIN}〜{AMOUNT_MAX} 万円</p>
            </div>

            <SliderField
              id="ct-years" label="積み立てる年数" value={form.years}
              min={YEARS_MIN} max={YEARS_MAX} step={1} unit="年" presets={YEAR_PRESETS}
              onChange={(y) => update({ ...form, years: y })}
              valueClass="text-gray-800 dark:text-gray-100"
            />
            <SliderField
              id="ct-invest" label="投資の利回り（年利）" value={form.investPct}
              min={RATE_MIN} max={RATE_MAX} step={RATE_STEP} unit="%" presets={INVEST_PRESETS}
              onChange={(v) => update({ ...form, investPct: v })}
              valueClass="text-warm-700 dark:text-warm-300"
            />
            <SliderField
              id="ct-saving" label="貯蓄の金利（年利）" value={form.savingPct}
              min={RATE_MIN} max={RATE_MAX} step={RATE_STEP} unit="%" presets={SAVING_PRESETS}
              onChange={(v) => update({ ...form, savingPct: v })}
              valueClass="text-accent-700 dark:text-accent-300"
            />
          </div>
          {errors.length > 0 && (
            <p className="mt-3 rounded-lg bg-danger-50 dark:bg-danger-700 px-3 py-2 text-sm text-danger-700 dark:text-danger-50" aria-live="polite">
              {errors.join(" ")}（グラフ・まとめ・計算は、前の条件のままです）
            </p>
          )}
        </Card>

        <Card title={`${years}年間の資産の推移`}>
          {phase === "hidden" ? (
            // まだ見せていない：グラフの場所に問いかけとボタンだけ
            <div className="flex flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-12 md:py-16 text-center">
              <p className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
                毎月 {fmtYen(monthlyYen)} を {years}年間 積み立てると、いくらになるでしょう？
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                投資（年{fmtPct(investPct)}%）と 貯蓄（年{fmtPct(savingPct)}%）を くらべてみよう
              </p>
              <Btn color="brand" onClick={play} className="px-8 py-3 text-lg md:text-xl">
                ▶ グラフを見る
              </Btn>
            </div>
          ) : (
            <GrowthChart
              years={years}
              saving={series.saving}
              invest={series.invest}
              principal={series.principal}
              savingPct={savingPct}
              investPct={investPct}
              drawMonth={drawMonth}
              playing={phase === "playing"}
              selectedYear={selectedYear}
              onSelectYear={(y) => setPicked(y === years ? null : y)}
              actions={
                <Btn color="neutral" onClick={play} disabled={phase === "playing"} className="self-start px-4 py-2">
                  ▶ もう一度再生
                </Btn>
              }
            />
          )}
        </Card>

        {phase === "shown" && (
          <>
            <SummaryCards
              years={years}
              principal={monthlyYen * years * 12}
              saving={finalSaving}
              invest={finalInvest}
              savingPct={savingPct}
              investPct={investPct}
            />

            <Card title={`${years}年後の資産はいくら？（複利の計算）`}>
              <FormulaSteps
                monthlyYen={monthlyYen}
                years={years}
                savingPct={savingPct}
                investPct={investPct}
                saving={finalSaving}
                invest={finalInvest}
                comparison={comparisonNote(years, finalSaving, finalInvest)}
              />
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
