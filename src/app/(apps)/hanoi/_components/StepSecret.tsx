// ======================================================
// ステップ③ 回数のひみつ（2ⁿ−1 を納得する）
//
// 予想 → 確かめる の順に並べる。上から順に読めば授業ウ-2 の流れになる。
// 色：円盤の色は「その円盤が動く」の意味だけなので、ここのブロック・グラフは中立色（グレー）だけを使う。
// ======================================================

"use client"

import { Fragment, useState } from "react"
import { Btn } from "@/components/parts/buttons/Btn"
import { useText } from "@/components/parts/graph/Display"
import { DISK_STROKE, DISK_STROKE_WIDTH, ZONE_FIRST, ZONE_LAST, diskColor, labelColor } from "../_lib/colors"
import { diskMark } from "../_lib/play"
import * as T from "../_lib/textSecret"
import type { Level, Tab } from "../_lib/text"

interface Props {
  level: Level
  onGoTab: (t: Tab) => void
}

const HATCH = `repeating-linear-gradient(45deg, ${ZONE_FIRST} 0 4px, #374151 4px 8px)`

// ---- 表（F3-1）------------------------------------------------------------------
type Reveal = 0 | 1 | 2 | 3 // 0：1〜4枚　1：5枚を「？」で　2：5枚の答えを出した　3：10枚まで

function TableSection() {
  const [reveal, setReveal] = useState<Reveal>(0)
  const max = reveal === 0 ? 4 : reveal === 3 ? 10 : 5
  const rows = Array.from({ length: max }, (_, i) => i + 1)
  const cell = "border border-gray-300 dark:border-gray-600 px-4 py-1.5"
  const hiddenFive = (n: number) => n === 5 && reveal === 1
  return (
    <section className="space-y-3" aria-label={T.TABLE_TITLE}>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{T.TABLE_TITLE}</h2>
      <div className="overflow-x-auto">
        <table className="text-center border-collapse tabular-nums" data-table>
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
              {T.TABLE_HEAD.map((h) => (
                <th key={h} className={`${cell} font-bold`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-900 dark:text-gray-50 text-lg">
            {rows.map((n, i) => (
              <Fragment key={n}>
                {i > 0 && (
                  <tr aria-hidden className="text-gray-500 dark:text-gray-400 text-sm">
                    <td />
                    <td />
                    <td className="py-0.5">↓ ×2</td>
                  </tr>
                )}
                <tr data-row={n}>
                  <td className={cell}>{n}</td>
                  <td className={`${cell} font-bold`} data-count={n}>{hiddenFive(n) ? "？" : 2 ** n - 1}</td>
                  <td className={`${cell} font-bold`} data-plus1={n}>{hiddenFive(n) ? "？" : 2 ** n}</td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {reveal === 0 && (
        <Btn color="accent" onClick={() => setReveal(1)} className="px-4 py-2 shrink-0">{T.BTN_PREDICT}</Btn>
      )}
      {reveal === 1 && (
        <div className="space-y-2">
          <p className="text-gray-700 dark:text-gray-200">{T.TABLE_PREDICT_NOTE}</p>
          <Btn color="accent" onClick={() => setReveal(2)} className="px-4 py-2 shrink-0">{T.BTN_REVEAL}</Btn>
        </div>
      )}
      {reveal >= 2 && (
        <div className="space-y-2">
          <p className="font-bold text-gray-800 dark:text-gray-100">{T.TABLE_NOTICE}</p>
          {reveal === 2 && <Btn color="neutral" onClick={() => setReveal(3)} className="px-4 py-2 shrink-0">{T.BTN_MORE}</Btn>}
        </div>
      )}
    </section>
  )
}

// ---- ブロック図（F3-2）-----------------------------------------------------------
function BlockSection() {
  const [n, setN] = useState(3)
  const [stage, setStage] = useState<0 | 1 | 2>(0) // 0：[a][1][a]　1：おまけの1手　2：同じ長さの2つに組み直し
  const { a, total } = T.blockLengths(n)
  const readout = useText("readout")
  const blocks = stage === 0 ? [a, 1, a] : stage === 1 ? [a, 1, a, 1] : [a + 1, a + 1]
  const plain = "flex items-center justify-center rounded text-sm md:text-base font-bold h-12 overflow-hidden transition-all duration-700"
  const block = (len: number, kind: "a" | "one" | "extra" | "merged", key: string) => {
    const style: React.CSSProperties = { flexGrow: len, flexBasis: 0, minWidth: kind === "one" || kind === "extra" ? 30 : 0 }
    const label = `${len}`
    if (kind === "a") return <div key={key} className={plain} style={{ ...style, background: HATCH, color: "#FFFFFF" }}>{label}</div>
    if (kind === "one")
      return <div key={key} className={`${plain} bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900`} style={style}>{label}</div>
    if (kind === "extra")
      return <div key={key} className={`${plain} border-2 border-dashed border-gray-700 dark:border-gray-200 text-gray-800 dark:text-gray-100`} style={style}>{label}</div>
    return <div key={key} className={`${plain} border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-50`} style={{ ...style, background: ZONE_LAST }}>{label}</div>
  }
  return (
    <section className="space-y-3" aria-label={T.BLOCK_TITLE}>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{T.BLOCK_TITLE}</h2>
      <p className="text-gray-700 dark:text-gray-200">{T.BLOCK_INTRO}</p>
      <p className="font-bold text-gray-800 dark:text-gray-100">{n}枚の場合（{stage === 0 ? `${a} ＋ 1 ＋ ${a} ＝ ${2 * a + 1}手` : `${T.blockLabel(n)} ＝ ${total}`}）</p>
      <div className="flex w-full gap-1" data-blocks={blocks.join(",")} data-block-stage={stage}>
        {stage === 0 && [block(a, "a", "a1"), block(1, "one", "m"), block(a, "a", "a2")]}
        {stage === 1 && [block(a, "a", "a1"), block(1, "one", "m"), block(a, "a", "a2"), block(1, "extra", "x")]}
        {stage === 2 && [block(a + 1, "merged", "g1"), block(a + 1, "merged", "g2")]}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {stage === 0 && <Btn color="accent" onClick={() => setStage(1)} className="px-4 py-2 shrink-0">{T.BTN_EXTRA}</Btn>}
        {stage === 1 && <Btn color="accent" onClick={() => setStage(2)} className="px-4 py-2 shrink-0">{T.BTN_REGROUP}</Btn>}
        {stage > 0 && <Btn color="neutral" onClick={() => setStage(0)} className="px-4 py-2 shrink-0">{T.BTN_BLOCK_RESET}</Btn>}
        <Btn color="neutral" onClick={() => { setN((v) => v + 1); setStage(0) }} disabled={n >= 5} className="px-4 py-2 shrink-0">{T.BTN_NEXT_N}</Btn>
        <Btn color="neutral" onClick={() => { setN(1); setStage(0) }} disabled={n <= 1} className="px-4 py-2 shrink-0">1枚から</Btn>
      </div>
      {stage === 1 && <p className="text-gray-700 dark:text-gray-200">{T.BLOCK_EXTRA_NOTE}</p>}
      {stage === 2 && <p className="font-bold text-gray-800 dark:text-gray-100">{T.BLOCK_REGROUP_NOTE}</p>}
      <p className={`font-bold tabular-nums text-gray-900 dark:text-gray-50 ${readout}`} data-plus1-line>
        {[1, 2, 3, 4, 5].filter((k) => k <= n).map((k) => 2 ** k).join(" → ")}
      </p>
    </section>
  )
}

// ---- 2進法（F3-3）----------------------------------------------------------------
function BinarySection() {
  const [n, setN] = useState(4)
  const ones = "1".repeat(n)
  const readout = useText("readout")
  return (
    <section className="space-y-3" aria-label={T.BINARY_HEAD}>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{T.BINARY_HEAD}</h2>
      <div className="overflow-x-auto">
        <table className="text-center border-collapse tabular-nums" data-binary-table>
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
              {["枚数", "回数", "回数（2進法）", "＋1（2進法）", "＋1"].map((h) => (
                <th key={h} className="border border-gray-300 dark:border-gray-600 px-3 py-1 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-900 dark:text-gray-50">
            {[1, 2, 3, 4, 5].map((k) => (
              <tr key={k} data-bin-row={k}>
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-1">{k}</td>
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-1">{2 ** k - 1}</td>
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-1 font-mono font-bold" data-bin-count={k}>{"1".repeat(k)}</td>
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-1 font-mono font-bold" data-bin-plus={k}>1{"0".repeat(k)}</td>
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-1 font-bold">{2 ** k}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-gray-700 dark:text-gray-200">{T.BINARY_NOTE}</p>

      {/* 円盤ごとの回数 と 2進法の各けた */}
      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
          <span className="shrink-0">円盤の枚数</span>
          <input type="range" min={2} max={6} value={n} onChange={(e) => setN(Number(e.target.value))} className="w-32 accent-gray-600" aria-label="2進法の対応の円盤の枚数" />
          <span className="tabular-nums w-4">{n}</span>
        </label>
        <div className="overflow-x-auto">
          <table className="text-center border-collapse" data-bin-disks>
            <tbody className="text-gray-900 dark:text-gray-50">
              <tr>
                <th className="pr-3 text-left text-sm font-bold">円盤</th>
                {Array.from({ length: n }, (_, i) => i + 1).map((d) => (
                  <td key={d} className="px-2">
                    <span
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-base font-bold"
                      style={{ background: diskColor(d), color: labelColor(diskColor(d)), border: `${DISK_STROKE_WIDTH}px solid ${DISK_STROKE}` }}
                    >
                      {diskMark(d)}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <th className="pr-3 text-left text-sm font-bold">動いた回数</th>
                {Array.from({ length: n }, (_, i) => i + 1).map((d) => (
                  <td key={d} className="px-2 text-xl font-bold tabular-nums">{2 ** (n - d)}</td>
                ))}
              </tr>
              <tr>
                <th className="pr-3 text-left text-sm font-bold">2進法のけた</th>
                {Array.from({ length: n }, (_, i) => i + 1).map((d) => (
                  <td key={d} className="px-2 text-xl font-bold font-mono">1</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className={`font-bold tabular-nums text-gray-900 dark:text-gray-50 ${readout}`} data-bin-sum>
          {Array.from({ length: n }, (_, i) => 2 ** (n - 1 - i)).join("＋")}＝{2 ** n - 1}＝{ones}₍₂₎
        </p>
        <p className="text-gray-700 dark:text-gray-200">{T.BINARY_DISK_NOTE}</p>
      </div>
    </section>
  )
}

// ---- 結論（F3-4）-----------------------------------------------------------------
function Conclusion({ level }: { level: Level }) {
  const readout = useText("readout")
  return (
    <section className="rounded-xl border-2 border-gray-700 dark:border-gray-200 p-4 space-y-2" aria-label={T.CONCLUSION_TITLE} data-conclusion>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{T.CONCLUSION_TITLE}</h2>
      {T.conclusionLines(level).map((l) => (
        <p key={l} className={`font-bold text-gray-900 dark:text-gray-50 ${readout}`}>{l}</p>
      ))}
    </section>
  )
}

// ---- 棒グラフ（F3-5）-------------------------------------------------------------
function ChartSection({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const [max, setMax] = useState<10 | 20>(10)
  const values = Array.from({ length: max }, (_, i) => 2 ** (i + 1) - 1)
  const top = values[values.length - 1]
  const W = 600
  const H = 220
  const bw = W / max
  return (
    <section className="space-y-3" aria-label={T.CHART_TITLE}>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{T.CHART_TITLE}</h2>
      <div className="flex gap-2">
        {T.CHART_RANGES.map((r) => (
          <Btn key={r} color={max === r ? "accent" : "neutral"} onClick={() => setMax(r)} ariaPressed={max === r} className="px-4 py-2 shrink-0">
            1〜{r}枚
          </Btn>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full max-w-2xl" role="img" aria-label="枚数ごとの最少回数の棒グラフ" data-chart={max}>
        {values.map((v, i) => {
          const h = Math.max(1, (v / top) * H)
          return (
            <g key={i}>
              <rect x={i * bw + 2} y={H - h} width={bw - 4} height={h} className="fill-gray-500 dark:fill-gray-400" />
              <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle" fontSize={max === 10 ? 14 : 10} className="fill-gray-700 dark:fill-gray-200">{i + 1}</text>
            </g>
          )
        })}
        <text x={4} y={14} textAnchor="start" fontSize={13} className="fill-gray-700 dark:fill-gray-200">{max}枚で {top.toLocaleString("ja-JP")} 回</text>
      </svg>
      <p className="text-gray-700 dark:text-gray-200">{T.CHART_NOTE}</p>
      <Btn color="warm" onClick={() => onGoTab(4)} className="px-4 py-2 shrink-0">{T.BTN_TO_BIG}</Btn>
    </section>
  )
}

export function StepSecret({ level, onGoTab }: Props) {
  return (
    <div className="space-y-8">
      <p className="text-gray-700 dark:text-gray-200">{T.SECRET_INTRO}</p>
      <TableSection />
      <BlockSection />
      <BinarySection />
      <Conclusion level={level} />
      <ChartSection onGoTab={onGoTab} />
      <details className="rounded-lg border border-gray-200 dark:border-gray-700 p-3" data-why>
        <summary className="cursor-pointer font-bold text-gray-800 dark:text-gray-100">{T.WHY_TITLE}</summary>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-200">
          {T.WHY_LINES.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </details>
    </div>
  )
}
