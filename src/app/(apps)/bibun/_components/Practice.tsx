// ======================================================
// 練習問題（F3-6 導関数・F3-7 微分係数・F3-8 自動採点・F3-9 正解数）
//
// 問題と答えは同時に出さない。「答えを見る」を押すと途中式を出す（微分係数はグラフに接線も描く）。
// 導関数は係数ごとの入力欄（□x² + □x + □）で答えさせ、式の文字入力はパースしない。
// 問題づくり・採点・正解数の数え方は _lib/practice.ts（jest でテスト済み）。ここは配線だけ。
//
// コインは付けない（高校向けのツールには付けていない。2026-10-25 オーナー決定）。
// 正解数・連続正解はページの中だけで数え、保存しない（ページ側で常に置いておくので、タブを切りかえても消えない）。
//
// 入力欄は inputMode を数字にしない（iPad の数字キーボードにはマイナスがないため）。全角も受けつける。
// 最初の問題は「もんだい」を押してから作る（初期 state に乱数を書くと SSR でずれるため）。
// ======================================================

"use client"

import { useReducer, useRef, useState } from "react"
import * as se from "@/lib/se"
import { BtnCheck } from "@/components/parts/buttons/BtnCheck"
import { BtnMode } from "@/components/parts/buttons/BtnMode"
import { BtnQuestion } from "@/components/parts/buttons/BtnQuestion"
import { BtnShowAnswer } from "@/components/parts/buttons/BtnShowAnswer"
import { initialView } from "../_lib/approach"
import { derivativeTermSteps } from "../_lib/expand"
import { INITIAL_SCORE, answerDegrees, gradeCoefficient, gradeDerivative, newProblem, scoreReducer } from "../_lib/practice"
import type { Grade, MaxDegree, Problem } from "../_lib/practice"
import { derivative, evaluate, formatPoly } from "../_lib/polynomial"
import { formatNumber } from "@/lib/graph/format"
import { TANGENT_NAME, tangentSlopeLabel } from "../_lib/text"
import { CoordinatePlane } from "@/components/parts/graph/CoordinatePlane"
import { Curve, Dot, InfiniteLine } from "@/components/parts/graph/PlaneShapes"

type Kind = Problem["kind"]

/** 次数 → 入力欄のうしろの文字 */
const SUFFIX: Record<number, string> = { 2: "x²", 1: "x", 0: "" }
/** 次数 → 「○○の係数」 */
const TERM_NAME: Record<number, string> = { 2: "x² の係数", 1: "x の係数", 0: "定数" }

export function Practice() {
  const [kind, setKind] = useState<Kind>("derivative")
  const [maxDeg, setMaxDeg] = useState<MaxDegree>(2)
  const [problem, setProblem] = useState<Problem | null>(null)
  const [inputs, setInputs] = useState<string[]>([])
  const [grade, setGrade] = useState<Grade | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  /** 答えを見たあとに合っていたとき（せいかいの演出は出さず、ひとこと添える） */
  const [peekedRight, setPeekedRight] = useState(false)
  const [score, dispatch] = useReducer(scoreReducer, INITIAL_SCORE)
  const seikaiRef = useRef<HTMLSpanElement>(null)

  const hideSeikai = () => {
    if (seikaiRef.current) seikaiRef.current.style.display = "none"
  }

  const ask = (k = kind, d = maxDeg) => {
    const p = newProblem(k, d, Math.random, problem)
    setProblem(p)
    setInputs(p.kind === "derivative" ? answerDegrees(d).map(() => "") : [""])
    setGrade(null)
    setShowAnswer(false)
    setPeekedRight(false)
    hideSeikai()
    dispatch("new")
  }

  /** 種類・難しさを変えたら、問題を出し直す（前の問題のままだと、欄の数が合わない） */
  const changeKind = (k: Kind) => { setKind(k); if (problem) ask(k, maxDeg) }
  const changeDeg = (d: MaxDegree) => { setMaxDeg(d); if (problem) ask(kind, d) }

  const check = () => {
    if (!problem) return
    const g = problem.kind === "derivative"
      ? gradeDerivative(problem.poly, problem.maxDeg, inputs)
      : gradeCoefficient(problem.poly, problem.a, inputs[0])
    setGrade(g)
    setPeekedRight(false)
    if (g.status !== "graded") return
    // 正解して数えたあとに答えを見て確かめた場合は、ふつうの正解の表示（数には入っているので）
    if (g.correct && score.peeked && !score.counted) {
      // 答えを見たあとに合っていた：数には入らないので、効果音・「せいかい！」は出さない
      hideSeikai()
      setPeekedRight(true)
      dispatch("correct")
    } else if (g.correct) {
      se.playSe(se.seikai1)
      if (seikaiRef.current) seikaiRef.current.style.display = ""
      dispatch("correct")
    } else {
      se.playSe(se.alertSound)
      hideSeikai()
      dispatch("wrong")
    }
  }

  const peek = () => {
    setShowAnswer(true)
    dispatch("peek")
  }

  const wrongDegs = grade?.status === "graded" ? grade.terms.filter((t) => !t.correct).map((t) => t.deg) : []

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 text-gray-800 dark:text-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="text-lg font-bold">練習問題</h3>
        <p className="text-base font-bold tabular-nums" aria-live="polite">
          正解 {score.correct} 問<span className="ml-4">連続 {score.streak} 問</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="問題の種類">
          <BtnMode value="derivative" current={kind} onChange={changeKind} className="shrink-0">導関数を求める</BtnMode>
          <BtnMode value="coefficient" current={kind} onChange={changeKind} className="shrink-0">微分係数を求める</BtnMode>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="難しさ">
          <BtnMode value={2} current={maxDeg} onChange={changeDeg} className="shrink-0">2次まで</BtnMode>
          <BtnMode value={3} current={maxDeg} onChange={changeDeg} className="shrink-0">3次まで</BtnMode>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <BtnQuestion handleEvent={() => ask()} />
        {!problem && <p className="text-base text-gray-600 dark:text-gray-300">「もんだい」を押すと問題が出ます</p>}
      </div>

      {problem && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-xl">
            {problem.kind === "derivative"
              ? <>f(x) = <b>{formatPoly(problem.poly)}</b> の導関数 f&apos;(x) を求めよ。</>
              : <>f(x) = <b>{formatPoly(problem.poly)}</b> について、x = <b>{formatNumber(problem.a)}</b> における微分係数を求めよ。</>}
          </p>

          {/* 答えの入力欄 */}
          <div className="flex flex-wrap items-center gap-1 text-xl">
            {problem.kind === "derivative" ? (
              <>
                <span className="mr-1">f&apos;(x) =</span>
                {answerDegrees(problem.maxDeg).map((deg, i) => (
                  <span key={deg} className="flex items-center gap-1">
                    {i > 0 && <span className="mx-1">+</span>}
                    <AnswerBox
                      label={TERM_NAME[deg]} value={inputs[i] ?? ""} wrong={wrongDegs.includes(deg)}
                      onChange={(v) => setInputs((xs) => xs.map((x, j) => (j === i ? v : x)))}
                    />
                    <span>{SUFFIX[deg]}</span>
                  </span>
                ))}
              </>
            ) : (
              <>
                <span className="mr-1">f&apos;({formatNumber(problem.a)}) =</span>
                <AnswerBox
                  label="微分係数" value={inputs[0] ?? ""} wrong={wrongDegs.length > 0}
                  onChange={(v) => setInputs([v])}
                />
              </>
            )}
          </div>
          {problem.kind === "derivative" && (
            <p className="text-sm text-gray-600 dark:text-gray-300">0 の項は空欄のままでかまいません。マイナスは「−3」のように入れます。</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <BtnCheck handleEvent={check} />
            <BtnShowAnswer handleEvent={peek} disabled={showAnswer} />
            <span ref={seikaiRef} style={{ display: "none" }} className="text-2xl font-bold text-brand-600 dark:text-brand-300 animate-bounce">
              せいかい！🎉
            </span>
          </div>

          {/* 採点の結果（まちがえた項を指摘する） */}
          {grade?.status === "invalid" && <p className="text-base text-danger-700 dark:text-danger-300" role="status">{grade.message}</p>}
          {grade?.status === "graded" && !grade.correct && (
            <p className="text-base text-danger-700 dark:text-danger-300" role="status">
              {problem.kind === "derivative"
                ? `${wrongDegs.map((d) => TERM_NAME[d]).join("・")}がちがいます。もう一度考えてみよう。`
                : "ちがいます。導関数を求めてから x の値を入れてみよう。"}
            </p>
          )}

          {peekedRight && (
            <p className="text-base text-gray-700 dark:text-gray-200" role="status">
              合っています（答えを見たので、正解の数には入りません）
            </p>
          )}

          {showAnswer && <AnswerView problem={problem} />}
        </div>
      )}
    </section>
  )
}

/** 答えの入力欄 */
function AnswerBox({ label, value, wrong, onChange }: { label: string; value: string; wrong: boolean; onChange: (v: string) => void }) {
  return (
    <input
      type="text" autoComplete="off" aria-label={label} aria-invalid={wrong}
      value={value} onChange={(e) => onChange(e.target.value)}
      className={`w-16 rounded-lg border-2 px-1 py-1 text-right tabular-nums bg-white dark:bg-gray-900 ${wrong ? "border-danger-500" : "border-gray-300 dark:border-gray-600"}`}
    />
  )
}

/** 答え（途中式つき）。微分係数はグラフに接線も描く（F3-7） */
function AnswerView({ problem }: { problem: Problem }) {
  const { poly } = problem
  const df = derivative(poly)
  const steps = derivativeTermSteps(poly)
  return (
    <div className="rounded-lg border-2 border-warm-300 dark:border-warm-800 bg-warm-50 dark:bg-gray-900 px-4 py-3 flex flex-col gap-2">
      <p className="font-bold">答え</p>
      {problem.kind === "coefficient" && <p className="text-base">① 導関数を求める</p>}
      <ul className="flex flex-col gap-1 text-lg tabular-nums">
        {steps.map((s) => <li key={s.term}>({s.term})&apos; = {s.chain.join(" = ")}</li>)}
      </ul>
      <p className="text-xl font-bold text-brand-700 dark:text-brand-300">f&apos;(x) = {formatPoly(df)}</p>
      {problem.kind === "coefficient" && <CoefficientAnswer problem={problem} />}
    </div>
  )
}

function CoefficientAnswer({ problem }: { problem: Extract<Problem, { kind: "coefficient" }> }) {
  const { poly, a } = problem
  const df = derivative(poly)
  const value = evaluate(df, a)
  const fa = evaluate(poly, a)
  return (
    <>
      <p className="text-base mt-1">② x = {formatNumber(a)} を代入する</p>
      <p className="text-xl font-bold tabular-nums text-accent-700 dark:text-accent-300">
        f&apos;({formatNumber(a)}) = {formatPoly(df, `(${formatNumber(a)})`)} = {formatNumber(value)}
      </p>
      <p className="text-base">グラフでは、x = {formatNumber(a)} における接線の傾きが {formatNumber(value)} です。</p>
      <div className="max-w-md">
        <CoordinatePlane
          view={initialView(poly, a)} aspect={0.6}
          ariaLabel={`y = ${formatPoly(poly)} のグラフと、x = ${formatNumber(a)} での接線`}
          legend={<p className="text-sm font-bold text-accent-700 dark:text-accent-300">━ {TANGENT_NAME}：{tangentSlopeLabel(formatNumber(value))}</p>}
          legendBelow
        >
          <Curve fn={(x) => evaluate(poly, x)} className="stroke-gray-800 dark:stroke-gray-100" />
          <InfiniteLine x0={a} y0={fa} slope={value} width={3} className="stroke-accent-500" />
          <Dot x={a} y={fa} className="fill-accent-500 stroke-white dark:stroke-gray-900" />
        </CoordinatePlane>
      </div>
    </>
  )
}
