// ======================================================
// ステップ④ 64枚だと？
//
// 最少回数は BigInt で正確に表示する（Number で計算しない）。日本語の単位（万・億・兆・京）でも表示。
// 年数だけは有効数字3〜4けたで足りるので Number に変換する（_lib/bignum.ts）。
// 帯グラフは「宇宙の年齢を1本」として何本分かを並べる（対数ではない）。色は中立のグレーだけ。
// ======================================================

"use client"

import { useState } from "react"
import { BtnMode } from "@/components/parts/buttons/BtnMode"
import { useText } from "@/components/parts/graph/Display"
import { COMPARE, formatYears, minMovesBig, timesOfUniverse, toJapaneseUnits, withCommas, yearsFor } from "../_lib/bignum"
import { ESTIMATE } from "../_lib/estimate"
import * as T from "../_lib/textBig"
import type { Level } from "../_lib/text"

const MAX_TILES = 60

/** 宇宙の年齢を1本としたときの、r 本ぶんの帯（本数が多いときは上限で省略） */
function Tiles({ ratio, dark }: { ratio: number; dark?: boolean }) {
  const full = Math.min(MAX_TILES, Math.floor(ratio))
  const frac = ratio >= MAX_TILES ? 0 : ratio - Math.floor(ratio)
  const base = dark ? "bg-gray-700 dark:bg-gray-300" : "bg-gray-400 dark:bg-gray-500"
  return (
    <div className="flex flex-wrap gap-1" data-tiles={ratio}>
      {Array.from({ length: full }, (_, i) => (
        <span key={i} className={`inline-block h-6 w-9 rounded-sm ${base}`} />
      ))}
      {frac > 0 && (
        <span className="inline-block h-6 w-9 rounded-sm bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <span className={`block h-full ${base}`} style={{ width: `${Math.max(2, frac * 100)}%` }} />
        </span>
      )}
      {ratio >= MAX_TILES && <span className="self-center text-sm text-gray-700 dark:text-gray-200">…（ぜんぶは並べきれないよ）</span>}
    </div>
  )
}

export function StepBig({ level }: { level: Level }) {
  const [n, setN] = useState(64)
  const [sec, setSec] = useState<number>(1)
  const readout = useText("readout")

  const moves = minMovesBig(n)
  const years = yearsFor(moves, sec)
  const ratio = timesOfUniverse(years)
  const next = n < 64 ? yearsFor(minMovesBig(n + 1), sec) : null

  return (
    <div className="space-y-6">
      <p className="text-gray-700 dark:text-gray-200">{T.BIG_INTRO}</p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
          <span className="shrink-0">{T.BIG_N_LABEL}</span>
          <input id="hanoi-big-n" type="range" min={1} max={64} value={n} onChange={(e) => setN(Number(e.target.value))} className="w-48 sm:w-72 accent-gray-600" aria-label={T.BIG_N_LABEL} />
          <span className="tabular-nums w-8 text-xl" data-big-n>{n}</span>
          <span className="shrink-0">枚</span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={T.BIG_SEC_LABEL}>
        <span className="font-bold text-gray-700 dark:text-gray-200 shrink-0">{T.BIG_SEC_LABEL}</span>
        {T.BIG_SEC_OPTIONS.map((o) => (
          <BtnMode key={o.value} value={o.value} current={sec} onChange={setSec} className="shrink-0">{o.label}</BtnMode>
        ))}
      </div>

      <section className="rounded-xl border-2 border-gray-700 dark:border-gray-200 p-4 space-y-2" aria-label={T.BIG_MOVES_TITLE}>
        <h2 className="font-bold text-gray-800 dark:text-gray-100">{T.BIG_MOVES_TITLE}（{T.formulaLine(n, level)}）</h2>
        <p className="text-3xl md:text-4xl font-bold tabular-nums break-all text-gray-900 dark:text-gray-50" data-big-moves>
          {withCommas(moves)} 回
        </p>
        <p className={`font-bold tabular-nums text-gray-800 dark:text-gray-100 ${readout}`} data-big-units>
          {toJapaneseUnits(moves)} 回
        </p>
      </section>

      <section className="rounded-xl border border-gray-300 dark:border-gray-600 p-4 space-y-2" aria-label={T.BIG_TIME_TITLE}>
        <h2 className="font-bold text-gray-800 dark:text-gray-100">{T.BIG_TIME_TITLE}</h2>
        <p className="text-3xl md:text-4xl font-bold tabular-nums text-gray-900 dark:text-gray-50" data-big-years>{formatYears(years)}</p>
        <p className={`text-gray-800 dark:text-gray-100 ${readout}`} data-big-times>
          宇宙の年齢（約138億年）の {T.timesText(ratio)}
        </p>
      </section>

      <section className="space-y-3" aria-label={T.COMPARE_TITLE}>
        <h2 className="font-bold text-gray-800 dark:text-gray-100">{T.COMPARE_TITLE}</h2>
        <div className="space-y-3">
          {COMPARE.map((c) => {
            const r = timesOfUniverse(c.years)
            return (
              <div key={c.id} className="space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-200">{c.label}（約{c.years >= 1e8 ? `${c.years / 1e8}億` : c.years}年）</p>
                {r >= 0.001 ? <Tiles ratio={r} /> : <p className="text-sm text-gray-600 dark:text-gray-300">{T.COMPARE_NOTE_HUMAN}</p>}
              </div>
            )
          })}
          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{T.COMPARE_ANSWER}（{formatYears(years)}）</p>
            <Tiles ratio={ratio} dark />
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 space-y-1" aria-label={T.DOUBLE_TITLE}>
        <h2 className="font-bold text-gray-800 dark:text-gray-100">{T.DOUBLE_TITLE}</h2>
        {next !== null ? (
          <p className="tabular-nums text-gray-800 dark:text-gray-100" data-double>
            {n}枚：{formatYears(years)}　→　{n + 1}枚：{formatYears(next)}
          </p>
        ) : null}
        <p className="text-gray-700 dark:text-gray-200">{T.DOUBLE_NOTE}</p>
      </section>

      <section className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 space-y-1" aria-label={T.ESTIMATE_TITLE} data-estimate>
        <h2 className="font-bold text-gray-800 dark:text-gray-100">{T.ESTIMATE_TITLE}</h2>
        <ul className="list-disc pl-5 text-gray-800 dark:text-gray-100 space-y-1">
          {T.ESTIMATE_LINES.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="text-gray-700 dark:text-gray-200">{T.ESTIMATE_COMPARE}</p>
        <p className="sr-only">見積もりの年数 {ESTIMATE.years}</p>
      </section>
    </div>
  )
}
