// ======================================================
// 文字式での確認（F2-10。「記号で」表示のときだけ出す）
//
// (f(a+h) − f(a)) / h を展開・約分して h の式にし、h → 0 で f'(a) になる流れを、
// ボタンで1行ずつ見せる。式は _lib/expand.ts が係数から自動で作る（プリセット以外の関数でも出る）。
// 関数や a が変わったら、呼ぶ側が key を変えて最初の1行にもどす。
// ======================================================

"use client"

import { useState } from "react"
import { Btn } from "@/components/parts/buttons/Btn"
import { expandSteps, limitExpr } from "../_lib/expand"
import { derivative, evaluate, formatNumber } from "../_lib/polynomial"
import type { Poly } from "../_lib/polynomial"
import { Frac, Lim } from "./MathParts"

export function ExpandSteps({ p, a }: { p: Poly; a: number }) {
  const steps = expandSteps(p)
  const lines = [
    ...steps.map((s, i) => (
      <span key={i}>
        {i > 0 && <span className="mr-1">=</span>}
        {s.den ? <Frac num={s.num} den={s.den} /> : s.num}
      </span>
    )),
    <span key="lim" className="flex flex-wrap items-center gap-x-2">
      <span>h → 0 とすると、h のついた項が 0 になって</span>
      {/* lim・分数・答えは1つのかたまり（途中で折り返さない） */}
      <span className="inline-flex items-center whitespace-nowrap">
        <Lim /><Frac num="f(a + h) − f(a)" den="h" /> = <b className="ml-1">{limitExpr(p)}</b>
      </span>
    </span>,
    <span key="sub">
      a = {formatNumber(a)} を入れると　f&apos;({formatNumber(a)}) = <b>{formatNumber(evaluate(derivative(p), a))}</b>
    </span>,
  ]
  const [shown, setShown] = useState(1)

  return (
    <div>
      <ol className="flex flex-col gap-2 text-lg text-gray-800 dark:text-gray-100">
        {lines.slice(0, shown).map((line, i) => (
          <li key={i} className="flex flex-wrap items-center">{line}</li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2 mt-3">
        <Btn color="accent" className="px-4 py-2" disabled={shown >= lines.length} onClick={() => setShown((n) => n + 1)}>
          次の行 ▼
        </Btn>
        <Btn color="neutral" className="px-4 py-2" disabled={shown <= 1} onClick={() => setShown(1)}>
          はじめから
        </Btn>
      </div>
    </div>
  )
}
