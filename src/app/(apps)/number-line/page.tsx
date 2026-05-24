"use client"
import { useState, useRef } from "react"
import { BtnMode } from "@/components/parts/buttons/BtnMode"
import { BtnCheck } from "@/components/parts/buttons/BtnCheck"
import { BtnShowAnswer } from "@/components/parts/buttons/BtnShowAnswer"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { useCoins } from "@/hooks/useCoins"
import * as se from "@/lib/se"

// 難易度設定
type Level = "1" | "2" | "3" | "4"
type LevelConfig = {
  label: string
  start: number
  step: number
  ticks: number
  unit: string
}

const LEVELS: Record<Level, LevelConfig> = {
  "1": { label: "10まで",   start: 0,    step: 1,      ticks: 11, unit: "" },
  "2": { label: "100まで",  start: 0,    step: 10,     ticks: 11, unit: "" },
  "3": { label: "1000まで", start: 0,    step: 100,    ticks: 11, unit: "" },
  "4": { label: "1万まで",  start: 0,    step: 1000,   ticks: 11, unit: "" },
}

function formatNum(n: number): string {
  if (n >= 10000) return `${n / 10000}万`
  if (n >= 1000 && n % 1000 === 0) return `${n / 1000}千`
  return String(n)
}

const SVG_W = 900
const SVG_H = 120
const MARGIN = 60

export default function NumberLinePage() {
  const { coins, addCoins } = useCoins()
  const [level, setLevel] = useState<Level>("2")
  const [arrowPos, setArrowPos] = useState<number | null>(null)
  const [answerValue, setAnswerValue] = useState(0)
  const [myInput, setMyInput] = useState("")
  const [message, setMessage] = useState("「もんだい」を おして ね")
  const [isActive, setIsActive] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const hasAnsweredRef = useRef(false)
  const seikaiRef = useRef<HTMLSpanElement>(null!)
  // 前回の矢印位置を記憶（連続同一問題の回避用）
  const prevPosRef = useRef<number | null>(null)

  const cfg = LEVELS[level]
  const lineWidth = SVG_W - MARGIN * 2

  function generateQuestion() {
    // arrowPos は 1〜(cfg.ticks-2) のランダム位置（前回と同じ値を除く）
    const rangeSize = cfg.ticks - 2
    let pos: number
    if (prevPosRef.current !== null && rangeSize > 1) {
      const raw = Math.floor(Math.random() * (rangeSize - 1))
      const shifted = raw >= (prevPosRef.current - 1) ? raw + 1 : raw
      pos = shifted + 1
    } else {
      pos = Math.floor(Math.random() * rangeSize) + 1
    }
    prevPosRef.current = pos
    const val = cfg.start + pos * cfg.step
    setArrowPos(pos)
    setAnswerValue(val)
    setMyInput("")
    setMessage(`矢印の指す数は なんでしょう？`)
    setIsActive(true)
    setRevealed(false)
    hasAnsweredRef.current = false
    if (seikaiRef.current) seikaiRef.current.style.display = "none"
    se.playSe(se.set)
  }

  function handleLevelChange(l: Level) {
    setLevel(l)
    setArrowPos(null)
    setIsActive(false)
    setRevealed(false)
    setMessage("「もんだい」を おして ね")
  }

  function checkAnswer() {
    if (!isActive) return
    const my = Number(myInput.replace(/万/g, "0000").replace(/千/g, "000"))
    const myRaw = Number(myInput)
    const correct = isNaN(my) ? myRaw : my
    if (correct === answerValue) {
      setMessage("せいかい！")
      setIsActive(false)
      if (!hasAnsweredRef.current) {
        hasAnsweredRef.current = true
        addCoins(1)
        if (seikaiRef.current) seikaiRef.current.style.display = ""
      }
      se.playSe(se.seikai1)
    } else {
      setMessage("ちがうよ！ もう一度かんがえてみよう")
      se.playSe(se.alertSound)
    }
  }

  function showAnswer() {
    if (!isActive) return
    setRevealed(true)
    setIsActive(false)
    setMessage(`こたえは ${formatNum(answerValue)} です`)
    se.playSe(se.seikai2)
  }

  // 目盛りの値一覧
  const tickValues = Array.from({ length: cfg.ticks }, (_, i) => cfg.start + i * cfg.step)
  const tickX = (i: number) => MARGIN + (i / (cfg.ticks - 1)) * lineWidth

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
        📏 数直線
      </h1>

      {/* 難易度選択 */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {(Object.entries(LEVELS) as [Level, LevelConfig][]).map(([k, v]) => (
          <BtnMode key={k} value={k} current={level} onChange={handleLevelChange}>
            {v.label}
          </BtnMode>
        ))}
      </div>

      {/* もんだい / こたえあわせ ボタン */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <button
          onClick={generateQuestion}
          className="px-5 py-2.5 bg-brand-400 hover:bg-brand-500 active:bg-brand-600 text-white font-bold rounded-xl shadow-sm transition-colors"
        >
          ？ もんだい
        </button>
        <BtnCheck handleEvent={checkAnswer} disabled={!isActive} />
        <BtnShowAnswer handleEvent={showAnswer} disabled={!isActive} />
      </div>

      {/* 数直線 SVG */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4 overflow-x-auto">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ minWidth: 500 }}>
          {/* 線 */}
          <line x1={MARGIN} y1={60} x2={SVG_W - MARGIN} y2={60} stroke="#6b7280" strokeWidth={2} />
          {/* 端の矢印 */}
          <polygon points={`${SVG_W - MARGIN + 12},60 ${SVG_W - MARGIN},55 ${SVG_W - MARGIN},65`} fill="#6b7280" />

          {/* 目盛り */}
          {tickValues.map((val, i) => (
            <g key={i}>
              <line x1={tickX(i)} y1={50} x2={tickX(i)} y2={70} stroke="#6b7280" strokeWidth={i === 0 || i === cfg.ticks - 1 ? 2 : 1.5} />
              <text
                x={tickX(i)} y={85}
                textAnchor="middle"
                fontSize={14}
                fill="#6b7280"
                className="select-none"
              >
                {formatNum(val)}
              </text>
            </g>
          ))}

          {/* 矢印 */}
          {arrowPos !== null && (
            <g>
              <polygon
                points={`${tickX(arrowPos)},38 ${tickX(arrowPos) - 8},20 ${tickX(arrowPos) + 8},20`}
                fill={revealed ? "#059669" : "#f97316"}
              />
              {revealed && (
                <text
                  x={tickX(arrowPos)} y={14}
                  textAnchor="middle"
                  fontSize={15}
                  fontWeight="bold"
                  fill="#059669"
                  className="select-none"
                >
                  {formatNum(answerValue)}
                </text>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* 入力エリア */}
      {arrowPos !== null && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="font-bold text-gray-700 dark:text-gray-300">矢印の数:</span>
          <input
            type="text"
            value={myInput}
            onChange={e => setMyInput(e.target.value)}
            disabled={!isActive}
            className="w-28 h-12 text-center border-2 border-accent-400 rounded-lg text-xl font-bold bg-white dark:bg-gray-800 disabled:opacity-60 tabular-nums"
            placeholder="?"
          />
        </div>
      )}

      {/* メッセージ */}
      <div className="bg-warm-50 dark:bg-warm-900/20 border border-warm-200 dark:border-warm-700 rounded-lg px-4 py-3 mb-4 text-center min-h-12">
        <p className="text-base font-bold text-gray-700 dark:text-gray-300">{message}</p>
        <span ref={seikaiRef} style={{ display: "none" }} className="text-2xl font-bold text-brand-500 animate-bounce">
          せいかい！🎉
        </span>
      </div>

      <CoinDisplay coins={coins} />
    </main>
  )
}
