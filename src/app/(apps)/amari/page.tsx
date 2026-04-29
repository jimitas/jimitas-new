"use client"
import { useState, useRef } from "react"
import { BtnQuestion } from "@/components/parts/buttons/BtnQuestion"
import { BtnCheck } from "@/components/parts/buttons/BtnCheck"
import { BtnShowAnswer } from "@/components/parts/buttons/BtnShowAnswer"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { useCoins } from "@/hooks/useCoins"
import * as se from "@/lib/se"

type Step = "idle" | "active" | "done"
type Field = "shou" | "amari"

export default function AmariPage() {
  const { coins, addCoins } = useCoins()
  const [hijosu, setHijosu] = useState(0)
  const [josu, setJosu] = useState(0)
  const [answerShou, setAnswerShou] = useState(0)
  const [answerAmari, setAnswerAmari] = useState(0)
  const [myShou, setMyShou] = useState("")
  const [myAmari, setMyAmari] = useState("")
  const [activeField, setActiveField] = useState<Field>("shou")
  const [message, setMessage] = useState("「もんだい」を おして ね")
  const [step, setStep] = useState<Step>("idle")
  const hasAnsweredRef = useRef(false)
  const seikaiRef = useRef<HTMLSpanElement>(null!)
  const [manualH, setManualH] = useState("")
  const [manualJ, setManualJ] = useState("")

  function startProblem(h: number, j: number) {
    const s = Math.floor(h / j)
    const a = h % j
    setHijosu(h)
    setJosu(j)
    setAnswerShou(s)
    setAnswerAmari(a)
    setMyShou("")
    setMyAmari("")
    setActiveField("shou")
    setMessage("商（左）から入力してね")
    setStep("active")
    hasAnsweredRef.current = false
    if (seikaiRef.current) seikaiRef.current.style.display = "none"
    se.playSe(se.set)
  }

  function generateQuestion() {
    const j = Math.floor(Math.random() * 8 + 2)
    const s = Math.floor(Math.random() * 8 + 1)
    const a = Math.floor(Math.random() * (j - 1) + 1)
    startProblem(j * s + a, j)
  }

  function setManual() {
    const h = Number(manualH)
    const j = Number(manualJ)
    if (!manualH || !manualJ || h < 2 || h > 99 || j < 2 || j > 9 || h % j === 0) {
      setMessage("わられる数(2〜99)・わる数(2〜9)を入力し、あまりが出る数にしてください")
      se.playSe(se.alertSound)
      return
    }
    startProblem(h, j)
  }

  function handleNumPad(digit: string) {
    if (step !== "active") return
    se.playSe(se.pi)
    if (activeField === "shou") {
      const next = (myShou + digit).replace(/^0+(\d)/, "$1").slice(0, 2)
      setMyShou(next)
    } else {
      const next = (myAmari + digit).replace(/^0+(\d)/, "$1").slice(0, 2)
      setMyAmari(next)
    }
  }

  function handleBackspace() {
    if (step !== "active") return
    se.playSe(se.pi)
    if (activeField === "shou") {
      setMyShou(v => v.slice(0, -1))
    } else {
      setMyAmari(v => v.slice(0, -1))
    }
  }

  function checkAnswer() {
    if (step !== "active") return
    const ms = Number(myShou)
    const ma = Number(myAmari)
    if (!myShou || !myAmari) {
      setMessage("商とあまりを 両方 入れてください")
      return
    }
    if (ms === answerShou && ma === answerAmari) {
      setStep("done")
      setMessage("せいかい！")
      if (!hasAnsweredRef.current) {
        hasAnsweredRef.current = true
        addCoins(1)
        if (seikaiRef.current) seikaiRef.current.style.display = ""
      }
      se.playSe(se.seikai1)
    } else {
      let hint = "ちがうよ！ もう一度かんがえてみよう"
      if (ms === answerShou) hint = "商はあっています。あまりをたしかめよう！"
      else if (ma === answerAmari) hint = "あまりはあっています。商をたしかめよう！"
      setMessage(hint)
      se.playSe(se.alertSound)
    }
  }

  function showAnswer() {
    if (step !== "active") return
    setStep("done")
    setMyShou(String(answerShou))
    setMyAmari(String(answerAmari))
    setMessage(`こたえ: ${hijosu} ÷ ${josu} = ${answerShou} あまり ${answerAmari}`)
    se.playSe(se.seikai2)
  }

  const numPadActive = step === "active"

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
        ➗ あまりのあるわり算
      </h1>

      {/* ボタンエリア */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <BtnQuestion handleEvent={generateQuestion} />
        <BtnCheck handleEvent={checkAnswer} disabled={step !== "active"} />
        <BtnShowAnswer handleEvent={showAnswer} disabled={step !== "active"} />
      </div>

      {/* 問題表示 */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl p-6 mb-4 min-h-28">
        {step === "idle" ? (
          <p className="text-center text-gray-400 dark:text-gray-500 text-lg">もんだいをおしてね</p>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-4xl font-bold tabular-nums text-gray-800 dark:text-gray-100">{hijosu}</span>
            <span className="text-3xl font-bold text-gray-600 dark:text-gray-300">÷</span>
            <span className="text-4xl font-bold tabular-nums text-gray-800 dark:text-gray-100">{josu}</span>
            <span className="text-3xl font-bold text-gray-600 dark:text-gray-300">=</span>

            {/* 商 入力セル */}
            <button
              onClick={() => { if (step === "active") setActiveField("shou") }}
              disabled={step !== "active"}
              className={`w-20 h-14 rounded-xl text-3xl font-bold tabular-nums transition-all
                ${step === "active" && activeField === "shou"
                  ? "border-4 border-accent-400 bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300"
                  : "border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
            >
              {myShou || "?"}
            </button>

            <span className="text-xl font-bold text-gray-600 dark:text-gray-300">あまり</span>

            {/* あまり 入力セル */}
            <button
              onClick={() => { if (step === "active") setActiveField("amari") }}
              disabled={step !== "active"}
              className={`w-20 h-14 rounded-xl text-3xl font-bold tabular-nums transition-all
                ${step === "active" && activeField === "amari"
                  ? "border-4 border-accent-400 bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300"
                  : "border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
            >
              {myAmari || "?"}
            </button>
          </div>
        )}
      </div>

      {/* NumPad */}
      {step !== "idle" && (
        <div className="mb-4">
          {/* アクティブフィールド切り替え */}
          {step === "active" && (
            <div className="flex gap-2 justify-center mb-2">
              <button
                onClick={() => setActiveField("shou")}
                className={`px-4 py-1 rounded-full text-sm font-bold transition-colors
                  ${activeField === "shou"
                    ? "bg-accent-400 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
              >
                商を入力中
              </button>
              <button
                onClick={() => setActiveField("amari")}
                className={`px-4 py-1 rounded-full text-sm font-bold transition-colors
                  ${activeField === "amari"
                    ? "bg-accent-400 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
              >
                あまりを入力中
              </button>
            </div>
          )}

          {/* 数字ボタン */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {["1","2","3","4","5","6","7","8","9"].map(d => (
              <button
                key={d}
                onClick={() => handleNumPad(d)}
                disabled={!numPadActive}
                className="h-14 rounded-xl text-2xl font-bold bg-accent-400 hover:bg-accent-500 active:bg-accent-600 text-white disabled:opacity-30 transition-colors"
              >
                {d}
              </button>
            ))}
            <button
              onClick={handleBackspace}
              disabled={!numPadActive}
              className="h-14 rounded-xl text-xl font-bold bg-danger-400 hover:bg-danger-500 active:bg-danger-600 text-white disabled:opacity-30 transition-colors"
            >
              ←
            </button>
            <button
              onClick={() => handleNumPad("0")}
              disabled={!numPadActive}
              className="h-14 rounded-xl text-2xl font-bold bg-accent-400 hover:bg-accent-500 active:bg-accent-600 text-white disabled:opacity-30 transition-colors"
            >
              0
            </button>
            <div />
          </div>
        </div>
      )}

      {/* メッセージ */}
      <div className="bg-warm-50 dark:bg-warm-900/20 border border-warm-200 dark:border-warm-700 rounded-lg px-4 py-3 mb-4 text-center min-h-12">
        <p className="text-base font-bold text-gray-700 dark:text-gray-300">{message}</p>
        <span ref={seikaiRef} style={{ display: "none" }} className="text-2xl font-bold text-brand-500 animate-bounce">
          せいかい！🎉
        </span>
      </div>

      {/* 自分でセット */}
      <details className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
        <summary className="px-4 py-3 cursor-pointer text-sm font-bold text-gray-600 dark:text-gray-300 select-none">
          ▼ 自分でもんだいをつくる
        </summary>
        <div className="px-4 pb-4 flex flex-wrap items-center gap-3 pt-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">わられる数</span>
          <input
            type="number" min={2} max={99} value={manualH}
            onChange={e => setManualH(e.target.value)}
            className="w-20 px-2 py-1 border-2 border-brand-400 rounded text-center font-bold text-lg"
          />
          <span className="font-bold text-gray-700 dark:text-gray-300">÷</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">わる数</span>
          <input
            type="number" min={2} max={9} value={manualJ}
            onChange={e => setManualJ(e.target.value)}
            className="w-16 px-2 py-1 border-2 border-brand-400 rounded text-center font-bold text-lg"
          />
          <button
            onClick={setManual}
            className="px-3 py-1.5 bg-brand-400 hover:bg-brand-500 active:bg-brand-600 text-white font-bold rounded-lg text-sm"
          >
            セット
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500">（あまりが出る数にしてね）</span>
        </div>
      </details>

      <CoinDisplay coins={coins} />
    </main>
  )
}
