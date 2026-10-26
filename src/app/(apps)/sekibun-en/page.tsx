// ======================================================
// 円の面積と円周のひみつ 〜輪をほどくと三角形になる〜 ページ
//
// URL: /sekibun-en（要件では /apps/sekibun-en だが、既存アプリの URL 規則に合わせた。微分の意味がわかると同じ）
// 対象: 高校 数学Ⅱ「積分」。ロープ実験のあと、教員の PC 実演 → 生徒が各自の端末で試す
// 要件: docs/requirements-integral-circle-app.md　計画: docs/plan-integral-circle-app.md
//
// 4つのステップ（タブ）：① 面積の増え方 ② 輪を切り開く ③ 輪をほどいて積み上げる ④ 速さと距離とくらべる
//   初期表示は ①（要件 §3）。③ へは1クリックで行ける。まだ作っていない ④ は「準備中」で押せない。
//   大きく表示はタブを切りかえても残す。
//
// 計算と文言は _lib/（jest でテスト済み）。ここは配線だけ。コインは付けない（高校向けツール。微分の意味がわかると同じ）。
// ======================================================

"use client"

import { useState } from "react"
import { BtnMode } from "@/components/parts/buttons/BtnMode"
import { BigProvider } from "@/components/parts/graph/Display"
import { StepCutRing } from "./_components/StepCutRing"
import { StepGrowth } from "./_components/StepGrowth"
import { StepUnroll } from "./_components/StepUnroll"

type Tab = 1 | 2 | 3 | 4

const TABS: { id: Tab; label: string; ready: boolean }[] = [
  { id: 1, label: "① 面積の増え方", ready: true },
  { id: 2, label: "② 輪を切り開く", ready: true },
  { id: 3, label: "③ 輪をほどいて積み上げる", ready: true },
  { id: 4, label: "④ 速さと距離とくらべる", ready: false },
]

export default function SekibunEnPage() {
  const [tab, setTab] = useState<Tab>(1)
  /** 大きく表示（投影用。線を太く、文字を大きく） */
  const [big, setBig] = useState(false)

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
        円の面積と円周のひみつ
        <span className="block md:inline md:ml-2 text-base font-normal text-gray-600 dark:text-gray-300">〜輪をほどくと三角形になる〜</span>
      </h1>

      <div className="flex flex-wrap items-center justify-end gap-3 my-3">
        <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 dark:text-gray-200">
          <input type="checkbox" className="w-5 h-5 accent-brand-500" checked={big} onChange={(e) => setBig(e.target.checked)} />
          大きく表示
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3" role="group" aria-label="ステップ">
        {TABS.map((t) => (
          <BtnMode key={t.id} value={t.id} current={tab} onChange={setTab} disabled={!t.ready} className="shrink-0 text-base">
            {t.ready ? t.label : `${t.label}（準備中）`}
          </BtnMode>
        ))}
      </div>

      {/* 大きく表示は context で配る（図の線・文字と、結論の文字） */}
      <BigProvider value={big}>
        {tab === 1 && <StepGrowth />}
        {tab === 2 && <StepCutRing />}
        {tab === 3 && <StepUnroll />}
      </BigProvider>
    </div>
  )
}
