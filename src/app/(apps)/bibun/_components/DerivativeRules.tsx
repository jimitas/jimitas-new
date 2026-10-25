// ======================================================
// 計算のしかた（F3-5）
//
// 公式と、選んでいる関数を項ごとに微分する途中式を出す。途中式は _lib/expand.ts の
// derivativeTermSteps が係数から作る（自分で作った関数でも出る）。
// ======================================================

import { derivativeTermSteps } from "../_lib/expand"
import { derivative, formatPoly } from "../_lib/polynomial"
import type { Poly } from "../_lib/polynomial"

const RULES: [string, string][] = [
  ["(x)' = 1、(x²)' = 2x、(x³)' = 3x²", "（まとめると (xⁿ)' = nxⁿ⁻¹）"],
  ["(c)' = 0", "（定数を微分すると 0）"],
  ["{k f(x)}' = k f'(x)", "（係数はそのまま前に出す）"],
  ["{f(x) ± g(x)}' = f'(x) ± g'(x)", "（項ごとに微分してよい）"],
]

export function DerivativeRules({ p }: { p: Poly }) {
  const steps = derivativeTermSteps(p)
  return (
    <div className="flex flex-col gap-3 text-gray-800 dark:text-gray-100">
      <ul className="flex flex-col gap-1 text-base">
        {RULES.map(([rule, note]) => (
          <li key={rule}>
            <span className="font-bold text-lg">{rule}</span>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">{note}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <p className="text-base mb-1">y = {formatPoly(p)} を項ごとに微分すると</p>
        {steps.length === 0 ? (
          <p className="text-lg">(0)&apos; = 0</p>
        ) : (
          <ul className="flex flex-col gap-1 text-lg tabular-nums">
            {steps.map((s) => (
              <li key={s.term}>({s.term})&apos; = {s.chain.join(" = ")}</li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xl font-bold text-brand-700 dark:text-brand-300">
          よって f&apos;(x) = {formatPoly(derivative(p))}
        </p>
      </div>
    </div>
  )
}
