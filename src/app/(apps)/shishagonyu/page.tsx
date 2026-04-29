// ======================================================
// 四捨五入の練習 ページ
//
// URL: /shishagonyu
// 対象: 小学4〜5年生
//
// レイアウト（移植元に準拠）:
//   1. 設定（位の選択・問題の種類）
//   2. ボタン群（問題を出す / ヒント / 答えを見る）
//   3. 問題文（PutText）
//   4. 位取りテーブル（クリックでマーク付け外し）
//   5. テンキー（NumPad）+ 答え合わせ
//   6. コイン表示
//
// テーブルの各行は全セルがクリックでトグル可能:
//   行0: ●（どの位まで丸めるかの目印）
//   行1: 斜線（5以上か4以下かを判断する桁）
//   行2: オレンジ背景（斜線と同じ桁を色で強調）
// ======================================================

"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import * as se from "@/lib/se"
import { roundToDigit } from "./_lib/rounding"
import { useCoins } from "@/hooks/useCoins"
import { useKeyboardInput } from "@/hooks/useKeyboardInput"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { PutText } from "@/components/parts/displays/PutText"
import { NumPad } from "@/components/parts/buttons/NumPad"

// ── 定数 ─────────────────────────────────────────────

const PLACE_NAMES = ["千万", "百万", "十万", "一万", "千", "百", "十", "一"] as const
const PLACE_NAMES_JP = ["一", "十", "百", "千", "一万", "十万", "百万", "千万"] as const

type QuizMode = "no-kurai" | "ue-kara" | "both"

const emptyRow = () => Array(8).fill(false) as boolean[]

// ── ページ本体 ─────────────────────────────────────────
export default function ShashagonyuPage() {

  // ── 設定 ──────────────────────────────────────────────
  const [checkedPlaces, setCheckedPlaces] = useState<boolean[]>(
    [false, false, false, true, false, false, false]
  )
  const [quizMode, setQuizMode] = useState<QuizMode>("no-kurai")

  // ── 問題データ（ref） ─────────────────────────────────
  const targetDigitRef   = useRef(2)
  const correctAnswerRef = useRef(0)
  const numDigitsRef     = useRef(5)

  // ── UI state ─────────────────────────────────────────
  const [hasProblem,   setHasProblem  ] = useState(false)
  const [inputStr,     setInputStr    ] = useState("")
  const [cellDigits,   setCellDigits  ] = useState<(number | null)[]>(Array(8).fill(null))
  const [dotCells,     setDotCells    ] = useState<boolean[]>(emptyRow())
  const [slashCells,   setSlashCells  ] = useState<boolean[]>(emptyRow())
  const [orangeCells,  setOrangeCells ] = useState<boolean[]>(emptyRow())
  const [hintActive,   setHintActive  ] = useState(false)

  // ── refs ─────────────────────────────────────────────
  const msgRef         = useRef<HTMLDivElement>(null)
  const seikaiRef      = useRef<HTMLSpanElement>(null)
  const hasAnsweredRef = useRef(false)

  // ── コイン ────────────────────────────────────────────
  const { coins, addCoins } = useCoins()

  // 初期メッセージ
  useEffect(() => {
    if (msgRef.current) msgRef.current.textContent = "問題を出すボタンを押してね"
  }, [])

  // ── 全マークをリセット ────────────────────────────────
  const clearAllMarks = useCallback(() => {
    setDotCells(emptyRow())
    setSlashCells(emptyRow())
    setOrangeCells(emptyRow())
    setHintActive(false)
  }, [])

  // ── 問題生成 ──────────────────────────────────────────
  const generateQuestion = useCallback(() => {
    const selectedCols = checkedPlaces
      .map((checked, i) => (checked ? i : -1))
      .filter(i => i >= 0)

    if (selectedCols.length === 0) {
      if (msgRef.current) msgRef.current.textContent = "位をひとつ以上えらんでください。"
      return
    }

    const colIdx    = selectedCols[Math.floor(Math.random() * selectedCols.length)]
    const numDigits = 8 - colIdx

    let num = 0
    for (let i = 0; i < numDigits; i++) {
      const d = i === numDigits - 1
        ? Math.floor(Math.random() * 9 + 1)
        : Math.floor(Math.random() * 10)
      num += d * Math.pow(10, i)
    }

    let mode: "no-kurai" | "ue-kara"
    if (quizMode === "both") {
      mode = Math.random() < 0.5 ? "no-kurai" : "ue-kara"
    } else {
      mode = quizMode as "no-kurai" | "ue-kara"
    }

    const minTD = 2
    const maxTD = Math.max(minTD, numDigits - 1)
    const targetDigit = Math.floor(Math.random() * (maxTD - minTD + 1)) + minTD
    const correctAnswer = roundToDigit(num, targetDigit)

    targetDigitRef.current   = targetDigit
    correctAnswerRef.current = correctAnswer
    numDigitsRef.current     = numDigits

    const numStr = String(num)
    const newDigits: (number | null)[] = Array(8).fill(null)
    for (let i = 0; i < numStr.length; i++) {
      newDigits[8 - numStr.length + i] = parseInt(numStr[i])
    }
    setCellDigits(newDigits)
    clearAllMarks()
    setInputStr("")
    setHasProblem(true)
    hasAnsweredRef.current = false

    if (msgRef.current) {
      const label   = PLACE_NAMES_JP[targetDigit - 1]
      const ketaNum = numDigits - targetDigit + 1
      const numFmt  = num.toLocaleString()
      if (mode === "no-kurai") {
        msgRef.current.innerHTML =
          `${numFmt} を <strong>【${label}の位】</strong> までのがい数にしましょう。`
      } else {
        msgRef.current.innerHTML =
          `${numFmt} を <strong>【上から${ketaNum}けた】</strong> のがい数にしましょう。`
      }
    }

    se.playSe(se.pi)
  }, [checkedPlaces, quizMode, clearAllMarks])

  // ── 各行のトグル ──────────────────────────────────────
  const toggleDot = useCallback((col: number) => {
    setDotCells(prev => { const n = [...prev]; n[col] = !n[col]; return n })
    se.playSe(se.move1)
  }, [])

  const toggleSlash = useCallback((col: number) => {
    setSlashCells(prev => { const n = [...prev]; n[col] = !n[col]; return n })
    se.playSe(se.pi)
  }, [])

  const toggleOrange = useCallback((col: number) => {
    setOrangeCells(prev => { const n = [...prev]; n[col] = !n[col]; return n })
    se.playSe(se.move2)
  }, [])

  // ── ヒントボタン ──────────────────────────────────────
  const handleHint = useCallback(() => {
    if (!hasProblem) return
    if (hintActive) {
      clearAllMarks()
    } else {
      const dc = 8 - targetDigitRef.current
      const sc = 9 - targetDigitRef.current
      const nd = emptyRow(); nd[dc] = true
      const ns = emptyRow(); ns[sc] = true
      const no = emptyRow(); no[sc] = true
      setDotCells(nd); setSlashCells(ns); setOrangeCells(no)
      setHintActive(true)
    }
    se.playSe(se.pi)
  }, [hasProblem, hintActive, clearAllMarks])

  // ── 答えを見る ────────────────────────────────────────
  const handleShowAnswer = useCallback(() => {
    if (!hasProblem) return
    if (msgRef.current) {
      msgRef.current.innerHTML =
        `こたえは <strong style="color:#e11d48; font-size:1.3em;">${correctAnswerRef.current.toLocaleString()}</strong> です。`
    }
    setHasProblem(false)
    se.playSe(se.set)
  }, [hasProblem])

  // ── テンキー ──────────────────────────────────────────
  const handleDigit = useCallback((n: number) => {
    if (!hasProblem) return
    setInputStr(prev => {
      if (prev.length >= 10) return prev
      const raw = prev + String(n)
      const p   = parseInt(raw, 10)
      return isNaN(p) ? raw : String(p)
    })
    se.playSe(se.pi)
  }, [hasProblem])

  const handleDelete = useCallback(() => {
    setInputStr(prev => prev.slice(0, -1))
    se.playSe(se.pi)
  }, [])

  const handleClear = useCallback(() => {
    setInputStr("")
    se.playSe(se.reset)
  }, [])

  // ── 答え合わせ ────────────────────────────────────────
  const checkAnswer = useCallback(() => {
    if (!hasProblem) {
      if (msgRef.current) msgRef.current.textContent = "「問題を出す」をおしてください。"
      return
    }
    if (inputStr === "") {
      if (msgRef.current) msgRef.current.textContent = "テンキーで答えを入力してください。"
      return
    }
    const myAnswer = parseInt(inputStr, 10)
    if (myAnswer === correctAnswerRef.current) {
      se.playSe(se.right)
      if (!hasAnsweredRef.current) { addCoins(1); hasAnsweredRef.current = true }
      if (seikaiRef.current) {
        seikaiRef.current.style.display = "inline"
        setTimeout(() => { if (seikaiRef.current) seikaiRef.current.style.display = "none" }, 2000)
      }
      setHasProblem(false)
    } else {
      se.playSe(se.alertSound)
      if (msgRef.current) {
        const saved = msgRef.current.innerHTML
        msgRef.current.innerHTML = '<span style="color:gray;">ちがうよ、もう一度！</span>'
        setTimeout(() => { if (msgRef.current) msgRef.current.innerHTML = saved }, 1000)
      }
    }
  }, [hasProblem, inputStr, addCoins])

  // ── キーボード入力（テンキーと併用可） ───────────────────
  useKeyboardInput({
    onDigit:  handleDigit,
    onDelete: handleDelete,
    onClear:  handleClear,
    onEnter:  checkAnswer,
    enabled:  hasProblem,
  })

  const displayValue = inputStr !== "" ? parseInt(inputStr, 10).toLocaleString() : null

  // ── つかいかたパネルの開閉 ────────────────────────────
  const [showGuide, setShowGuide] = useState(false)

  // ──────────────────────────────────────────────────────
  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">

      <h1 className="text-2xl font-bold text-center text-brand-700 dark:text-brand-300">
        四捨五入の練習
      </h1>

      {/* ① 設定エリア ──────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">

        {/* 位の選択 */}
        <div>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
            問題に出したい位を選んでください（複数OK）
          </p>
          <p className="text-xs text-gray-400 mb-1.5">
            選んだ位の大きさの数が出ます。例：「一万の位」→ 5桁の数
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {PLACE_NAMES.slice(0, 7).map((name, i) => (
              <label key={i} className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checkedPlaces[i]}
                  onChange={e => {
                    const next = [...checkedPlaces]; next[i] = e.target.checked
                    setCheckedPlaces(next)
                    se.playSe(se.pi)
                  }}
                  className="w-4 h-4 accent-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{name}の位</span>
              </label>
            ))}
          </div>
        </div>

        {/* 問題の種類 */}
        <div>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">問題の種類</p>
          <div className="flex flex-wrap gap-4">
            {[
              { value: "no-kurai", label: "〇〇の位まで" },
              { value: "ue-kara",  label: "上から〇けたまで" },
              { value: "both",     label: "両方まぜて" },
            ].map(item => (
              <label key={item.value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio" name="quizMode" value={item.value}
                  checked={quizMode === item.value}
                  onChange={() => { setQuizMode(item.value as QuizMode); se.playSe(se.set) }}
                  className="w-4 h-4 accent-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* ② ボタン群（テーブルの上） ─────────────────── */}
      <div className="flex justify-center gap-3 flex-wrap">
        <button
          onClick={generateQuestion}
          className="px-6 py-2.5 bg-brand-400 hover:bg-brand-500 active:bg-brand-600 text-white font-bold
                     rounded-xl shadow-md active:scale-95 transition-all"
        >
          問題を出す
        </button>
        <button
          onClick={handleHint}
          disabled={!hasProblem}
          className="px-6 py-2.5 bg-accent-400 hover:bg-accent-500 active:bg-accent-600 text-white font-bold
                     rounded-xl shadow disabled:opacity-40 disabled:cursor-not-allowed
                     active:scale-95 transition-all min-w-[9rem]"
        >
          {hintActive ? "ヒントを消す" : "ヒントを見る"}
        </button>
        <button
          onClick={handleShowAnswer}
          disabled={!hasProblem}
          className="px-6 py-2.5 bg-warm-400 hover:bg-warm-500 active:bg-warm-600 text-white font-bold
                     rounded-xl shadow disabled:opacity-40 disabled:cursor-not-allowed
                     active:scale-95 transition-all"
        >
          答えを見る
        </button>
      </div>

      {/* ③ 問題文（ボタン群とテーブルの間） ─────────── */}
      <PutText el_text={msgRef} />

      {/* ④ 位取りテーブル ──────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              {PLACE_NAMES.map(name => (
                <th key={name}
                    className="border border-gray-300 dark:border-gray-600
                               bg-brand-50 dark:bg-brand-900
                               text-brand-700 dark:text-brand-300
                               text-xs py-1 px-0 font-bold">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 行0: ●（クリックでトグル） */}
            <tr>
              {Array(8).fill(0).map((_, col) => (
                <td key={col} onClick={() => toggleDot(col)}
                    className="border border-gray-200 dark:border-gray-700 h-8
                               text-center font-bold text-lg cursor-pointer
                               text-accent-600 dark:text-accent-400
                               hover:bg-accent-50 dark:hover:bg-gray-700
                               transition-colors select-none">
                  {dotCells[col] ? "●" : ""}
                </td>
              ))}
            </tr>
            {/* 行1: 数字（クリックで斜線トグル） */}
            <tr>
              {cellDigits.map((d, col) => (
                <td key={col} onClick={() => toggleSlash(col)}
                    className={`border border-gray-300 dark:border-gray-600 h-12
                                text-center text-xl font-bold cursor-pointer
                                text-gray-800 dark:text-gray-200
                                hover:bg-gray-100 dark:hover:bg-gray-700
                                transition-colors select-none
                                ${slashCells[col] ? "round-slash" : ""}`}>
                  {d !== null ? d : ""}
                </td>
              ))}
            </tr>
            {/* 行2: オレンジ背景（クリックでトグル） */}
            <tr>
              {Array(8).fill(0).map((_, col) => (
                <td key={col} onClick={() => toggleOrange(col)}
                    className={`border border-gray-200 dark:border-gray-700 h-5
                                cursor-pointer transition-colors select-none
                                ${orangeCells[col]
                                  ? "bg-orange-200 dark:bg-orange-900"
                                  : "hover:bg-orange-50 dark:hover:bg-orange-950"}`}
                />
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* つかいかた トグルボタン */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowGuide(prev => !prev)}
          className="text-xs px-3 py-1 rounded-lg border
                     border-gray-300 dark:border-gray-600
                     text-gray-500 dark:text-gray-400
                     hover:bg-gray-100 dark:hover:bg-gray-700
                     transition-colors"
        >
          {showGuide ? "つかいかたを閉じる ▲" : "つかいかた ▼"}
        </button>
      </div>

      {/* テーブルのガイドテキスト（トグル） */}
      {showGuide && (
        <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900
                        rounded-lg px-3 py-2 space-y-1">
          <p className="font-bold text-gray-500 dark:text-gray-400">
            表の各セルをクリックしてマークを付け外しできます
          </p>
          <p><span className="text-accent-500 font-bold">● 行</span>　…　どの位まで四捨五入するかの目印。丸める位にクリック</p>
          <p><span className="font-bold text-red-500">斜線 行</span>　…　数字をクリックすると斜線。「5以上か・4以下か」を判断する桁に付ける</p>
          <p><span className="bg-orange-200 dark:bg-orange-800 px-1 rounded">オレンジ 行</span>　…　判定桁の位置をクリックして色を付ける</p>
          <p className="text-gray-300 dark:text-gray-600">ヒントボタンで正解位置に自動配置</p>
        </div>
      )}

      {/* ⑤ テンキー + 答え合わせ ──────────────────── */}
      <section className="space-y-3">

        {/* 入力表示（大きく・目立つデザイン） */}
        <div className="w-full rounded-2xl border-4 border-brand-400 dark:border-brand-600
                        bg-white dark:bg-gray-800 px-6 py-3">
          <p className="text-sm font-bold text-brand-600 dark:text-brand-400 mb-1 text-center">
            答え
          </p>
          <div className="text-center text-4xl font-black text-gray-800 dark:text-gray-100
                          min-h-[3.5rem] flex items-center justify-center">
            {displayValue !== null
              ? displayValue
              : <span className="text-gray-300 dark:text-gray-600 text-xl font-normal">
                  テンキーで入力してね
                </span>
            }
          </div>
        </div>

        {/* テンキー */}
        <NumPad
          onDigit={handleDigit}
          onDelete={handleDelete}
          onClear={handleClear}
          disabled={!hasProblem}
        />

        {/* せいかい！+ 答え合わせ + 消す */}
        <div className="flex flex-col items-center gap-2">
          <span ref={seikaiRef} style={{ display: "none" }}
                className="text-2xl font-black text-rose-500">
            せいかい！🎉
          </span>
          <button
            onClick={checkAnswer}
            className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold
                       rounded-xl text-lg shadow-md active:scale-95 transition-all"
          >
            答え合わせ
          </button>
        </div>
      </section>

      {/* ⑥ コイン ──────────────────────────────────── */}
      <CoinDisplay coins={coins} />

    </main>
  )
}
