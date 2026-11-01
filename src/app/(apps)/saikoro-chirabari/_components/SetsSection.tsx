// ======================================================
// セクション3：10回だと、どれくらいブレる？（F-6）★中核
//
// 「10回ふって標準偏差を出す」を1セットとして、何百・何千セットもくりかえし、
// 出てきた標準偏差の散らばりをヒストグラムで見せる。
// 答える問いは1つ：「10回しか振っていない自分たちの標準偏差は、理論値とズレていて当たり前なのか？」
//
// 状態は useSets にまとめ、page から持つ。
// セクション4（班のデータ）から「ヒストグラムで位置を見る」で方式を切りかえるため。
// 10,000セット = 10万回ふるだけなので一度に計算しても一瞬で終わる（分割はしない）。
// ======================================================

"use client"

import { useMemo, useState } from "react"
import * as se from "@/lib/se"
import { Btn } from "@/components/parts/buttons/Btn"
import type { Method } from "../_lib/dice"
import { THEORY } from "../_lib/stats"
import { TRIALS_PER_SET, average, middleBand, shareAtOrBelow, simulateSetSds } from "../_lib/sets"
import { fixed, fmt2, fmtInt } from "../_lib/format"
import { verdictKind, verdictText } from "../_lib/verdict"
import { LegendLine, SdHistogram } from "./SdHistogram"
import { MethodTabs } from "./MethodTabs"
import type { MethodChoice } from "./MethodTabs"
import { Section } from "./Section"
import { METHOD_LABEL, METHOD_TEXT } from "./methodStyle"

export const SET_CHOICES = [100, 1000, 10000] as const
const DEFAULT_SETS = 1000
const CHOICES = ["A", "B", "AB"] as const

type SdData = Record<Method, Float64Array | null>

const methodsOf = (c: MethodChoice): Method[] => (c === "AB" ? ["A", "B"] : [c])

export function useSets() {
  const [choice, setChoice] = useState<MethodChoice>("A")
  const [count, setCount] = useState<number | null>(null)
  const [data, setData] = useState<SdData>({ A: null, B: null })

  /** 今の方式で sets セットくりかえす（両方のときは A・B を同じ数ずつ） */
  const run = (sets: number, c: MethodChoice = choice) => {
    const next: SdData = { ...data }
    for (const m of methodsOf(c)) next[m] = simulateSetSds(m, sets, Math.random)
    setData(next)
    setCount(sets)
  }

  /** 方式を切りかえる。まだその方式の結果がなければ、同じセット数でくりかえしておく */
  const select = (c: MethodChoice) => {
    setChoice(c)
    const missing = methodsOf(c).some((m) => data[m] === null || data[m]!.length !== (count ?? DEFAULT_SETS))
    if (missing) run(count ?? DEFAULT_SETS, c)
  }

  return { choice, count, data, run, select }
}

export type SetsState = ReturnType<typeof useSets>

interface Props {
  sets: SetsState
  /** セクション4で入力した班の標準偏差 */
  group: { method: Method; sd: number } | null
}

export function SetsSection({ sets, group }: Props) {
  const { choice, count, data, run, select } = sets
  // 下の Summary の useMemo が毎回計算し直さないよう、series もデータが変わったときだけ作る
  const series = useMemo(
    () => methodsOf(choice).flatMap((m) => { const sds = data[m]; return sds ? [{ method: m, sds }] : [] }),
    [choice, data],
  )
  const marker = group && series.some((s) => s.method === group.method) ? group.sd : null

  return (
    <Section
      id="bure"
      num={3}
      title="10回だと、どれくらいブレる？"
      lead={<>「{TRIALS_PER_SET}回ふって標準偏差を出す」を1セットとして、何セットもくりかえしてみよう。セットごとに出た標準偏差を、ヒストグラムにする。</>}
    >
      <MethodTabs options={CHOICES} current={choice} onChange={select} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 text-sm font-bold text-gray-600 dark:text-gray-300">くりかえす数</span>
        {SET_CHOICES.map((k) => (
          <Btn
            key={k}
            color="brand"
            sound="none"
            onClick={() => {
              se.playSe(se.set)
              run(k)
            }}
            ariaPressed={count === k}
            className={`px-3 py-2 md:text-base tabular-nums ${count === k ? "ring-4 ring-brand-200 dark:ring-brand-800" : ""}`}
          >
            {fmtInt(k)}セット
          </Btn>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr] items-start">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-2 shadow-sm">
          <SdHistogram
            series={series}
            marker={marker}
            markerLabel={group && series.length > 1 ? `班（${group.method}）` : undefined}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            横：10回ふって計算した標準偏差 ／ 縦：そのくらいの値が出たセットの多さ
          </p>
        </div>
        <Summary series={series} group={group} marker={marker} />
      </div>
    </Section>
  )
}

function Summary({
  series,
  group,
  marker,
}: {
  series: { method: Method; sds: Float64Array }[]
  group: Props["group"]
  marker: number | null
}) {
  // 10,000個を並べかえるので、データが変わったときだけ計算する
  const facts = useMemo(
    () =>
      series.map((s) => ({
        method: s.method,
        n: s.sds.length,
        band: middleBand(s.sds),
        avg: average(s.sds),
        groupShare: group && group.method === s.method ? shareAtOrBelow(s.sds, group.sd) : null,
      })),
    [series, group],
  )
  const reversal = useMemo(() => {
    if (series.length !== 2) return null
    const [a, b] = series
    let k = 0
    for (let i = 0; i < a.sds.length; i++) if (a.sds[i] > b.sds[i]) k++
    return { k, n: a.sds.length }
  }, [series])

  if (facts.length === 0) {
    return <p className="text-base text-gray-600 dark:text-gray-300">くりかえす数を選ぶと、ここに結果が出ます。</p>
  }

  return (
    <div className="flex flex-col gap-3 text-base text-gray-800 dark:text-gray-100">
      {facts.map((f) => (
        <div key={f.method} className="rounded-xl bg-white dark:bg-gray-800 p-3 shadow-sm">
          <div className={`font-bold ${METHOD_TEXT[f.method]}`}>{METHOD_LABEL[f.method]}（{fmtInt(f.n)}セット）</div>
          <p className="mt-1 text-lg">
            10回だと、標準偏差は
            <b className="mx-1 text-2xl tabular-nums">{fmt2(f.band.lo)}〜{fmt2(f.band.hi)}</b>
            くらいまで、ふつうにブレます。
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            <li className="flex items-center"><LegendLine kind="theory" />理論値 <b className="ml-1 tabular-nums">{fmt2(THEORY[f.method].sd)}</b></li>
            {series.length === 1 && (
              <li className="flex items-center"><LegendLine kind="band" />真ん中の80%のセットが入る範囲（このくらいの値は珍しくない）</li>
            )}
            <li className="flex items-start">
              <LegendLine kind="average" />
              <span>
                10回で出した標準偏差の平均 <b className="tabular-nums">{fmt2(f.avg)}</b>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  理論値より少し左に寄るのは、10回だけで計算しているから。まちがいではありません。
                </span>
              </span>
            </li>
          </ul>
        </div>
      ))}

      {reversal && (
        <p className="rounded-xl bg-white dark:bg-gray-800 p-3 shadow-sm">
          A方式とB方式を1セットずつ組にして比べると、<b>A方式の標準偏差のほうが大きくなった</b>のは
          <b className="mx-1 text-2xl tabular-nums">{fmtInt(reversal.k)}</b>組 ／ {fmtInt(reversal.n)}組
          （<b className="tabular-nums">{fixed((reversal.k / reversal.n) * 100, 1)}%</b>）。
          理論的には B方式のほうが散らばるのに、10回だと逆になることもふつうにあります。
        </p>
      )}

      {group && (
        <GroupNote group={group} marker={marker} facts={facts} bandShown={series.length === 1} />
      )}
    </div>
  )
}

function GroupNote({
  group,
  marker,
  facts,
  bandShown,
}: {
  group: { method: Method; sd: number }
  marker: number | null
  /** 図に真ん中80%の帯が出ているか（1方式のときだけ出る） */
  bandShown: boolean
  facts: { method: Method; band: { lo: number; hi: number }; groupShare: number | null }[]
}) {
  const f = facts.find((x) => x.method === group.method)
  if (marker === null || !f || f.groupShare === null) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        班のデータ（{METHOD_LABEL[group.method]}・標準偏差 {fmt2(group.sd)}）は、{METHOD_LABEL[group.method]}のタブで ▼ の位置に出ます。
      </p>
    )
  }
  const inside = group.sd >= f.band.lo - 1e-9 && group.sd <= f.band.hi + 1e-9
  const text = verdictText(verdictKind(f.groupShare, inside), bandShown)
  return (
    <div className="rounded-xl border-2 border-gray-800 dark:border-gray-100 bg-white dark:bg-gray-800 p-3">
      <div className="flex items-center font-bold"><LegendLine kind="marker" />班の標準偏差（{METHOD_LABEL[group.method]}） <span className="ml-1 text-2xl tabular-nums">{fmt2(group.sd)}</span></div>
      <p className="mt-1">
        小さいほうから数えて <b className="tabular-nums">{fixed(f.groupShare * 100, 1)}%</b> の位置。
        {text}
      </p>
    </div>
  )
}
