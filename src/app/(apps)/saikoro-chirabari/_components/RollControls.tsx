// ======================================================
// ふるボタンの列（セクション1・2で共用）
//
//   10 / 50 / 100 / 1,000 / 10,000回 … はじめからその回数ふる
//   もう10回ふる                      … 今の結果に10回足す（授業の実感に合わせる）
//   はじめから                        … 全部消す
// ======================================================

"use client"

import * as se from "@/lib/se"
import { Btn } from "@/components/parts/buttons/Btn"
import { fmtInt } from "../_lib/format"

export const TRIAL_CHOICES = [10, 50, 100, 1000, 10000] as const

interface Props {
  roll: (k: number, fresh: boolean) => void
  reset: () => void
  busy: boolean
  n: number
}

export function RollControls({ roll, reset, busy, n }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 text-sm font-bold text-gray-600 dark:text-gray-300">はじめから</span>
        {TRIAL_CHOICES.map((k) => (
          <Btn key={k} color="brand" onClick={() => roll(k, true)} disabled={busy} className="px-3 py-2 md:text-base tabular-nums">
            {fmtInt(k)}回
          </Btn>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Btn color="accent" onClick={() => roll(10, false)} disabled={busy} className="px-4 py-2 md:text-base">
          もう10回ふる
        </Btn>
        <Btn
          color="neutral"
          sound="none"
          onClick={() => {
            se.playSe(se.reset)
            reset()
          }}
          disabled={n === 0 && !busy}
          className="px-4 py-2 md:text-base"
        >
          はじめから（消す）
        </Btn>
        <span className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
          {busy ? "ふっています…" : ""}
        </span>
      </div>
    </div>
  )
}
