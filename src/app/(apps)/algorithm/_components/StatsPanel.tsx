// ======================================================
// 実測のカウンタと、理論計算量の表
//
// 「いま何が起きているか」の説明文もここに出す。
// 説明文は _lib/describe.ts が作ったものをそのまま表示するだけ。
// ======================================================

"use client"

import { memo } from "react"
import type { AlgoDef } from "../_lib/algorithms"

type Props = {
  algo: AlgoDef
  message: string
  compares: number
  swaps: number
  n: number
}

function StatsPanelInner({ algo, message, compares, swaps, n }: Props) {
  return (
    <section className="mt-4">
      {/*
        いま何をしているか。
        ベタ塗りの warm だとダークで警告バナーのように見えてしまうので、
        面は中立色にして、左の帯だけ warm で「状況表示」だと分かるようにする。
      */}
      <p className="text-center text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-4 border-l-warm-400 dark:border-l-warm-400 rounded-lg px-3 py-2">
        {message}
      </p>

      {/* 実測の回数 */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
        <Counter label="くらべた回数" value={compares} tone="warm" />
        <Counter label="入れかえた回数" value={swaps} tone="danger" />
      </div>

      {/* 理論計算量 */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <caption className="text-left text-xs text-gray-500 dark:text-gray-400 mb-1">
            {algo.label}の計算量
          </caption>
          <thead>
            <tr className="bg-brand-50 dark:bg-brand-900 text-gray-700 dark:text-gray-200">
              <th className="border border-gray-200 dark:border-gray-600 px-2 py-1 font-bold">
                いちばん良いとき
              </th>
              <th className="border border-gray-200 dark:border-gray-600 px-2 py-1 font-bold">
                へいきん
              </th>
              <th className="border border-gray-200 dark:border-gray-600 px-2 py-1 font-bold">
                いちばん悪いとき
              </th>
              <th className="border border-gray-200 dark:border-gray-600 px-2 py-1 font-bold">
                つかうメモリ
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center text-gray-800 dark:text-gray-100 tabular-nums">
              <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">
                {algo.complexity.best}
              </td>
              <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">
                {algo.complexity.average}
              </td>
              <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">
                {algo.complexity.worst}
              </td>
              <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">
                {algo.complexity.space}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
        n = {n} のとき、くらべる回数の目安は{" "}
        <strong className="text-brand-600 dark:text-brand-300 tabular-nums">
          {algo.theory(n)}
        </strong>{" "}
        回です。
      </p>
      {/*
        しくみの説明はここには書かない。
        解説パネル（AlgoExplain）と同じことを2か所に持つと、片方だけ直したときに
        食いちがったまま気づけなくなるため。
      */}
    </section>
  )
}

function Counter({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "warm" | "danger"
}) {
  const toneClass =
    tone === "warm"
      ? "text-warm-600 dark:text-warm-300"
      : "text-danger-600 dark:text-danger-300"
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-center">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  )
}

export const StatsPanel = memo(StatsPanelInner)
