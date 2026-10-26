// ======================================================
// ステップ② 微分係数（接線の傾き）— このアプリの核
//
// 点B を x = a + h とし、h を 0 に近づけると、2点を結ぶ直線が接線に重なっていくのを見せる。
// 教員が PC で投影して実演することを最優先にしている（要件 §2・§4.2）。
//
// ■ 動き方（mode）
//   idle     止まっている
//   playing  「▶ 近づけてみる」で h が 1 → 0.001 へ縮んでいる（約5秒、各桁を同じ時間で）
//   paused   その一時停止。「▶ 続ける」で同じところから再開
//   stepping 「1段ずつ」で次の段へ動いている（0.5秒）
//   動いているあいだ（playing / stepping）は、スライダー・ドラッグ・パン・ズームを止める。
//
// ■ 記録表
//   右から・左からの2つを持ち、それぞれ「何段目まで通ったか」（0〜5）だけを覚える。
//   値は段の値ちょうどで計算する（フレームごとの h ではない）ので、スライドと同じ 5, 4.5, 4.1, … になる。
//
// ■ 表示範囲
//   home  いまの関数と a での全体表示（initialView）。状態として持たず、毎回計算する
//   view  いま描いている表示。手でパン・ズームすると変わるのはこちらだけ
//   追いかけズームは必ず home から寄り、リセット・向きの切りかえ・a の変更でも home にもどす。
//   （以前は手で動かした表示を home に上書きしていたため、到着後にホイールを回すと
//     2周目が拡大したまま始まり、点B が画面に出てこなかった。2026-10-25 レビュー指摘）
//
// ■ 接線
//   はじめは出さない（先に「どこへ行くか」を予想させる）。|h| ≤ 0.001 まで行ったら自動で出し、実線にする。
//   結論（F2-9）の値と、凡例の「傾き＝微分係数 ○○」も、そこまで行くまでは伏せておく（凡例は「？」。
//   接線だけ先に見せても、予想させる前に答えの数値が投影されないように。2026-10-25 オーナー決定）。
// ======================================================

"use client"

import { useEffect, useRef, useState } from "react"
import * as se from "@/lib/se"
import { Btn } from "@/components/parts/buttons/Btn"
import { BtnMode } from "@/components/parts/buttons/BtnMode"
import {
  A_MAX, A_MIN, APPROACH_MS, H_LIMIT, H_SLIDER_STEP,
  chaseView, hAt, hDragStep, initialView, stepsPassed,
} from "../_lib/approach"
import { H_STEPS, STEP_MS, nextStep, stepH } from "@/lib/graph/steps"
import type { Side } from "@/lib/graph/steps"
import { deltaY, derivative, diffQuotient, evaluate, formatPoly } from "../_lib/polynomial"
import { formatFixed, formatNumber } from "@/lib/graph/format"
import type { Poly } from "../_lib/polynomial"
import {
  PREDICT_PROMPT, SECANT_NAME, SECANT_NOTE, SIDE_LABEL, STEP2_GUIDE, TANGENT_NAME, ZERO_H_MESSAGE,
  NEGATIVE_NOTE, avgRateName, axisLabels, conclusionWords, needsNegativeNote, secantSlopeLabel, tangentSlopeLabel,
} from "../_lib/text"
import type { Level } from "../_lib/text"
import { contains, loupeView, snap } from "@/lib/graph/viewport"
import type { View } from "@/lib/graph/viewport"
import { CoordinatePlane } from "@/components/parts/graph/CoordinatePlane"
import { blurAfterPointer, usePageKeys, useText } from "@/components/parts/graph/Display"
import { useMotion } from "./Motion"
import { ExpandSteps } from "./ExpandSteps"
import { Frac, Lim } from "@/components/parts/graph/MathParts"
import { Curve, Dot, DragPoint, InfiniteLine, PlaneText } from "@/components/parts/graph/PlaneShapes"
import { RecordTable } from "./RecordTable"

type Mode = "idle" | "playing" | "paused" | "stepping"

/** 拡大ルーペの倍率 */
const LOUPE_MAG = 10

/** 右から・左からの記録の行数 */
type Counts = { right: number; left: number }
const key = (s: Side): keyof Counts => (s === 1 ? "right" : "left")

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

interface Props {
  p: Poly
  level: Level
  /** 点A の x。ページ側で持ち、① と共有する（① で決めた点A に近づけていく。2026-10-25 オーナー決定） */
  a: number
  onA: (a: number) => void
}

export function StepTangent({ p, level, a, onA }: Props) {
  const [side, setSide] = useState<Side>(1)
  const [h, setH] = useState(1)
  const [counts, setCounts] = useState<Counts>({ right: 0, left: 0 })
  const [mode, setMode] = useState<Mode>("idle")
  const [showTangent, setShowTangent] = useState(false)
  /** h → 0 の行き先まで行った（接線を実線にし、結論の値を見せる） */
  const [reached, setReached] = useState(false)
  const [chase, setChase] = useState(true)
  /** 拡大ルーペ（F2-11）。はじめは出さない（画面をすっきりさせて、先にアニメを見せる） */
  const [loupe, setLoupe] = useState(false)
  const [view, setView] = useState<View>(() => initialView(p, a, 1))
  const [zeroMsg, setZeroMsg] = useState(false)

  // アニメの状態（毎フレーム書きかえるので state にしない）
  const anim = useRef({ raf: 0, t: 0 })
  useEffect(() => () => cancelAnimationFrame(anim.current.raf), [])

  const f = (x: number) => evaluate(p, x)
  const fa = f(a)
  // 全体表示は向き（右から・左から）で左右を反転する（点B が端に貼りつかないように）
  const home = initialView(p, a, side)
  const busy = mode === "playing" || mode === "stepping"
  const count = counts[key(side)]
  const slopeAtA = evaluate(derivative(p), a)
  const dq = diffQuotient(p, a, h)

  /** 追いかけズームの表示（オフなら home のまま） */
  const viewFor = (hh: number, base: View) => (chase ? chaseView(base, a, fa, hh, deltaY(p, a, hh)) : base)

  const setCount = (s: Side, n: number) => setCounts((c) => ({ ...c, [key(s)]: n }))

  /** 行き先（|h| = 0.001）まで行った */
  const arrive = () => {
    setMode("idle")
    setShowTangent(true)
    setReached(true)
    se.playSe(se.piron)
  }

  // ---- ▶ 近づけてみる -----------------------------------------------------------
  const runApproach = (t0: number) => {
    setMode("playing")
    const base = home
    let start = 0
    const frame = (now: number) => {
      if (!start) start = now
      const t = Math.min(1, t0 + (now - start) / APPROACH_MS)
      anim.current.t = t
      const hh = side * hAt(t)
      setH(hh)
      setCount(side, stepsPassed(t))
      setView(viewFor(hh, base))
      if (t < 1) anim.current.raf = requestAnimationFrame(frame)
      else arrive()
    }
    anim.current.raf = requestAnimationFrame(frame)
  }

  const onPlay = () => {
    if (mode === "playing") {
      cancelAnimationFrame(anim.current.raf)
      setMode("paused")
      return
    }
    if (mode === "paused") {
      runApproach(anim.current.t)
      return
    }
    // はじめから
    setZeroMsg(false)
    setReached(false)
    setCount(side, 0)
    setH(side)
    runApproach(0)
  }

  // ---- 1段ずつ ----------------------------------------------------------------------
  const onStep = () => {
    // 押した回数と段の対応は @/lib/graph/steps の nextStep（jest で固定。受け入れ基準1・2）
    const st = nextStep(count, side, h)
    if (!st) return
    cancelAnimationFrame(anim.current.raf)
    setZeroMsg(false)
    const { target, nextCount: next } = st
    const done = () => {
      setH(target)
      setCount(side, next)
      setView(viewFor(target, home))
      if (next === H_STEPS.length) arrive()
      else setMode("idle")
    }
    if (!st.animate) {
      done()
      return
    }
    setMode("stepping")
    const from = h
    const base = home
    let start = 0
    const frame = (now: number) => {
      if (!start) start = now
      const u = Math.min(1, (now - start) / STEP_MS)
      const hh = stepH(from, target, u)
      setH(hh)
      setView(viewFor(hh, base))
      if (u < 1) anim.current.raf = requestAnimationFrame(frame)
      else done()
    }
    anim.current.raf = requestAnimationFrame(frame)
  }

  // ---- リセット・向き・手で動かす ------------------------------------------------------
  /** 止めて、h = ±1・表示を向き s の全体表示にもどす（記録は呼ぶ側で） */
  const stopAndReturn = (s: Side) => {
    cancelAnimationFrame(anim.current.raf)
    anim.current.t = 0
    setMode("idle")
    setH(s)
    setView(initialView(p, a, s))
    setZeroMsg(false)
  }

  const onReset = () => {
    se.playSe(se.reset)
    stopAndReturn(side)
    setCount(side, 0)
    setReached(false)
    setShowTangent(false)
  }

  const onSide = (s: Side) => {
    setSide(s)
    stopAndReturn(s)
    setReached(false)
  }

  /** 点A・点B が画面の中になければ、a のまわりの全体表示に作り直す */
  const refitIfNeeded = (na: number) => {
    const fna = evaluate(p, na)
    const shown = contains(view, na, fna) && contains(view, na + h, fna + deltaY(p, na, h))
    if (!shown) setView(initialView(p, na, side))
  }

  /**
   * a を変えたら、記録は両方とも消す（別の点の値になるため）。
   * refit：点A が画面の外に出たら表示を作り直す。ドラッグ中は false にして、指を離したときに確かめる。
   * ドラッグ中に作り直すと、指の下で座標がずれて点が先へ逃げていく（2026-10-25 レビュー指摘。① ③ と同じ形にした）。
   */
  const changeA = (x: number, refit: boolean) => {
    const na = snap(clamp(x, A_MIN, A_MAX), 0.1)
    if (na === a) return
    cancelAnimationFrame(anim.current.raf)
    setMode("idle")
    onA(na)
    setCounts({ right: 0, left: 0 })
    setReached(false)
    if (refit) refitIfNeeded(na)
  }

  /** h を手で変える。0 にしようとしたら変えずにメッセージ（F2-8） */
  const changeH = (x: number) => {
    if (Math.abs(x) < H_SLIDER_STEP / 2) {
      setZeroMsg(true)
      return
    }
    const nh = clamp(x, -H_LIMIT, H_LIMIT)
    cancelAnimationFrame(anim.current.raf)
    setMode("idle")
    setZeroMsg(false)
    setReached(false)
    setH(nh)
    const s: Side = nh > 0 ? 1 : -1
    if (s !== side) setSide(s)
    // 表示は変えない（拡大して点B を動かしているときに、全体表示へ飛ばないように）
  }

  const resetView = () => setView(home)

  // ---- キー（スペース：▶／❚❚、→・PageDown：1段ずつ） -------------------------------------
  usePageKeys({
    play: () => { if (mode !== "stepping") onPlay() },
    step: () => { if (!busy && count < H_STEPS.length) onStep() },
  })

  // ---- 表示 ------------------------------------------------------------------------
  const legendText = useText("legend")
  const readoutText = useText("readout")
  const motion = useMotion()
  const axes = axisLabels(motion)
  const b = a + h
  const fb = fa + deltaY(p, a, h)
  const words = level === "words"
  const playLabel = mode === "playing" ? "❚❚ 一時停止" : mode === "paused" ? "▶ 続ける" : "▶ 近づけてみる"
  const tangentSolid = reached && Math.abs(h) <= H_STEPS[H_STEPS.length - 1] + 1e-12
  const limitValue = formatNumber(slopeAtA)

  // グラフの線（全体図とルーペで同じものを描く）
  const lines = (
    <>
      <Curve fn={f} className="stroke-gray-800 dark:stroke-gray-100" />
      {/* 接線は下に太く敷き、2点を結ぶ直線を上に重ねる（重なったとき両方見えるように） */}
      {showTangent && (
        tangentSolid
          ? <InfiniteLine x0={a} y0={fa} slope={slopeAtA} width={9} className="stroke-accent-400 dark:stroke-accent-500" />
          : <InfiniteLine x0={a} y0={fa} slope={slopeAtA} width={3} dashed className="stroke-accent-600 dark:stroke-accent-400" />
      )}
      <InfiniteLine x0={a} y0={fa} slope={dq} width={3} className="stroke-warm-500" />
    </>
  )

  const legend = (
    <ul className={`${legendText} font-bold leading-snug`}>
      <li className="text-warm-700 dark:text-warm-300">
        ━ {SECANT_NAME}：{secantSlopeLabel(formatFixed(dq, 3), motion)}
      </li>
      {showTangent && (
        <li className="text-accent-700 dark:text-accent-300">
          {tangentSolid ? "━" : "┅"} {TANGENT_NAME}：{tangentSlopeLabel(reached ? limitValue : "？", motion)}
        </li>
      )}
    </ul>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4">
      {/* ---- グラフ ---- */}
      <section className="lg:col-start-1 lg:row-start-1 flex flex-col gap-2">
        <div className="relative">
          <CoordinatePlane
            view={view}
            onViewChange={busy ? undefined : setView}
            onReset={busy ? undefined : resetView}
            ariaLabel={`y = ${formatPoly(p)} のグラフ。点A と点B と、2点を結ぶ直線`}
            legend={legend}
            xLabel={axes.x}
            yLabel={axes.y}
          >
            {lines}
            {/* 点B を点A の上に重ねる（h が小さいとき、点B をつかもうとして点A をつかまないように） */}
            <DragPoint
              x={a} y={fa} label="点A" disabled={busy}
              className="fill-accent-500 stroke-white dark:stroke-gray-900"
              onDrag={(x) => changeA(x, false)}
              onDragEnd={() => refitIfNeeded(a)}
              onKeyStep={(d) => changeA(a + 0.1 * d, true)}
            />
            <DragPoint
              x={b} y={fb} label="点B" disabled={busy}
              className="fill-warm-500 stroke-white dark:stroke-gray-900"
              onDrag={(x) => changeH(snap(x - a, hDragStep(view.xMax - view.xMin)))}
            onKeyStep={(d) => {
              // ←→ で h を動かす（刻みはドラッグと同じく表示の広さに合わせる。0 になるときは changeH がメッセージ）
              const st = hDragStep(view.xMax - view.xMin)
              changeH(snap(h + st * d, st))
            }}
            />
            <PlaneText x={a} y={fa} dx={-14} dy={22} anchor="end" className="fill-accent-700 stroke-white dark:fill-accent-300 dark:stroke-gray-900">A</PlaneText>
            <PlaneText x={b} y={fb} dx={14} dy={22} className="fill-warm-700 stroke-white dark:fill-warm-300 dark:stroke-gray-900">B</PlaneText>
          </CoordinatePlane>

          {/* 拡大ルーペ（F2-11）：全体図を見せたまま、点A のまわりを LOUPE_MAG 倍に拡大した小窓を出す。
              md 以上は右下に重ねる（右上は点B と2点を結ぶ直線が伸びていく側で、隠してしまうため）。
              スマホはグラフの下に並べる（重ねると小さいグラフの半分を隠すため）。
              下のグラフをパン・ドラッグできるよう pointer-events-none */}
          {loupe && (
            <div className="relative mt-2 mx-auto w-2/3 md:absolute md:mt-0 md:mx-0 md:bottom-10 md:right-2 md:w-[42%] rounded-xl shadow-lg ring-2 ring-accent-300 dark:ring-accent-700 pointer-events-none">
              <CoordinatePlane
                view={loupeView(view, a, fa, LOUPE_MAG)}
                ariaLabel={`点A のまわりを ${LOUPE_MAG} 倍に拡大した図`}
                xLabel={axes.x}
                yLabel={axes.y}
              >
                {lines}
                <Dot x={b} y={fb} className="fill-warm-500 stroke-white dark:stroke-gray-900" />
                <Dot x={a} y={fa} className="fill-accent-500 stroke-white dark:stroke-gray-900" />
              </CoordinatePlane>
              <p className="absolute right-2 top-1 text-xs font-bold text-accent-700 dark:text-accent-300">拡大 ×{LOUPE_MAG}</p>
            </div>
          )}
        </div>

        {/* いまの値（投影でも読めるよう大きく） */}
        <p className={`flex flex-wrap items-center gap-x-6 gap-y-1 ${readoutText} font-bold tabular-nums text-gray-800 dark:text-gray-100`} aria-live="off">
          <span>h = {formatFixed(h, 4)}</span>
          <span className="text-warm-700 dark:text-warm-300 flex items-center">
            {words ? avgRateName(motion) : <Frac num="f(a + h) − f(a)" den="h" />}
            <span className="mx-2">=</span>
            {formatFixed(dq, 3)}
          </span>
        </p>
        {needsNegativeNote(motion, [a, dq, ...(reached ? [slopeAtA] : [])]) && (
          <p className="text-sm text-gray-600 dark:text-gray-300">{NEGATIVE_NOTE}</p>
        )}
        {zeroMsg && (
          <p className="rounded-lg bg-warm-50 dark:bg-warm-950 border border-warm-300 dark:border-warm-800 px-3 py-2 text-base text-gray-800 dark:text-gray-100" role="status">
            {ZERO_H_MESSAGE}
          </p>
        )}
      </section>

      {/* ---- 操作パネル ---- */}
      <section className="lg:col-start-2 lg:row-start-1 lg:row-span-2 flex flex-col gap-3">
        <p className="text-base text-gray-700 dark:text-gray-200">
          {STEP2_GUIDE}
          {/* 「記号で」のときだけ教科書の用語を添える（画面上の1か所だけ。要件 §1.1） */}
          {!words && <span className="block text-sm mt-1">{SECANT_NAME}{SECANT_NOTE}</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          <Btn color="brand" className="px-5 py-3 text-lg md:text-xl" disabled={mode === "stepping"} onClick={onPlay}>
            {playLabel}
          </Btn>
          <Btn color="accent" className="px-4 py-3 text-base" disabled={busy || count >= H_STEPS.length} onClick={onStep}>
            1段ずつ
          </Btn>
          <Btn color="danger" className="px-4 py-3 text-base" sound="none" onClick={onReset}>
            リセット
          </Btn>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="近づける向き">
          {([1, -1] as Side[]).map((s) => (
            <BtnMode key={s} value={s} current={side} onChange={onSide} disabled={busy} className="shrink-0">
              {SIDE_LABEL[s]}
            </BtnMode>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-base text-gray-800 dark:text-gray-100">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-accent-500" checked={showTangent} onChange={(e) => setShowTangent(e.target.checked)} />
            接線を表示
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-accent-500" checked={chase} disabled={busy}
              onChange={(e) => {
                setChase(e.target.checked)
                if (e.target.checked) setLoupe(false) // ルーペとはどちらか一方（下のコメント）
              }}
            />
            追いかけズーム
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-accent-500" checked={loupe} disabled={busy}
              onChange={(e) => {
                setLoupe(e.target.checked)
                // ルーペは「全体図を見せたまま拡大も見せる」ためのもの。追いかけズームで全体図まで寄ると
                // ルーペはさらにその10倍になって点B が外に出るので、どちらか一方にする（2026-10-25 オーナー決定）
                if (e.target.checked) setChase(false)
              }}
            />
            拡大ルーペ
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="bibun-a" className="text-base font-bold text-accent-700 dark:text-accent-300 tabular-nums">
            点A：a = {formatNumber(a)}
          </label>
          <input
            id="bibun-a" type="range" onPointerUp={blurAfterPointer} min={A_MIN} max={A_MAX} step={0.1} value={a} disabled={busy}
            onChange={(e) => changeA(Number(e.target.value), true)} className="w-full accent-accent-500"
          />
          <label htmlFor="bibun-h" className="text-base font-bold text-warm-700 dark:text-warm-300 tabular-nums mt-1">
            点B：h = {formatFixed(h, 4)}（x = a + h = {formatFixed(b, 4)}）
          </label>
          <input
            id="bibun-h" type="range" onPointerUp={blurAfterPointer} min={-H_LIMIT} max={H_LIMIT} step={H_SLIDER_STEP} value={h} disabled={busy}
            onChange={(e) => changeH(Number(e.target.value))} className="w-full accent-warm-500"
          />
        </div>

        <RecordTable p={p} a={a} side={1} count={counts.right} active={side === 1} />
        <RecordTable p={p} a={a} side={-1} count={counts.left} active={side === -1} />
      </section>

      {/* ---- 結論・文字式 ---- */}
      <section className="lg:col-start-1 lg:row-start-2 flex flex-col gap-3">
        <div className="rounded-xl border-2 border-accent-300 dark:border-accent-700 bg-accent-50 dark:bg-gray-800 px-4 py-3 text-lg text-gray-800 dark:text-gray-100">
          {!reached ? (
            <p>{PREDICT_PROMPT}</p>
          ) : words ? (
            <p>{conclusionWords(limitValue, formatNumber(a), motion)}</p>
          ) : (
            <p className="flex flex-wrap items-center">
              f&apos;(a) =<Lim /><Frac num="f(a + h) − f(a)" den="h" /> = <b className="ml-1">{limitValue}</b>
              <span className="ml-3 text-base">（a = {formatNumber(a)}）</span>
            </p>
          )}
        </div>
        {!words && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">文字式で確かめる</h3>
            <ExpandSteps key={`${formatPoly(p)}@${a}`} p={p} a={a} />
          </div>
        )}
      </section>
    </div>
  )
}
