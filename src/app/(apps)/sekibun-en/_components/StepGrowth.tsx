// ======================================================
// ステップ① 面積の増え方（要件 §4.1）
//
// 半径 2 の円の半径を h だけのばすと、増える面積は細い輪1本。
// 「1段ずつ」で h を 1 → 0.5 → 0.1 → 0.01 → 0.001 と小さくすると、
// 増えた面積 ÷ h は 15.71 → 14.14 → 12.88 → 12.60 → 12.57（円周 2π × 2）に近づく（スライド18–19）。
//
// ■ 動き
//   1段ずつ  微分の意味がわかると同じ段と動き（@/lib/graph/steps の nextStep・stepH・STEP_MS）。
//            → ・PageDown（リモコン）でも押せる。1回目は h = 1 のまま1行目を書く
//   h        スライダーでも変えられる（対数の目盛り。0 は選べない）。記録表は「1段ずつ」で通った段だけ書く
//   リセット  h = 1 にもどし、記録表を消す
//
// ■ 図
//   円（のばす前）と、のばした分の輪（オレンジ）。輪が細くなると見えなくなるので、
//   右に「輪の一部を拡大」した小窓を出す（F1-4）。小窓は h に合わせて寄る（_lib/growth.ts の loupeWindow）。
// ======================================================

"use client"

import { useEffect, useRef, useState } from "react"
import * as se from "@/lib/se"
import { Btn } from "@/components/parts/buttons/Btn"
import { blurAfterPointer, useBig, usePageKeys, useText } from "@/components/parts/graph/Display"
import { formatFixed, formatNumber } from "@/lib/graph/format"
import { H_STEPS, STEP_MS, nextStep, stepH } from "@/lib/graph/steps"
import { format2, formatSig3 } from "../_lib/format"
import {
  FIG_C, FIG_SIZE, H_MIN, R0, UNIT, addedArea, addedPerH, circumference, clipToFigure, hFromSlider, loupeWindow, sliderFromH,
} from "../_lib/growth"
import {
  GROWTH_HEADERS, H_MIN_NOTE, LOUPE_TAG, RESET_BUTTON, STEP1_GUIDE, STEP1_PREDICT, STEP_BUTTON,
  SYMBOL_DERIVATIVE, radiusTag, step1Conclusion, targetText,
} from "../_lib/text"
import type { Level } from "../_lib/text"

/** 「動きを減らす」設定か（押したときに読む） */
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** 拡大しているところの四角がこれより小さい（px）ときは、丸い目印で示す */
const MARK_MIN = 12

/** 小窓の倍率の表示（×1.4、×14、×1400） */
const magText = (m: number) => `×${m < 10 ? m.toFixed(1) : Math.round(m).toLocaleString("ja-JP")}`

/** 円と、のばした分の輪（図と小窓で同じものを描く。線の太さは画面上の px にそろえる） */
function Shapes({ r, h, line }: { r: number; h: number; line: number }) {
  return (
    <>
      {/* のばす前の円 */}
      <circle cx={FIG_C} cy={FIG_C} r={r * UNIT} className="fill-accent-100 dark:fill-accent-900" />
      {/* のばした分の輪（中心線を太さ h で描く。面積 ＝ 増えた面積） */}
      <circle
        cx={FIG_C} cy={FIG_C} r={(r + h / 2) * UNIT} fill="none" strokeWidth={h * UNIT}
        className="stroke-warm-400 dark:stroke-warm-500"
      />
      {/* もとの円のふち・のばしたあとの円のふち */}
      <circle cx={FIG_C} cy={FIG_C} r={r * UNIT} fill="none" strokeWidth={1.5 * line} vectorEffect="non-scaling-stroke" className="stroke-accent-600 dark:stroke-accent-300" />
      <circle cx={FIG_C} cy={FIG_C} r={(r + h) * UNIT} fill="none" strokeWidth={1.5 * line} vectorEffect="non-scaling-stroke" className="stroke-warm-700 dark:stroke-warm-300" />
    </>
  )
}

export function StepGrowth({ level }: { level: Level }) {
  const r = R0
  const [h, setH] = useState(1)
  /** 記録表に書いた行数（0〜5） */
  const [count, setCount] = useState(0)
  const [stepping, setStepping] = useState(false)
  const [minNote, setMinNote] = useState(false)

  // アニメの状態（毎フレーム書きかえるので state にしない）
  const anim = useRef({ raf: 0 })
  /** 「1段ずつ」と「リセット」のボタンを包む（選択を移すため） */
  const buttons = useRef<HTMLDivElement>(null)
  useEffect(() => () => cancelAnimationFrame(anim.current.raf), [])

  const big = useBig()
  const line = big ? 1.6 : 1
  const readoutText = useText("readout")
  const tableText = useText("table")

  /** 1段ずつ（押した回数と段の対応は @/lib/graph/steps の nextStep。jest で固定） */
  const onStep = () => {
    const st = nextStep(count, 1, h)
    // 動いているあいだに押されたら何もしない（ボタンは disabled にしない。disabled にすると
    // キーボードで選んでいた選択が外れ、次の Enter が効かなくなるため。2026-10-26 レビュー指摘）
    if (!st || stepping) return
    setMinNote(false)
    const { target, nextCount } = st
    const done = () => {
      setH(target)
      setCount(nextCount)
      setStepping(false)
      // 5段目まで行くとボタンが押せなくなる。キーボードで操作していたら、選択をリセットへ移す
      // （マウスのときは移さない。移すと、先生がスペースを押したときにリセットが押されてしまう）
      if (nextCount === H_STEPS.length) {
        const [stepBtn, resetBtn] = Array.from(buttons.current?.querySelectorAll("button") ?? [])
        if (stepBtn?.matches(":focus-visible")) resetBtn?.focus()
      }
    }
    if (!st.animate || prefersReducedMotion()) {
      done()
      return
    }
    setStepping(true)
    const from = h
    let start = 0
    const frame = (now: number) => {
      if (!start) start = now
      const u = Math.min(1, (now - start) / STEP_MS)
      setH(stepH(from, target, u))
      if (u < 1) anim.current.raf = requestAnimationFrame(frame)
      else done()
    }
    anim.current.raf = requestAnimationFrame(frame)
  }

  const onReset = () => {
    se.playSe(se.reset)
    cancelAnimationFrame(anim.current.raf)
    setStepping(false)
    setH(1)
    setCount(0)
    setMinNote(false)
  }

  const onSlider = (p: number) => {
    cancelAnimationFrame(anim.current.raf)
    setStepping(false)
    const nh = hFromSlider(p)
    setH(nh)
    setMinNote(nh <= H_MIN * (1 + 1e-9))
  }

  usePageKeys({ step: onStep })

  const lw = loupeWindow(r, h)
  const c = format2(circumference(r))
  const reached = count >= H_STEPS.length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4">
      {/* ---- 図 ---- */}
      <section className="flex flex-col gap-2">
        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-2 items-start">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
            <svg viewBox={`0 0 ${FIG_SIZE} ${FIG_SIZE}`} role="img" className="block w-full h-auto select-none"
              aria-label={`半径 ${formatNumber(r)} の円と、半径を ${formatFixed(h, 3)} のばした分の輪`}
            >
              <Shapes r={r} h={h} line={line} />
              {/* 半径（左向きに描く。右は拡大しているところの四角と重なるため） */}
              <line x1={FIG_C} y1={FIG_C} x2={FIG_C - r * UNIT} y2={FIG_C} strokeWidth={1.5 * line} strokeDasharray="4 3" className="stroke-gray-600 dark:stroke-gray-300" />
              <text x={FIG_C - (r * UNIT) / 2} y={FIG_C - 6} textAnchor="middle" fontSize={14 * (big ? 1.3 : 1)} fontWeight="bold"
                className="fill-gray-800 dark:fill-gray-100"
              >
                {radiusTag(formatNumber(r))}
              </text>
              {/* 小窓で拡大しているところ。h が小さくて四角が見えないほど小さいときは、丸い目印にする */}
              {lw.size >= MARK_MIN ? (
                <rect {...clipToFigure(lw)} fill="none" strokeWidth={1.5} strokeDasharray="3 2"
                  vectorEffect="non-scaling-stroke" className="stroke-gray-700 dark:stroke-gray-200"
                />
              ) : (
                <circle cx={lw.x + lw.size / 2} cy={lw.y + lw.size / 2} r={MARK_MIN / 2} fill="none" strokeWidth={1.5} strokeDasharray="3 2"
                  className="stroke-gray-700 dark:stroke-gray-200"
                />
              )}
            </svg>
          </div>
          {/* 拡大の小窓（F1-4）。h が小さくなるほど寄る（追いかけズーム） */}
          <figure className="flex flex-col gap-1">
            <div className="rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 overflow-hidden">
              <svg viewBox={`${lw.x} ${lw.y} ${lw.size} ${lw.size}`} role="img" className="block w-full h-auto select-none"
                aria-label={`輪の一部を ${magText(lw.mag)} に拡大した図。輪の太さは h`}
              >
                <Shapes r={r} h={h} line={line} />
              </svg>
            </div>
            {/* 小窓の説明は下に出す（上に重ねると、スマホで折り返して小窓を隠すため） */}
            <figcaption className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 tabular-nums">
              {LOUPE_TAG} {magText(lw.mag)}
            </figcaption>
          </figure>
        </div>

        {/* いまの値（投影でも読めるよう大きく） */}
        <p className={`flex flex-wrap items-center gap-x-6 gap-y-1 ${readoutText} font-bold tabular-nums text-gray-800 dark:text-gray-100`}>
          <span>h = {formatFixed(h, 4)}</span>
          <span className="text-warm-700 dark:text-warm-300">増えた面積 ÷ h ＝ {format2(addedPerH(r, h))}</span>
        </p>
      </section>

      {/* ---- 操作パネル ---- */}
      <section className="flex flex-col gap-3">
        <p className="text-base text-gray-700 dark:text-gray-200">{STEP1_GUIDE}</p>
        <div ref={buttons} className="flex flex-wrap gap-2">
          <Btn color="accent" className="px-5 py-3 text-lg md:text-xl" disabled={reached} onClick={onStep}>
            {STEP_BUTTON}
          </Btn>
          <Btn color="danger" className="px-4 py-3 text-base" sound="none" onClick={onReset}>
            {RESET_BUTTON}
          </Btn>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-base font-bold text-warm-700 dark:text-warm-300 tabular-nums">
            <label htmlFor="sekibun-h">のばした量 h</label>
            <span aria-hidden="true"> ＝ {formatFixed(h, 4)}</span>
          </p>
          <input
            id="sekibun-h" type="range" min={0} max={1} step={0.001} value={sliderFromH(h)} disabled={stepping}
            aria-valuetext={`h = ${formatFixed(h, 4)}`}
            onPointerUp={blurAfterPointer} onChange={(e) => onSlider(Number(e.target.value))} className="w-full accent-warm-500"
          />
          {/* 読み上げの領域は常に置き、中身だけ切りかえる（出したり消したりすると、読み上げソフトによっては告知されない） */}
          <p className="text-sm text-gray-700 dark:text-gray-200 min-h-[1.25rem]" role="status">{minNote ? H_MIN_NOTE : ""}</p>
        </div>

        {/* 記録表（F1-3）。値は段の値ちょうどで計算する（アニメの途中の h ではない） */}
        <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className={`w-full ${tableText} tabular-nums text-gray-800 dark:text-gray-100`}>
            <thead>
              <tr className="text-xs text-gray-600 dark:text-gray-300">
                {GROWTH_HEADERS.map((hd) => <th key={hd} className="px-2 py-1 text-right font-bold">{hd}</th>)}
              </tr>
            </thead>
            <tbody>
              {H_STEPS.map((s, i) => {
                const filled = i < count
                const latest = filled && i === count - 1
                return (
                  <tr key={s} data-filled={filled} className={`border-t border-gray-100 dark:border-gray-800 ${latest ? "bg-warm-50 dark:bg-warm-950" : ""}`}>
                    <td className="px-2 py-1 text-right">{filled ? formatNumber(s) : ""}</td>
                    <td className="px-2 py-1 text-right">{filled ? formatSig3(addedArea(r, s)) : ""}</td>
                    <td className="px-2 py-1 text-right font-bold text-warm-700 dark:text-warm-300">{filled ? format2(addedPerH(r, s)) : ""}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="px-2 py-1 border-t-2 border-gray-200 dark:border-gray-700 text-right font-bold text-accent-700 dark:text-accent-300 tabular-nums">
            目標：{targetText(formatNumber(r), c)}
          </p>
        </div>

        {/* 結論（F1-5） */}
        <div className="rounded-xl border-2 border-accent-300 dark:border-accent-700 bg-accent-50 dark:bg-gray-800 px-4 py-3 text-lg text-gray-800 dark:text-gray-100">
          <p className={reached ? "font-bold" : ""}>{reached ? step1Conclusion(c, formatNumber(r)) : STEP1_PREDICT}</p>
          {/* 記号で（F1-5）：面積を微分すると円周 */}
          {reached && level === "symbols" && (
            <p className={`mt-2 ${big ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"} font-bold tabular-nums`} data-testid="symbol">{SYMBOL_DERIVATIVE}</p>
          )}
        </div>
      </section>
    </div>
  )
}
