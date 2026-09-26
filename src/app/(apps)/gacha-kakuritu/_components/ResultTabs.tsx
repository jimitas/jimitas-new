// ======================================================
// 集計結果 — タブ3枚
//   A 1回以上   … 1回以上当たったセッションの割合（横棒＋理論値マーカー）
//   B 当たり回数 … 1セッションの当たり回数の分布（二項分布と比較）
//   C 初当たり   … 初めて当たった回数の分布（幾何分布と比較）＋累積カーブ
//
// タブは ARIA の tablist。左右の矢印キーでも切り替えられる。
// ======================================================

"use client"

import { useRef, useState } from "react"
import * as se from "@/lib/se"
import { formatPercent, observedMedianFirstHit } from "../_lib/gachaMath"
import type { GachaStats } from "../_lib/gachaMath"
import { cumulativePoints, firstHitColumns, hitsColumns } from "../_lib/chartData"
import type { Theory } from "../_lib/chartData"
import { fmtInt } from "../_lib/settings"
import { Card } from "./Card"
import { ColumnChart } from "./ColumnChart"
import { CumulativeCurve } from "./CumulativeCurve"
import type { CurrentSession } from "../_lib/session"

type TabId = "a" | "b" | "c"
const TABS: { id: TabId; label: string }[] = [
  { id: "a", label: "1回以上" },
  { id: "b", label: "当たり回数" },
  { id: "c", label: "初当たり" },
]

interface Props {
  stats: GachaStats
  theory: Theory
  cur: CurrentSession | null
}

const B = "text-accent-700 dark:text-accent-300"
const MUTED = "text-gray-500 dark:text-gray-400"

function Legend({ theoryLabel }: { theoryLabel: string }) {
  return (
    <p className={`mt-2 text-xs ${MUTED}`}>
      <span className="inline-block w-3.5 h-2.5 mr-1 align-middle rounded-sm bg-accent-500" />シミュレーション
      <span className="inline-block w-3.5 ml-4 mr-1 align-middle border-t-[3px] border-gray-800 dark:border-gray-100" />{theoryLabel}
    </p>
  )
}

/** 項目名と値の行（B・C の上に出す） */
function KV({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="mb-3 flex flex-col gap-1 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex flex-wrap gap-x-2">
          <dt className={`${MUTED} min-w-full sm:min-w-[9em]`}>{k}</dt>
          <dd className="tabular-nums text-gray-800 dark:text-gray-100">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ResultTabs({ stats, theory, cur }: Props) {
  const [tab, setTab] = useState<TabId>("a")
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const s = stats.sessions
  const has = s > 0
  const { N, p } = stats

  const select = (i: number, focus = false) => {
    if (TABS[i].id !== tab) se.playSe(se.set)
    setTab(TABS[i].id)
    if (focus) tabRefs.current[i]?.focus()
  }

  return (
    <Card
      title="集計結果"
      aside={<p className={`text-sm ${MUTED}`}>集計 <b className="text-base text-gray-800 dark:text-gray-100">{fmtInt(s)}</b> セッション</p>}
    >
      <div role="tablist" aria-label="結果の見方" className="flex gap-1 border-b-2 border-gray-200 dark:border-gray-700 mb-3">
        {TABS.map((t, i) => {
          const on = t.id === tab
          return (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[i] = el }}
              id={`gk-tab-${t.id}`}
              role="tab"
              aria-selected={on}
              aria-controls={`gk-panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
                e.preventDefault()
                select((i + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length, true)
              }}
              className={`shrink-0 -mb-0.5 px-3 sm:px-4 py-2 font-bold border-b-[3px] ${
                on
                  ? "border-accent-500 text-accent-700 dark:text-accent-300"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* 見えていないパネルも DOM に残す（aria-controls の参照先が消えないように） */}
      <PanelA stats={stats} theory={theory} hidden={tab !== "a"} />
      <section id="gk-panel-b" role="tabpanel" aria-labelledby="gk-tab-b" hidden={tab !== "b"}>
          <p className="mb-2 text-gray-800 dark:text-gray-100">1セッション（N 回）で当たりが<b>何回</b>出たか</p>
          <KV rows={[
            ["いまのセッション", <>
              <b className={B}>{cur ? fmtInt(cur.hits) : "―"}</b> 回 / {fmtInt(N)} 回 → <b className={B}>{cur && cur.k > 0 ? formatPercent(cur.hits / cur.k) : "―"}</b>
            </>],
            ["全セッション合計", <>
              <b className={B}>{fmtInt(stats.totalHits)}</b> 回 / {fmtInt(s * N)} 回 → <b className={B}>{has ? formatPercent(stats.totalHits / (s * N)) : "―"}</b>（設定 {formatPercent(p)}）
            </>],
          ]} />
          <ColumnChart columns={hitsColumns(stats, theory)} hasData={has} label="1セッションの当たり回数ごとのセッション割合" headLabel="当たり回数" />
          <p className={`mt-1 text-xs ${MUTED}`}>横軸：1セッションの当たり回数　縦軸：セッションの割合</p>
          <Legend theoryLabel="理論値（二項分布）" />
      </section>
      <PanelC stats={stats} theory={theory} hidden={tab !== "c"} />
    </Card>
  )
}

interface PanelProps {
  stats: GachaStats
  theory: Theory
  hidden: boolean
}

function PanelA({ stats, theory, hidden }: PanelProps) {
  const s = stats.sessions
  const has = s > 0
  const rows = [
    { label: "1回以上", count: stats.sessionsWithHit, th: theory.pAtLeast, fill: "bg-accent-500" },
    { label: "0回", count: stats.hitsHist[0], th: theory.pNone, fill: "bg-gray-500" },
  ]
  return (
    <section id="gk-panel-a" role="tabpanel" aria-labelledby="gk-tab-a" hidden={hidden}>
      <p className="mb-2 text-gray-800 dark:text-gray-100">N 回引いて<b>1回以上当たった</b>セッションの割合</p>
      <div className="flex flex-wrap gap-4 mb-3">
        <div className="flex-[1_1_180px] rounded-lg bg-gray-50 dark:bg-gray-900 px-3.5 py-2.5">
          <span className={`block text-sm ${MUTED}`}>シミュレーション</span>
          <span className={`text-4xl font-bold tabular-nums ${B}`}>{has ? formatPercent(stats.sessionsWithHit / s) : "―"}</span>
        </div>
        <div className="flex-[1_1_180px] rounded-lg bg-gray-50 dark:bg-gray-900 px-3.5 py-2.5">
          <span className={`block text-sm ${MUTED}`}>理論値</span>
          <span className="text-4xl font-bold tabular-nums text-gray-800 dark:text-gray-100">{formatPercent(theory.pAtLeast)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const rate = has ? r.count / s : NaN
          return (
            <div key={r.label} className="grid grid-cols-[4em_1fr_4.2em] sm:grid-cols-[5em_1fr_5em] items-center gap-2.5">
              <span className="text-gray-800 dark:text-gray-100">{r.label}</span>
              <div className="relative h-[18px] rounded-full bg-gray-200 dark:bg-gray-700">
                <div className={`h-full rounded-full ${r.fill} motion-safe:transition-[width] duration-100`} style={{ width: has ? `${rate * 100}%` : "0%" }} />
                <div className="absolute -top-0.5 -bottom-0.5 w-[3px] -ml-[1.5px] bg-gray-800 dark:bg-gray-100" style={{ left: `${r.th * 100}%` }} title="理論値" />
              </div>
              <span className="text-right tabular-nums text-gray-800 dark:text-gray-100" title={has ? `${fmtInt(r.count)} / ${fmtInt(s)} セッション` : ""}>
                {has ? formatPercent(rate) : "―"}
              </span>
            </div>
          )
        })}
      </div>
      <Legend theoryLabel="理論値" />
      <table className="sr-only">
        <caption>1回以上当たったセッションの割合</caption>
        <thead><tr><th scope="col">結果</th><th scope="col">シミュレーション</th><th scope="col">理論値</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              <td>{has ? `${formatPercent(r.count / s)}（${fmtInt(r.count)} / ${fmtInt(s)}）` : "―"}</td>
              <td>{formatPercent(r.th)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function PanelC({ stats, theory, hidden }: PanelProps) {
  const s = stats.sessions
  const has = s > 0
  const N = stats.N
  const medObs = observedMedianFirstHit(stats)
  const cum = cumulativePoints(stats)
  const mean = theory.mean
  const meanText = Number.isInteger(mean) ? fmtInt(mean) : mean.toLocaleString("ja-JP", { maximumFractionDigits: 1 })
  return (
    <section id="gk-panel-c" role="tabpanel" aria-labelledby="gk-tab-c" hidden={hidden}>
      <p className="mb-2 text-gray-800 dark:text-gray-100"><b>何回目</b>で初めて当たりが出たか</p>
      <KV rows={[
        ["初当たりの中央値", <>
          シミュレーション <b className={B}>{!has ? "―" : medObs > 0 ? `${fmtInt(medObs)}回目` : `${fmtInt(N)}回以内に半数に届かず`}</b>
          {" "}/ 理論 <b className={B}>{theory.median <= N ? `${fmtInt(theory.median)}回目` : `${fmtInt(theory.median)}回目（N を超える）`}</b>
        </>],
        ["平均（理論）", <><b className={B}>{meanText}</b> 回目</>],
        ["N 回以内に出ず", <>
          シミュレーション <b className={B}>{has ? formatPercent(stats.firstHitHist[0] / s) : "―"}</b> / 理論 <b className={B}>{formatPercent(theory.pNone)}</b>
        </>],
      ]} />
      <ColumnChart columns={firstHitColumns(stats, theory)} hasData={has} label="初当たりが出た回数の分布" headLabel="初当たりの回数" />
      <p className={`mt-1 text-xs ${MUTED}`}>横軸：初当たりが出た回数（区間）　縦軸：セッションの割合</p>
      <Legend theoryLabel="理論値（幾何分布）" />

      <h3 className="mt-4 mb-1 text-sm font-bold text-gray-800 dark:text-gray-100">k 回目までに当たった人の割合（累積）</h3>
      <CumulativeCurve N={N} theory={cum.theory} obs={cum.obs} />
    </section>
  )
}
