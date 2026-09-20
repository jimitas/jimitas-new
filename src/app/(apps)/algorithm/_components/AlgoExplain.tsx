// ======================================================
// アルゴリズムのしくみの解説（開閉できる）
//
// 棒グラフのすぐ上に置く。
// はじめは たたんでおく（まず動きを見てほしいので、
// 解説で棒グラフを画面の下へ押しやらない）。
//
// 状態は持たない。開閉の状態は page.tsx が持つ。
// ======================================================

"use client"

import { memo } from "react"
import { Btn } from "@/components/parts/buttons/Btn"
import type { AlgoDef } from "../_lib/algorithms"

type Props = {
  algo: AlgoDef
  open: boolean
  onToggle: () => void
}

function AlgoExplainInner({ algo, open, onToggle }: Props) {
  return (
    <section className="mb-3">
      <div className="flex justify-center">
        <Btn color="neutral" onClick={onToggle} className="px-3 py-1.5">
          <span aria-hidden="true" className="mr-1">
            {open ? "▼" : "▶"}
          </span>
          {algo.label}ってどんな方法？
        </Btn>
      </div>

      {/* 閉じているときも中身は残す（開閉でスクロール位置が飛ばないように） */}
      <div
        hidden={!open}
        className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-700 dark:text-gray-200"
      >
        <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-1">どうやって並べる？</h2>
        <ol className="list-decimal list-outside pl-5 space-y-1 mb-3">
          {algo.explanation.how.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>

        <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-1">ここがポイント</h2>
        <ul className="list-disc list-outside pl-5 space-y-1">
          {algo.explanation.points.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export const AlgoExplain = memo(AlgoExplainInner)
