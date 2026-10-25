// ======================================================
// ステップ③ 導関数（各点での接線の傾きを集めた関数）
//
// 上下2段のグラフ（F3-1）。上：y = f(x) と x = a の接線。下：横軸 x、縦軸「接線の傾き」。
// a を動かすと、下に点 (a, f'(a)) を打ち、軌跡を残す（F3-2。「残す」オン/オフ・消去）。
// 「▶ なぞる」で a を左端から右端まで動かすと、軌跡が y = f'(x) のグラフになっていく。
// なぞり終えたら f'(x) の式と緑のグラフを重ねる（F3-3）。
//
// ■ 答えを先に見せない
//   f'(x) の式・緑のグラフ・計算のしかたは、なぞり終えるまで出さない（計算のしかたはボタンで開ける）。
//   先に式が見えると「軌跡がどんなグラフになるか」を予想させられないため。
//
// ■ 表示範囲
//   上下の横の範囲はいつもそろえる（どちらをパン・ズームしても、もう一方の横も合わせる）。
//
// ■ 点A
//   初期値はページ側の a（①② と共有）。なぞると端まで動くので、③ の a は ①② に書き戻さない。
// ======================================================

"use client"

import { useEffect, useRef, useState } from "react"
import * as se from "@/lib/se"
import { Btn } from "@/components/parts/buttons/Btn"
import { A_MAX, A_MIN } from "../_lib/approach"
import {
  EXAMPLE_XS, SWEEP_MS, addTracePoint, stepThreeViews, sweepRange, sweepX, tracePoint, viewsWithPoint, withXRange,
} from "../_lib/derivativeStep"
import { derivative, evaluate, formatNumber, formatPoly } from "../_lib/polynomial"
import type { Poly } from "../_lib/polynomial"
import {
  DERIVATIVE_DEFINITION, NEGATIVE_NOTE, SLOPE_AT_A, SLOPE_AXIS, STEP3_GUIDE, SWEEP_PROMPT, TANGENT_NAME, axisLabels,
  derivativeExample, needsNegativeNote, tangentSlopeLabel,
} from "../_lib/text"
import type { Level } from "../_lib/text"
import { contains, snap } from "../_lib/viewport"
import type { View } from "../_lib/viewport"
import { CoordinatePlane } from "./CoordinatePlane"
import { blurAfterPointer, useMotion, useText } from "./Display"
import { DerivativeRules } from "./DerivativeRules"
import { Curve, Dot, DragPoint, InfiniteLine, PlaneText } from "./PlaneShapes"

interface Props {
  p: Poly
  level: Level
  /** 初期の a（ページ側の値） */
  initialA: number
}

export function StepDerivative({ p, level, initialA }: Props) {
  const [a, setA] = useState(initialA)
  // ①② で決めた a が既定の範囲の外でも、点A が見えるように
  const [views, setViews] = useState(() => viewsWithPoint(p, initialA))
  /** 軌跡（x, f'(x)） */
  const [trace, setTrace] = useState<[number, number][]>([])
  const [keep, setKeep] = useState(true)
  const [sweeping, setSweeping] = useState(false)
  /** なぞり終えた（f'(x) の式と緑のグラフを出す） */
  const [done, setDone] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)

  const raf = useRef(0)
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const words = level === "words"
  const df = derivative(p)
  const f = (x: number) => evaluate(p, x)
  const fa = f(a)
  const slope = evaluate(df, a)

  /**
   * a を動かして、軌跡に点を足す（残すがオフなら、いまの点だけ。同じ x の点は足さない）。
   * refit：点A が画面の外に出たら表示を作り直す（ドラッグ中は false、指を離したときに true で呼ぶ）。
   * なぞっているあいだは何もしない（なぞる前から点を押さえていた指が、途中で点を動かさないように）。
   */
  const moveTo = (x: number, refit: boolean) => {
    if (sweeping) return
    const na = snap(Math.min(A_MAX, Math.max(A_MIN, x)), 0.1)
    setA(na)
    setTrace((tr) => (keep ? addTracePoint(tr, tracePoint(p, na)) : []))
    if (refit && !contains(views.top, na, evaluate(p, na))) setViews(viewsWithPoint(p, na))
  }

  const sweep = () => {
    cancelAnimationFrame(raf.current)
    // 表示が点A を動かせる範囲からほとんど外れていたら、全体表示に戻してからなぞる
    let range = sweepRange(views.top)
    if (!range) {
      const v = stepThreeViews(p)
      setViews(v)
      range = sweepRange(v.top)!
    }
    const [lo, hi] = range
    setSweeping(true)
    setDone(false)
    setTrace([])
    let start = 0
    const frame = (now: number) => {
      if (!start) start = now
      const t = (now - start) / SWEEP_MS
      // なぞるときは 0.1 刻みにそろえない（なめらかな軌跡にするため）
      const x = sweepX(t, lo, hi)
      setA(x)
      setTrace((tr) => [...tr, tracePoint(p, x)])
      if (t < 1) raf.current = requestAnimationFrame(frame)
      else {
        setSweeping(false)
        setDone(true)
        se.playSe(se.piron)
      }
    }
    raf.current = requestAnimationFrame(frame)
  }

  const clear = () => {
    se.playSe(se.reset)
    setTrace([])
    setDone(false)
  }

  const legendText = useText("legend")
  const readoutText = useText("readout")

  /** 上下どちらを動かしても、横の範囲をそろえる */
  const onTop = (v: View) => setViews((vs) => ({ top: v, bottom: withXRange(vs.bottom, v) }))
  const onBottom = (v: View) => setViews((vs) => ({ top: withXRange(vs.top, v), bottom: v }))
  const resetViews = () => setViews(viewsWithPoint(p, a))

  /** 縦軸の名前（f'(x)）と、点の値の名前（f'(a)）。記号では書き分ける */
  const motion = useMotion()
  const axes = axisLabels(motion)
  // 時間・距離では「瞬間の速さ」（記号では f'(x)・f'(a) のまま）
  const slopeAxis = words ? (motion ? SLOPE_AXIS.motion : SLOPE_AXIS.words) : SLOPE_AXIS.symbols
  const slopeAtA = words ? (motion ? SLOPE_AT_A.motion : SLOPE_AT_A.words) : SLOPE_AT_A.symbols
  const examples = EXAMPLE_XS.map((x) => [String(x), formatNumber(evaluate(df, x))] as [string, string])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4">
      <section className="flex flex-col gap-2">
        <CoordinatePlane
          view={views.top}
          xLabel={axes.x}
          yLabel={axes.y}
          aspect={0.5}
          onViewChange={sweeping ? undefined : onTop}
          onReset={sweeping ? undefined : resetViews}
          ariaLabel={`y = ${formatPoly(p)} のグラフと、点A での接線`}
          legend={
            <p className={`${legendText} font-bold text-accent-700 dark:text-accent-300`}>
              ━ {TANGENT_NAME}：{tangentSlopeLabel(formatNumber(Number(slope.toFixed(3))), motion)}
            </p>
          }
        >
          <Curve fn={f} className="stroke-gray-800 dark:stroke-gray-100" />
          <InfiniteLine x0={a} y0={fa} slope={slope} width={3} className="stroke-accent-500" />
          <DragPoint
            x={a} y={fa} label="点A" disabled={sweeping}
            className="fill-accent-500 stroke-white dark:stroke-gray-900"
            onDrag={(x) => moveTo(x, false)}
            onDragEnd={() => moveTo(a, true)}
            onKeyStep={(d) => moveTo(a + 0.1 * d, true)}
          />
          <PlaneText x={a} y={fa} dx={-14} dy={-10} anchor="end" className="fill-accent-700 stroke-white dark:fill-accent-300 dark:stroke-gray-900">A</PlaneText>
        </CoordinatePlane>

        <CoordinatePlane
          view={views.bottom}
          aspect={0.5}
          xLabel={axes.x}
          yLabel={slopeAxis}
          legendBelow
          onViewChange={sweeping ? undefined : onBottom}
          ariaLabel={`横軸 x、縦軸 ${slopeAxis} のグラフ`}
          legend={
            <p className={`${legendText} font-bold`}>
              <span className="text-accent-700 dark:text-accent-300">● (a, {slopeAtA})</span>
              {done && <span className="ml-3 text-brand-700 dark:text-brand-300">━ y = f&apos;(x) = {formatPoly(df)}</span>}
            </p>
          }
        >
          {trace.map(([x, y], i) => (
            <Dot key={i} x={x} y={y} r={3} className="fill-accent-400 stroke-none" />
          ))}
          {/* 緑のグラフは軌跡の上に重ねる（下に描くと、密に並んだ軌跡の点に隠れて見えない） */}
          {done && <Curve fn={(x) => evaluate(df, x)} width={3} className="stroke-brand-600 dark:stroke-brand-400" />}
          <Dot x={a} y={slope} r={7} className="fill-accent-500 stroke-white dark:stroke-gray-900" />
        </CoordinatePlane>
        <p className={`flex flex-wrap gap-x-6 ${readoutText} font-bold tabular-nums text-gray-800 dark:text-gray-100`}>
          <span>a = {formatNumber(Number(a.toFixed(2)))}</span>
          <span className="text-accent-700 dark:text-accent-300">{slopeAtA} = {formatNumber(Number(slope.toFixed(3)))}</span>
        </p>
        {needsNegativeNote(motion, [a, slope]) && (
          <p className="text-sm text-gray-600 dark:text-gray-300">{NEGATIVE_NOTE}</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-base text-gray-700 dark:text-gray-200">{STEP3_GUIDE}</p>
        <div className="flex flex-wrap gap-2">
          <Btn color="brand" className="px-5 py-3 text-lg md:text-xl" disabled={sweeping} onClick={sweep}>▶ なぞる</Btn>
          <Btn color="danger" className="px-4 py-3 text-base" sound="none" disabled={sweeping} onClick={clear}>消去</Btn>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-base text-gray-800 dark:text-gray-100">
          <input type="checkbox" className="w-5 h-5 accent-accent-500" checked={keep} disabled={sweeping}
            onChange={(e) => {
              setKeep(e.target.checked)
              // オフにしたら、その場で軌跡を消す（いまの点だけにする）。なぞり終えた緑のグラフと式は残す
              if (!e.target.checked) setTrace([])
            }}
          />
          軌跡を残す
        </label>
        <div className="flex flex-col gap-1">
          <label htmlFor="bibun3-a" className="text-base font-bold text-accent-700 dark:text-accent-300 tabular-nums">
            点A：a = {formatNumber(Number(a.toFixed(2)))}
          </label>
          <input
            id="bibun3-a" type="range" onPointerUp={blurAfterPointer} min={A_MIN} max={A_MAX} step={0.1} value={a} disabled={sweeping}
            onChange={(e) => moveTo(Number(e.target.value), true)} className="w-full accent-accent-500"
          />
        </div>

        <div className="rounded-xl border-2 border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-gray-800 px-4 py-3 text-lg text-gray-800 dark:text-gray-100">
          {done ? (
            <>
              <p>{DERIVATIVE_DEFINITION}</p>
              <p className="mt-2 font-bold text-brand-700 dark:text-brand-300">
                {derivativeExample(formatPoly(p), formatPoly(df), examples)}
              </p>
            </>
          ) : (
            <p>{SWEEP_PROMPT}</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">計算のしかた</h3>
            <Btn color="neutral" className="px-3 py-1" onClick={() => setRulesOpen((o) => !o)}>
              {rulesOpen ? "とじる ▲" : "見る ▼"}
            </Btn>
          </div>
          {rulesOpen && <div className="mt-3"><DerivativeRules p={p} /></div>}
        </div>
      </section>
    </div>
  )
}
