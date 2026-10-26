// ======================================================
// ステップ② 輪を切り開く（要件 §4.2）
//
// 円の中から輪を1本だけ選び、真下の切れ目から切り開いて、まっすぐな帯にする（スライド20–21）。
// 帯の長さ ＝ その輪の円周、太さ ＝ のばした量、だから 輪の面積 ≒ 円周 × 太さ。
//
// ■ 輪の選び方（F2-1）
//   はじめはいちばん外側。図の輪をタップ（クリック）するか、「◀ 内側の輪／外側の輪 ▶」で選び直す
//   （輪の幅はスマホだと数 px しかなくタップしにくいので、ボタンも付けた）。
//   選び直したら、切り開いた帯は円にもどす。
//
// ■ 動き（F2-2）は ③ と同じ useProgressPlayer（約2秒）。数値（F2-3）は _lib/cut.ts。
// ======================================================

"use client"

import { useRef, useState } from "react"
import { Btn } from "@/components/parts/buttons/Btn"
import { usePageKeys, useScale } from "@/components/parts/graph/Display"
import { formatNumber } from "@/lib/graph/format"
import { CUT_MS, CUT_RINGS, INITIAL_RING, RADIUS, clampRing, ringFacts, stripLabels } from "../_lib/cut"
import { format2 } from "../_lib/format"
import { playLabel } from "../_lib/playback"
import { isDone } from "../_lib/scene"
import {
  CUT_LABEL, PICK_INNER, PICK_OUTER, REWIND_LABEL, STEP2_DONE, STEP2_GUIDE,
  pickedRingLabel, ringAreaText, stripLengthText, stripTag, stripWidthTag, stripWidthText,
} from "../_lib/text"
import { RingDisk } from "./RingDisk"
import { useProgressPlayer } from "./useProgressPlayer"

export function StepCutRing() {
  const [ring, setRing] = useState(INITIAL_RING)
  const { t, moving, play, rewind, setTo } = useProgressPlayer(CUT_MS)
  const done = isDone(t)
  const { font } = useScale()

  const facts = ringFacts(ring)
  const mid = formatNumber(facts.mid)
  const length = format2(facts.shownLength)
  const width = formatNumber(facts.width)

  /** 輪を選び直す（切り開いた帯は円にもどす） */
  const pick = (i: number) => {
    const next = clampRing(i)
    if (next === ring) return
    setTo(0)
    setRing(next)
  }

  usePageKeys({ play })

  // 帯のそばのラベル（切り開いたあと）：長さは帯の上、太さは帯の下（F2-3）。位置は _lib/cut.ts（枠に収まることをテスト済み）
  const tags = { length: stripTag(mid), width: stripWidthTag(width) }
  const tagPos = stripLabels(ring, font, tags)

  // 端の輪まで行ってボタンが押せなくなったら、選択（フォーカス）をもう一方のボタンへ移す
  // （押したボタンが disabled になると選択が行き場を失い、キーボードで操作している人が位置を見失うため）
  const pickButtons = useRef<HTMLDivElement>(null)
  const step = (d: 1 | -1) => {
    const next = clampRing(ring + d)
    pick(next)
    if (next === 1 || next === CUT_RINGS) {
      const other = pickButtons.current?.querySelectorAll("button")[next === 1 ? 1 : 0]
      other?.focus()
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4">
      {/* ---- 図 ---- */}
      <section className="flex flex-col gap-2">
        <RingDisk
          n={CUT_RINGS} t={t} focus={ring} guide={false} onPickRing={pick}
          ariaLabel={`半径 ${formatNumber(RADIUS)} の円を ${CUT_RINGS} 本の輪に分けた図。${pickedRingLabel(ring, CUT_RINGS)}を選んでいる。切り開くと長さ ${length} の帯になる`}
        >
          {done && (
            <g
              textAnchor="middle" fontSize={tagPos.font} fontWeight="bold"
              paintOrder="stroke" strokeWidth={4} strokeLinejoin="round"
              className="fill-accent-700 stroke-white dark:fill-accent-300 dark:stroke-gray-900"
            >
              <text x={tagPos.length.x} y={tagPos.length.y}>{tags.length}</text>
              <text x={tagPos.width.x} y={tagPos.width.y}>{tags.width}</text>
            </g>
          )}
        </RingDisk>
        <p className="text-base text-gray-700 dark:text-gray-200 min-h-[3em]" aria-live="polite">
          {done ? STEP2_DONE : STEP2_GUIDE}
        </p>
      </section>

      {/* ---- 操作パネル ---- */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Btn color="brand" className="px-5 py-3 text-lg md:text-xl" onClick={play}>
            {playLabel(t, moving, CUT_LABEL)}
          </Btn>
          <Btn color="accent" className="px-4 py-3 text-base" disabled={t <= 0 || moving === -1} onClick={rewind}>
            {REWIND_LABEL}
          </Btn>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-base font-bold text-gray-800 dark:text-gray-100">{pickedRingLabel(ring, CUT_RINGS)}</p>
          <div ref={pickButtons} className="flex flex-wrap gap-2" role="group" aria-label="輪を選ぶ">
            <Btn color="neutral" className="px-3 py-2 text-base" disabled={ring <= 1} onClick={() => step(-1)}>
              {PICK_INNER}
            </Btn>
            <Btn color="neutral" className="px-3 py-2 text-base" disabled={ring >= CUT_RINGS} onClick={() => step(1)}>
              {PICK_OUTER}
            </Btn>
          </div>
        </div>

        {/* 帯の長さ・太さ・面積（F2-3）。受け入れ基準2：長さはその輪の円周と一致する */}
        <div className="rounded-xl border-2 border-accent-300 dark:border-accent-700 bg-accent-50 dark:bg-gray-800 px-4 py-3 text-lg text-gray-800 dark:text-gray-100 tabular-nums flex flex-col gap-1">
          <p data-testid="strip-length">{stripLengthText(mid, length)}</p>
          <p>{stripWidthText(width)}</p>
          <p className="font-bold">{ringAreaText(length, width, format2(facts.shownArea))}</p>
        </div>
      </section>
    </div>
  )
}
