// ======================================================
// ステップ③ 輪をほどいて積み上げる — このアプリの核
//
// 円を n 本の輪に分け、真下の切れ目から輪をほどいて、直角三角形に積み上げる（要件 §4.3）。
// 教員がロープ実験のあとに投影して見せることを最優先にしている（要件 §2）。
//
// ■ 動き方
//   ▶ ほどく    t を 1 へ（全部いっしょは約3秒・イーズインアウト。1本ずつは6秒・一定の速さで、輪ごとにイーズインアウト）。動いているあいだは ⏸ 止める になる（一時停止）
//   ◀ 巻き戻す  t を 0 へ（三角形から円にもどる逆再生）
//   進み具合     スライダーで t を直接決める（動いていたら止める）
//   輪の数       4〜64。動いている途中でも切りかえられる（F3-7）
//   スペースキー ▶ と同じ（微分の意味がわかると同じ。usePageKeys）
//
// ■ 動かす仕組み（ref に持つアニメの状態・一時停止・やり直し）は useProgressPlayer.ts（② と共有）。
// ======================================================

"use client"

import { useState } from "react"
import { Btn } from "@/components/parts/buttons/Btn"
import { BtnMode } from "@/components/parts/buttons/BtnMode"
import { blurAfterPointer, useBig, usePageKeys } from "@/components/parts/graph/Display"
import { isLinear, playLabel, unrollMs } from "../_lib/playback"
import { isDone } from "../_lib/scene"
import {
  INTEGRAL_MEANING, REWIND_LABEL, RING_COUNT_NOTE, STEP3_CONCLUSION, STEP3_GUIDE, STEP3_PREDICT, SYMBOL_INTEGRAL,
  ROPE_TOGGLE, UNROLL_MODE_LABEL, unrollMessage,
} from "../_lib/text"
import type { Level } from "../_lib/text"
import { DEFAULT_RINGS, RING_COUNTS, UNROLL_MODES, lastRingProgress } from "../_lib/unroll"
import type { UnrollMode } from "../_lib/unroll"
import { RingDisk } from "./RingDisk"
import { useProgressPlayer } from "./useProgressPlayer"

export function StepUnroll({ level }: { level: Level }) {
  const [n, setN] = useState<number>(DEFAULT_RINGS)
  // ▶ ほどく／⏸ 止める／◀ 巻き戻す（全部いっしょは約3秒・1本ずつは6秒。② と同じ仕組み）
  /** ほどき方（F3-8）。初期は全部いっしょ（要件 F3-2） */
  const [mode, setMode] = useState<UnrollMode>("all")
  /** ロープの質感で描く（F3-10）。初期はオフ */
  const [rope, setRope] = useState(false)
  const { t, moving, play: onPlay, rewind: onRewind, setTo: onSlider } = useProgressPlayer(unrollMs(mode), isLinear(mode))
  /** ほどき方を切りかえたら、止めて円にもどす（新しいほどき方で最初から。途中で切りかえると図が跳ぶため） */
  const changeMode = (m: UnrollMode) => {
    if (m === mode) return
    onSlider(0)
    setMode(m)
  }

  // 結論は文章なので、投影用の数値（useText("readout")）より一段小さく。大きく表示では一段上げる
  const big = useBig()
  const conclusionText = big ? "text-xl md:text-2xl" : "text-lg md:text-xl"
  // 完成は最後にほどける輪で決める（1本ずつのとき、最後の輪がまだ円なのに結論を出さない）
  const done = isDone(lastRingProgress(n, t, mode))

  usePageKeys({ play: onPlay })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4">
      {/* ---- 図 ---- */}
      <section className="flex flex-col gap-2">
        <RingDisk
          n={n} t={t} mode={mode} rope={rope}
          ariaLabel={`半径 r の円を ${n} 本の輪に分けた図。進み具合 ${Math.round(t * 100)}%。ほどき終わると底辺 2πr、高さ r の直角三角形になる`}
        />
        <p className="text-base text-gray-700 dark:text-gray-200 min-h-[3em]" aria-live="polite">
          {unrollMessage(t, moving, mode, n)}
        </p>
      </section>

      {/* ---- 操作パネル ---- */}
      <section className="flex flex-col gap-3">
        <p className="text-base text-gray-700 dark:text-gray-200">{STEP3_GUIDE}</p>
        <div className="flex flex-wrap gap-2">
          {/* 要件 F3-2：大きく目立つ位置に */}
          <Btn color="brand" className="px-5 py-3 text-lg md:text-xl" onClick={onPlay}>
            {playLabel(t, moving)}
          </Btn>
          <Btn color="accent" className="px-4 py-3 text-base" disabled={t <= 0 || moving === -1} onClick={onRewind}>
            {REWIND_LABEL}
          </Btn>
        </div>

        <div className="flex flex-col gap-1">
          {/* ラベルの名前は固定し、％は横に出す（アニメ中に読み上げのラベル名が毎フレーム変わらないように） */}
          <p className="text-base font-bold text-gray-800 dark:text-gray-100 tabular-nums">
            <label htmlFor="sekibun-t">進み具合</label>
            <span aria-hidden="true">：{Math.round(t * 100)}%</span>
          </p>
          <input
            id="sekibun-t" type="range" min={0} max={1} step={0.001} value={t} aria-valuetext={`${Math.round(t * 100)}%`}
            onPointerUp={blurAfterPointer} onChange={(e) => onSlider(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800 dark:text-gray-100 mb-1">
            <input type="checkbox" className="w-5 h-5 accent-warm-500" checked={rope} onChange={(e) => setRope(e.target.checked)} />
            {ROPE_TOGGLE}
          </label>
          <p className="text-base font-bold text-gray-800 dark:text-gray-100">ほどき方</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="ほどき方">
            {UNROLL_MODES.map((m) => (
              <BtnMode key={m} value={m} current={mode} onChange={changeMode} className="shrink-0 px-3">
                {UNROLL_MODE_LABEL[m]}
              </BtnMode>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-base font-bold text-gray-800 dark:text-gray-100">輪の数</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="輪の数">
            {RING_COUNTS.map((c) => (
              <BtnMode key={c} value={c} current={n} onChange={setN} className="shrink-0 w-14">
                {c}
              </BtnMode>
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{RING_COUNT_NOTE}</p>
        </div>

        {/* 結論（F3-6）。ほどき終わるまでは問いかけ */}
        <div className={`rounded-xl border-2 border-accent-300 dark:border-accent-700 bg-accent-50 dark:bg-gray-800 px-4 py-3 ${conclusionText} text-gray-800 dark:text-gray-100`}>
          <p className={done ? "font-bold" : ""}>{done ? STEP3_CONCLUSION : STEP3_PREDICT}</p>
          {/* 記号で（F3-9）：円周を積分すると面積。ことばの読み方を添える */}
          {done && level === "symbols" && (
            <p className="mt-2 flex flex-wrap items-baseline gap-x-3" data-testid="symbol">
              <span className={`${big ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"} font-bold tabular-nums`}>{SYMBOL_INTEGRAL}</span>
              <span className="text-base">（{INTEGRAL_MEANING}）</span>
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
