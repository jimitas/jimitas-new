// ======================================================
// ひき算のひっ算 ページ
//
// URL: /hiki-hissan
// 対象: 小学2〜3年生
// 内容: 2〜3桁のひき算を筆算形式で練習する
//
// 操作:
//   もんだい      → ランダム問題を生成
//   セット        → 入力欄の値で問題をセット
//   クリア        → 編集セルをリセット
//   こたえ        → 正解とくり下がりを表示
//   黄セルをタップ → そのセルを選択（リングで強調）
//   数字パレット  → 選択中のセルに数字を入力
// ======================================================

"use client"

import { useState, useCallback } from "react"
import * as se from "@/lib/se"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { useCoins } from "@/hooks/useCoins"

// ── 定数 ────────────────────────────────────────────────
const COLS = 4
const TYPES = ["(2けた)-(2けた)", "(3けた)-(2けた)", "(3けた)-(3けた)"]

// ── ヘルパー ─────────────────────────────────────────────

function toDigits(n: number): number[] {
  return String(Math.abs(Math.floor(n))).split("").reverse().map(Number)
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ── ページ本体 ──────────────────────────────────────────
export default function HikiHissanPage() {

  const [num1, setNum1] = useState(56)       // 上の数（被減数）
  const [num2, setNum2] = useState(23)       // 下の数（減数）
  const [input1, setInput1] = useState("56")
  const [input2, setInput2] = useState("23")
  const [typeIndex, setTypeIndex] = useState(0)

  // 編集可能なセル（行0: くり下がり、行3: こたえ）
  const [borrowRow, setBorrowRow] = useState<string[]>(Array(COLS).fill(""))
  const [ansRow,    setAnsRow]    = useState<string[]>(Array(COLS).fill(""))

  // 選択中のセル
  const [selCell, setSelCell] = useState<{ r: 0 | 3; c: number } | null>(null)

  const [isCorrect, setIsCorrect] = useState(false)

  const { coins, addCoins } = useCoins()

  const answer = num1 - num2

  // ── 問題セット（共通処理） ─────────────────────────────
  const setProblem = useCallback((a: number, b: number) => {
    setNum1(a); setNum2(b)
    setInput1(String(a)); setInput2(String(b))
    setBorrowRow(Array(COLS).fill(""))
    setAnsRow(Array(COLS).fill(""))
    setSelCell(null)
    setIsCorrect(false)
    se.playSe(se.set)
  }, [])

  // ── もんだい ──────────────────────────────────────────
  const handleMondai = useCallback(() => {
    let a = 0, b = 0
    switch (typeIndex) {
      case 0:
        // (2けた)-(2けた): num1 > num2 になるよう調整
        a = rand(11, 99)
        b = rand(10, a - 1)
        break
      case 1:
        // (3けた)-(2けた)
        a = rand(100, 999)
        b = rand(10, 99)
        break
      case 2:
        // (3けた)-(3けた): num1 > num2
        a = rand(101, 999)
        b = rand(100, a - 1)
        break
    }
    setProblem(a, b)
  }, [typeIndex, setProblem])

  // ── セット（手入力） ──────────────────────────────────
  const handleSet = useCallback(() => {
    const a = parseInt(input1, 10)
    const b = parseInt(input2, 10)
    if (!isFinite(a) || !isFinite(b) || a < 11 || b < 10 || a > 999 || b > 999 || a <= b) {
      se.playSe(se.alertSound)
      return
    }
    setProblem(a, b)
  }, [input1, input2, setProblem])

  // ── クリア ────────────────────────────────────────────
  const handleClear = () => {
    setBorrowRow(Array(COLS).fill(""))
    setAnsRow(Array(COLS).fill(""))
    setSelCell(null)
    setIsCorrect(false)
    se.playSe(se.reset)
  }

  // ── こたえ表示 ────────────────────────────────────────
  const handleShowAnswer = () => {
    const d1 = toDigits(num1)  // 被減数（一の位がindex 0）
    const d2 = toDigits(num2)

    // くり下がり計算
    const newBorrow = Array(COLS).fill("")
    let borrow = 0
    const maxLen = Math.max(d1.length, d2.length)
    // 最上位桁以外のすべての桁でくり下がりを確認
    for (let i = 0; i < maxLen - 1; i++) {
      const diff = (d1[i] ?? 0) - (d2[i] ?? 0) - borrow
      borrow = diff < 0 ? 1 : 0
      if (borrow === 1) {
        // この桁でくり下がりが起きた → 同じ桁のセルに "10" を表示
        const col = COLS - 1 - i
        newBorrow[col] = "10"
      }
    }

    // こたえ桁を設定
    const dAns = toDigits(answer)
    const newAns = Array(COLS).fill("")
    dAns.forEach((d, i) => { newAns[COLS - 1 - i] = String(d) })

    setBorrowRow(newBorrow)
    setAnsRow(newAns)
    setIsCorrect(false)
    se.playSe(se.seikai2)
  }

  // ── セルクリック ──────────────────────────────────────
  const handleCellClick = (r: 0 | 3, c: number) => {
    setSelCell({ r, c })
    se.playSe(se.pi)
  }

  // ── 数字入力 ──────────────────────────────────────────
  const handleDigit = (digit: number) => {
    if (!selCell) return
    const { r, c } = selCell

    if (r === 0) {
      const next = [...borrowRow]
      next[c] = String(digit)
      setBorrowRow(next)
    } else {
      const next = [...ansRow]
      next[c] = String(digit)
      setAnsRow(next)
      checkAnswer(next)
    }
    if (c < COLS - 1) setSelCell({ r, c: c + 1 })
    else setSelCell(null)
  }

  // ── セル削除 ──────────────────────────────────────────
  const handleDelete = () => {
    if (!selCell) return
    const { r, c } = selCell
    if (r === 0) {
      const next = [...borrowRow]; next[c] = ""; setBorrowRow(next)
    } else {
      const next = [...ansRow]; next[c] = ""; setAnsRow(next)
      setIsCorrect(false)
    }
  }

  // ── 答えチェック ──────────────────────────────────────
  const checkAnswer = (row: string[]) => {
    if (isCorrect) return
    const userAns =
      Number(row[0]) * 1000 +
      Number(row[1]) * 100 +
      Number(row[2]) * 10 +
      Number(row[3])
    if (userAns === answer) {
      setIsCorrect(true)
      se.playSe(se.seikai1)
      addCoins(1)
    }
  }

  // ── グリッド計算 ──────────────────────────────────────

  // 記号の位置: 両方が2桁以下なら col1、それ以外は col0
  const signCol = (num1 < 100 && num2 < 100) ? 1 : 0

  function getCellContent(r: number, c: number): string {
    const d1 = toDigits(num1)
    const d2 = toDigits(num2)
    const digitIdx = COLS - 1 - c  // col3→0(一の位), col2→1(十の位), ...

    if (r === 0) return borrowRow[c]
    if (r === 1) return digitIdx < d1.length ? String(d1[digitIdx]) : ""
    if (r === 2) {
      if (c === signCol) return "－"
      return (digitIdx < d2.length && c !== signCol) ? String(d2[digitIdx]) : ""
    }
    if (r === 3) return ansRow[c]
    return ""
  }

  // ── グリッドの描画 ────────────────────────────────────
  function renderGrid() {
    return [0, 1, 2, 3].map(r => (
      <div key={r} className="flex">
        {Array.from({ length: COLS }, (_, c) => {
          const isEditable = r === 0 || r === 3
          const isSelected = selCell?.r === r && selCell?.c === c
          const content = getCellContent(r, c)

          const heightCls   = r === 0 ? "h-8" : "h-14"
          const bgCls       = (r === 0 || r === 3) ? "bg-amber-50" : "bg-white"
          const textSizeCls = r === 0 ? "text-sm" : "text-2xl"
          const textColorCls = r === 0
            ? "text-red-500 font-semibold"
            : r === 3 && isCorrect
              ? "text-brand-600 font-bold"
              : "text-gray-800 font-bold"
          const borderBCls = r === 2 ? "border-b-4 border-b-gray-700" : ""
          const ringCls = isSelected ? "ring-2 ring-inset ring-brand-500 z-10 relative" : ""
          const cursorCls = isEditable ? "cursor-pointer" : ""

          return (
            <div
              key={c}
              onClick={() => isEditable && handleCellClick(r as 0 | 3, c)}
              className={`w-14 ${heightCls} flex items-center justify-center
                border border-gray-400
                ${bgCls} ${textSizeCls} ${textColorCls}
                ${borderBCls} ${ringCls} ${cursorCls}`}
            >
              {content}
            </div>
          )
        })}
      </div>
    ))
  }

  // ── 描画 ─────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800">
        ➖ ひき算のひっ算
      </h1>

      {/* コントロール行 */}
      <div className="flex flex-wrap justify-center items-center gap-2">
        <button
          onClick={handleClear}
          className="px-3 py-2 rounded-lg font-bold border-2 border-gray-400
                     text-gray-600 hover:bg-gray-100 text-sm active:scale-95 transition-all"
        >
          クリア
        </button>
        <select
          value={typeIndex}
          onChange={e => setTypeIndex(Number(e.target.value))}
          className="text-sm font-bold p-2 border-2 border-brand-400 rounded-lg text-gray-700"
        >
          {TYPES.map((t, i) => <option key={i} value={i}>{t}</option>)}
        </select>
        <button
          onClick={handleMondai}
          className="px-4 py-2 rounded-lg font-bold bg-brand-500 text-white
                     hover:bg-brand-600 text-sm active:scale-95 transition-all"
        >
          もんだい
        </button>
        <button
          onClick={handleShowAnswer}
          className="px-4 py-2 rounded-lg font-bold bg-accent-500 text-white
                     hover:bg-accent-600 text-sm active:scale-95 transition-all"
        >
          こたえ
        </button>
      </div>

      {/* 手入力行 */}
      <div className="flex flex-wrap justify-center items-center gap-2">
        <input
          type="number" min={11} max={999}
          value={input1}
          onChange={e => setInput1(e.target.value)}
          className="w-20 text-center p-1 border-2 border-gray-300 rounded
                     font-bold text-lg text-gray-800"
        />
        <span className="text-gray-500 font-bold text-lg">－</span>
        <input
          type="number" min={10} max={999}
          value={input2}
          onChange={e => setInput2(e.target.value)}
          className="w-20 text-center p-1 border-2 border-gray-300 rounded
                     font-bold text-lg text-gray-800"
        />
        <button
          onClick={handleSet}
          className="px-3 py-1 rounded font-bold border-2 border-accent-400
                     text-accent-600 hover:bg-accent-50 text-sm active:scale-95 transition-all"
        >
          セット
        </button>
      </div>

      {/* 正解メッセージ */}
      <div className="h-8 flex items-center justify-center">
        {isCorrect && (
          <p className="text-2xl font-bold text-brand-600 animate-bounce">
            せいかい！🎉
          </p>
        )}
      </div>

      {/* 筆算グリッド */}
      <div className="flex justify-center">
        <div className="inline-block">
          {renderGrid()}
        </div>
      </div>

      {/* 数字パレット */}
      <div className="flex flex-wrap justify-center gap-2">
        {[0,1,2,3,4,5,6,7,8,9].map(n => (
          <button
            key={n}
            onClick={() => handleDigit(n)}
            className="w-12 h-12 text-xl font-bold border-2 border-gray-300 rounded-lg
                       bg-white hover:bg-brand-50 hover:border-brand-400
                       active:scale-95 transition-all"
          >
            {n}
          </button>
        ))}
        {/* 削除ボタン */}
        <button
          onClick={handleDelete}
          className="w-12 h-12 text-sm font-bold border-2 border-gray-300 rounded-lg
                     bg-white hover:bg-red-50 hover:border-red-400
                     active:scale-95 transition-all text-gray-500"
        >
          ✕
        </button>
      </div>

      {/* コイン */}
      <CoinDisplay coins={coins} />

    </div>
  )
}
