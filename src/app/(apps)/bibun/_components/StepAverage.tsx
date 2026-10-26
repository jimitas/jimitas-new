// ======================================================
// ステップ① 平均変化率（2点を結ぶ直線の傾き）
//
// 点A(a, f(a)) と 点B(b, f(b)) をどちらも動かせる（ドラッグ・スライダー・数値入力）。
// Δx（横の変化）・Δy（縦の変化）を直角三角形の補助線で示し、平均変化率 = Δy ÷ Δx の途中式を出す。
// 初期値 a = 1, b = 2 は授業スライドと同じ（1秒→2秒で平均の速さ 3。2026-10-26 に a = 2, b = 3 から変更）。
// a・b はページ側で持つ。点A の位置は ② に引き継ぐ（① で決めた点A に B を近づけていく流れにするため。
// 2026-10-25 オーナー決定）。
//
// ■ 表示範囲
//   点が画面の外に出たときだけ、2点が入るよう作り直す（twoPointView）。
//   毎回作り直すと縮尺が変わり続け、2点の位置で傾きが変わる様子を見比べにくい。
//   ドラッグ中は作り直さず、指を離したときに確かめる（指の下で座標がずれて、点が逃げていくため）。
//
// 計算と文言は _lib/average.ts・_lib/text.ts（jest でテスト済み）。
// ======================================================

"use client"

import { useState } from "react"
import { Btn } from "@/components/parts/buttons/Btn"
import { A_MAX, A_MIN } from "../_lib/approach"
import { average, averageExpr, eqRate, formatRate, movePoint, stepPoint, twoPointView } from "../_lib/average"
import type { Which } from "../_lib/average"
import { evaluate, formatPoly } from "../_lib/polynomial"
import { formatNumber } from "@/lib/graph/format"
import type { Poly } from "../_lib/polynomial"
import {
  DELTA_X, DELTA_Y, NEGATIVE_NOTE, SAME_POINT_MESSAGE, needsNegativeNote, SECANT_NAME, STEP1_GUIDE, STEP1_NOTICE, TO_STEP2, avgRateName, axisLabels,
  secantSlopeLabel,
} from "../_lib/text"
import type { Level } from "../_lib/text"
import { contains } from "@/lib/graph/viewport"
import type { View } from "@/lib/graph/viewport"
import { CoordinatePlane, usePlane } from "@/components/parts/graph/CoordinatePlane"
import { blurAfterPointer, useScale, useText } from "@/components/parts/graph/Display"
import { useMotion } from "./Motion"
import { Frac } from "@/components/parts/graph/MathParts"
import { Curve, DragPoint, InfiniteLine, PlaneText, Segment } from "@/components/parts/graph/PlaneShapes"

interface Props {
  p: Poly
  level: Level
  /** 点A・点B の x（ページ側で持つ。a ≠ b） */
  a: number
  b: number
  onPoints: (a: number, b: number) => void
  /** 「② へ」ボタン */
  onNext: () => void
}

export function StepAverage({ p, level, a, b, onPoints, onNext }: Props) {
  const [view, setView] = useState<View>(() => twoPointView(p, a, b))
  const [samePoint, setSamePoint] = useState(false)

  const words = level === "words"
  const { fa, fb, dx, dy, rate } = average(p, a, b)

  /** 2点とも画面の中にあるか（なければ作り直す） */
  const bothShown = (na: number, nb: number) =>
    contains(view, na, evaluate(p, na)) && contains(view, nb, evaluate(p, nb))
  const refitIfNeeded = (na: number, nb: number) => {
    if (!bothShown(na, nb)) setView(twoPointView(p, na, nb))
  }

  /** 動かした結果を反映する。null（2点が重なる）なら動かさずにメッセージ */
  const apply = (r: { a: number; b: number } | null, refit: boolean) => {
    if (!r) {
      setSamePoint(true)
      return
    }
    setSamePoint(false)
    onPoints(r.a, r.b)
    if (refit) refitIfNeeded(r.a, r.b)
  }
  /** refit：スライダー・数値入力・キー（ドラッグ中は false。指を離したときに確かめる） */
  const move = (which: Which, x: number, refit: boolean) => apply(movePoint(a, b, which, x), refit)
  const step = (which: Which, dir: 1 | -1) => apply(stepPoint(a, b, which, dir), true)

  const legendText = useText("legend")
  const motion = useMotion()
  const axes = axisLabels(motion)
  // 横の変化・縦の変化（時間・距離では「かかった時間」「進んだ距離」）
  const dxWord = motion ? DELTA_X.motion : DELTA_X.words
  const dyWord = motion ? DELTA_Y.motion : DELTA_Y.words
  const dxName = words ? dxWord : DELTA_X.symbols
  const dyName = words ? dyWord : DELTA_Y.symbols

  const legend = (
    <p className={`${legendText} font-bold text-warm-700 dark:text-warm-300`}>
      ━ {SECANT_NAME}：{secantSlopeLabel(formatRate(rate), motion)}
    </p>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4">
      <section className="flex flex-col gap-2">
        <CoordinatePlane
          view={view}
          onViewChange={setView}
          onReset={() => setView(twoPointView(p, a, b))}
          ariaLabel={`y = ${formatPoly(p)} のグラフ。点A と点B と、2点を結ぶ直線`}
          legend={legend}
          xLabel={axes.x}
          yLabel={axes.y}
        >
          <Curve fn={(x) => evaluate(p, x)} className="stroke-gray-800 dark:stroke-gray-100" />
          <InfiniteLine x0={a} y0={fa} slope={rate} width={3} className="stroke-warm-500" />
          {/* Δx・Δy の直角三角形（オレンジの破線） */}
          <Segment x1={a} y1={fa} x2={b} y2={fa} dashed className="stroke-warm-600 dark:stroke-warm-400" />
          <Segment x1={b} y1={fa} x2={b} y2={fb} dashed className="stroke-warm-600 dark:stroke-warm-400" />
          <DeltaLabels a={a} b={b} fa={fa} fb={fb} dxText={`${dxName} = ${formatNumber(dx)}`} dyText={`${dyName} = ${formatNumber(dy)}`} />
          <DragPoint
            x={a} y={fa} label="点A"
            className="fill-accent-500 stroke-white dark:stroke-gray-900"
            onDrag={(x) => move("a", x, false)}
            onDragEnd={() => refitIfNeeded(a, b)}
            onKeyStep={(d) => step("a", d)}
          />
          <DragPoint
            x={b} y={fb} label="点B"
            className="fill-warm-500 stroke-white dark:stroke-gray-900"
            onDrag={(x) => move("b", x, false)}
            onDragEnd={() => refitIfNeeded(a, b)}
            onKeyStep={(d) => step("b", d)}
          />
          {/* A は点の外側、B も点の外側（2点が近づいてもラベルどうしが重ならないように） */}
          <PlaneText x={a} y={fa} dx={a < b ? -14 : 14} dy={-10} anchor={a < b ? "end" : "start"} className="fill-accent-700 stroke-white dark:fill-accent-300 dark:stroke-gray-900">A</PlaneText>
          <PlaneText x={b} y={fb} dx={a < b ? 14 : -14} dy={-10} anchor={a < b ? "start" : "end"} className="fill-warm-700 stroke-white dark:fill-warm-300 dark:stroke-gray-900">B</PlaneText>
        </CoordinatePlane>
        {needsNegativeNote(motion, [a, b, dx, rate]) && (
          <p className="text-sm text-gray-600 dark:text-gray-300">{NEGATIVE_NOTE}</p>
        )}
        {samePoint && (
          <p className="rounded-lg bg-warm-50 dark:bg-warm-950 border border-warm-300 dark:border-warm-800 px-3 py-2 text-base text-gray-800 dark:text-gray-100" role="status">
            {SAME_POINT_MESSAGE}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <p className="text-base text-gray-700 dark:text-gray-200">
          {STEP1_GUIDE}
          <span className="block mt-1 font-bold">{STEP1_NOTICE}</span>
        </p>

        <PointInput id="bibun1-a" name="点A" varName="a" value={a} color="accent" onChange={(x) => move("a", x, true)} onStep={(d) => step("a", d)} />
        <PointInput id="bibun1-b" name="点B" varName="b" value={b} color="warm" onChange={(x) => move("b", x, true)} onStep={(d) => step("b", d)} />

        {/* 平均変化率（F1-4） */}
        <div className="rounded-xl border-2 border-warm-300 dark:border-warm-800 bg-warm-50 dark:bg-gray-800 px-4 py-3 text-gray-800 dark:text-gray-100">
          <p className="flex flex-wrap items-center gap-x-2 text-lg">
            {words ? (
              <>{avgRateName(motion)} ＝ {dyWord} ÷ {dxWord}</>
            ) : (
              <>{avgRateName(motion)} ＝ <Frac num="Δy" den="Δx" /> ＝ <Frac num="f(b) − f(a)" den="b − a" /></>
            )}
          </p>
          <p className="mt-2 text-lg tabular-nums">＝ {averageExpr(p, a, b)}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-warm-700 dark:text-warm-300">
            {avgRateName(motion)} {eqRate(rate).replace(/^=/, "＝")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-base text-gray-700 dark:text-gray-200">{TO_STEP2}</p>
          <Btn color="brand" className="px-4 py-2" onClick={onNext}>② へ進む ▶</Btn>
        </div>
      </section>
    </div>
  )
}

/**
 * 補助線の辺がこれより短い（px）ときは、その辺の値をグラフに書かない（ラベルどうし・点と重なるため。値はパネルにも出ている）。
 * 360px 幅のスマホの初期表示（Δx = 1 が約 54px）でも出るよう 44（2026-10-25 レビュー指摘で 56 から下げた）
 */
const MIN_LABEL_SIDE = 44

/** Δx・Δy の値のラベル。辺が短いときは出さない */
function DeltaLabels({ a, b, fa, fb, dxText, dyText }: {
  a: number; b: number; fa: number; fb: number; dxText: string; dyText: string
}) {
  const t = usePlane()
  const { font } = useScale()
  const wide = Math.abs(t.toPx(b) - t.toPx(a)) >= MIN_LABEL_SIDE
  const tall = Math.abs(t.toPy(fb) - t.toPy(fa)) >= MIN_LABEL_SIDE
  const cls = "fill-warm-700 stroke-white dark:fill-warm-300 dark:stroke-gray-900"
  // 縦の変化のラベルは、ふだんは点B の外側（A と反対側）に出す。外側に収まらないときは内側へ
  // （a = 1・b = 2 の初期表示では点B が右端の近くにあり、外側だと「縦の変化 = 3」が切れるため。2026-10-26）
  const labelW = [...dyText].length * 16 * font // 1文字およそ1文字分の幅（16px・大きく表示の倍率）
  const bx = t.toPx(b)
  const outward: 1 | -1 = b >= a ? 1 : -1
  const fits = outward === 1 ? bx + 8 + labelW <= t.width : bx - 8 - labelW >= 0
  const dir = fits ? outward : -outward
  return (
    <>
      {wide && (
        <PlaneText x={(a + b) / 2} y={fa} dy={fb >= fa ? 22 : -10} anchor="middle" className={cls}>{dxText}</PlaneText>
      )}
      {tall && (
        <PlaneText x={b} y={(fa + fb) / 2} dx={8 * dir} anchor={dir === 1 ? "start" : "end"} className={cls}>{dyText}</PlaneText>
      )}
    </>
  )
}

/** 点の x 座標：スライダー ＋ 数値入力（0.1 刻み。F1-5） */
function PointInput({ id, name, varName, value, color, onChange, onStep }: {
  id: string
  name: string
  varName: string
  value: number
  color: "accent" | "warm"
  onChange: (x: number) => void
  /** スライダーの ←→ キー（もう一方の点を跳びこせるよう、ふつうの1刻みではなく stepPoint を使う） */
  onStep: (dir: 1 | -1) => void
}) {
  // 入力中の文字（"2." や "" のような途中の状態も残す）。値が外から変わったら合わせる
  const [text, setText] = useState(String(value))
  const [shown, setShown] = useState(value)
  if (shown !== value) {
    setShown(value)
    setText(String(value))
  }
  const label = color === "accent" ? "text-accent-700 dark:text-accent-300" : "text-warm-700 dark:text-warm-300"
  const accent = color === "accent" ? "accent-accent-500" : "accent-warm-500"
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className={`text-base font-bold ${label}`}>{name}：{varName} =</label>
        <input
          type="number" inputMode="decimal" step={0.1} min={A_MIN} max={A_MAX}
          aria-label={`${name} の ${varName}`}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            const v = Number(e.target.value)
            if (e.target.value.trim() !== "" && Number.isFinite(v)) onChange(v)
          }}
          // 受け付けなかった値（もう一方の点と同じ・範囲外・0.1 刻みでない）が欄に残ったまま
          // グラフと食い違わないよう、欄から離れたら実際の値に戻す（2026-10-25 レビュー指摘）
          onBlur={() => setText(String(value))}
          className="w-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-lg text-right tabular-nums text-gray-800 dark:text-gray-100"
        />
      </div>
      <input
        id={id} type="range" onPointerUp={blurAfterPointer} min={A_MIN} max={A_MAX} step={0.1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onKeyDown={(e) => {
          const dir = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0
          if (!dir) return
          e.preventDefault()
          onStep(dir)
        }}
        className={`w-full ${accent}`}
      />
    </div>
  )
}
