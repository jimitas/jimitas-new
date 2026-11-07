// ======================================================
// ハノイの塔 〜2ⁿ−1回のひみつ〜 ページ
//
// URL: /hanoi　対象: 高校 数学A「数学と人間の活動」（教員の PC 実演・録画 → 生徒が各自の端末で試す）
// 要件: docs/requirements-hanoi-app.md　計画・進捗: docs/plan-hanoi.md
//
// 5つのステップ（タブ）：① あそぶ ② 自動で解く ③ 回数のひみつ ④ 64枚だと？ ⑤ 歴史と解き方（初期表示は ①）
// 円盤の枚数 n・移動先・最少回数の表示は、タブを切りかえても共有する。
// 大きく表示・表示レベル（ことばで／記号で）も切りかえても残す。
// 計算と文言は _lib/（jest でテスト済み）。ここは配線だけ。コインは付けない（高校向けツール）。
// ======================================================

"use client"

import { useState } from "react"
import { BtnMode } from "@/components/parts/buttons/BtnMode"
import { BigProvider } from "@/components/parts/graph/Display"
import { StepAuto } from "./_components/StepAuto"
import { StepBig } from "./_components/StepBig"
import { StepHistory } from "./_components/StepHistory"
import { StepPlay } from "./_components/StepPlay"
import { StepSecret } from "./_components/StepSecret"
import { APP_SUBTITLE, APP_TITLE, AUTO_MAX, PLAY_MAX, TABS } from "./_lib/text"
import type { Level, Tab } from "./_lib/text"
import { upsertRecord } from "./_lib/play"
import type { Records } from "./_lib/play"
import type { Peg } from "./_lib/solve"

export default function HanoiPage() {
  const [tab, setTab] = useState<Tab>(1)
  const [big, setBig] = useState(false)
  const [level, setLevel] = useState<Level>("words")
  /** 円盤の枚数（タブ間で共有）と移動先（初期は C。要件 Q3） */
  const [n, setN] = useState(3)
  const [to, setTo] = useState<Peg>("C")
  /** ステップ① の記録表（このセッションの間だけ）と、最少回数の表示（初期はかくす。タブ間で共有） */
  const [records, setRecords] = useState<Records>({})
  const [showMin, setShowMin] = useState(false)

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
        {APP_TITLE}
        <span className="block md:inline md:ml-2 text-base font-normal text-gray-600 dark:text-gray-300">{APP_SUBTITLE}</span>
      </h1>

      <div className="flex flex-wrap items-center justify-end gap-3 my-3" role="group" aria-label="表示のしかた">
        <BtnMode value="words" current={level} onChange={setLevel} className="shrink-0">ことばで</BtnMode>
        <BtnMode value="symbols" current={level} onChange={setLevel} className="shrink-0">記号で</BtnMode>
        <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 dark:text-gray-200">
          <input type="checkbox" className="w-5 h-5 accent-brand-500" checked={big} onChange={(e) => setBig(e.target.checked)} />
          大きく表示
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3" role="group" aria-label="ステップ">
        {TABS.map((t) => (
          <BtnMode key={t.id} value={t.id} current={tab} onChange={setTab} className="shrink-0 text-base">
            {t.label}
          </BtnMode>
        ))}
      </div>

      {/* 枚数と移動先（①②で共有） */}
      {(tab === 1 || tab === 2) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4" role="group" aria-label="枚数と移動先">
          <label className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
            <span className="shrink-0">円盤の枚数</span>
            <input
              id="hanoi-n"
              type="range"
              min={1}
              max={tab === 1 ? PLAY_MAX : AUTO_MAX}
              value={Math.min(n, tab === 1 ? PLAY_MAX : AUTO_MAX)}
              onChange={(e) => setN(Number(e.target.value))}
              className="w-40 accent-gray-600"
              aria-label="円盤の枚数"
            />
            <span className="tabular-nums w-6" data-n>{Math.min(n, tab === 1 ? PLAY_MAX : AUTO_MAX)}</span>
          </label>
          <div className="flex items-center gap-2" role="group" aria-label="移動先">
            <span className="font-bold text-gray-700 dark:text-gray-200 shrink-0">移動先</span>
            <BtnMode value="B" current={to} onChange={setTo} className="shrink-0">B</BtnMode>
            <BtnMode value="C" current={to} onChange={setTo} className="shrink-0">C</BtnMode>
          </div>
        </div>
      )}

      {/* 大きく表示は context で配る（図の線・文字と、数値の文字） */}
      <BigProvider value={big}>
        {tab === 1 && (
          <StepPlay
            key={`${n}-${to}`}
            n={Math.min(n, PLAY_MAX)}
            to={to}
            level={level}
            records={records}
            onClear={(nn, c) => setRecords((rec) => upsertRecord(rec, nn, c))}
            showMin={showMin}
            onToggleMin={() => setShowMin((v) => !v)}
          />
        )}
        {tab === 2 && <StepAuto key={`${n}-${to}`} n={Math.min(n, AUTO_MAX)} to={to} level={level} />}
        {tab === 3 && <StepSecret level={level} onGoTab={setTab} />}
        {tab === 4 && <StepBig level={level} />}
        {tab === 5 && <StepHistory onGoTab={setTab} />}
      </BigProvider>
    </div>
  )
}
