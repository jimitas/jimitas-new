// ======================================================
// かぞえよう ページ
//
// URL: /apps/kazoeyou
// 対象: 小学1年生
// 内容: 動物の絵を N 枚表示して「いくつかな？」に答えさせる
//
// 操作:
//   セレクト     → 5〜10 の範囲（上限）を選ぶ
//   「もんだい」 → 範囲内でランダムに枚数を決めて動物を表示
//   数字ボタン   → 枚数を答える
//
// 動物とセレクト値の対応:
//   5→りんご  6→バナナ  7→ねこ  8→さる  9→かえる  10→いぬ
// ======================================================

"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import * as se from "@/lib/se"
import { BtnNum } from "@/components/parts/buttons/BtnNum"
import { BtnQuestion } from "@/components/parts/buttons/BtnQuestion"
import { PutText } from "@/components/parts/displays/PutText"
import { PutImage } from "@/components/parts/displays/PutImage"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { useCoins } from "@/hooks/useCoins"

// ── 定数 ─────────────────────────────────────────────

const NUM = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const SELECT_ITEMS = [5, 6, 7, 8, 9, 10]

// セレクト値（5〜10）に対応する動物画像ファイル名
const ANIMALS = ["apple", "banana", "cat", "monkey", "frog", "dog"]

// ── コンポーネント ───────────────────────────────────

export default function KazoeyouPage() {
  // ── 状態管理 ─────────────────────────────────────
  const [flag, setFlag]         = useState<boolean>(false)  // 回答受付フラグ
  const [maxValue, setMaxValue] = useState<number>(5)       // セレクトで選んだ上限値
  const [answer, setAnswer]     = useState<number>(0)       // 正解の枚数
  const [animalSrc, setAnimalSrc] = useState<string>("")    // 表示する動物ファイル名
  const [displayCount, setDisplayCount] = useState<number>(0) // 表示する枚数

  // maxValue の最新値を常に参照するための ref（useCallback のクロージャ対策）
  const maxValueRef = useRef<number>(5)

  // メッセージ表示エリアへの参照
  const el_text = useRef<HTMLDivElement | null>(null)

  // 1問につき初回正解のみコインを付与するフラグ
  const hasAnsweredRef = useRef<boolean>(false)

  // コインシステム
  const { coins, addCoins } = useCoins()

  // ── イベントハンドラー ────────────────────────────

  // セレクトで上限値を変更する
  const changeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    se.playSe(se.reset)
    const val = parseInt(e.target.value)
    maxValueRef.current = val
    setMaxValue(val)
    setDisplayCount(0)
    setFlag(false)
    if (el_text.current) el_text.current.innerHTML = "もんだいをおしてね"
  }

  // 「もんだい」ボタン：動物をランダムな枚数で表示する
  const giveQuestion = () => {
    const mv = maxValueRef.current
    const newAns = Math.floor(Math.random() * mv + 1)  // 1〜mv のランダム

    se.playSe(se.set)
    setAnswer(newAns)
    setAnimalSrc(ANIMALS[mv - 5])   // セレクト値 5→index0（apple）〜10→index5（dog）
    setDisplayCount(newAns)
    setFlag(true)
    hasAnsweredRef.current = false

    if (el_text.current) el_text.current.innerHTML = "いくつかな？"
  }

  // 数字ボタンで答えを送信する
  const checkAnswer = (myAnswer: number) => {
    if (!flag) return
    setFlag(false)

    if (myAnswer === answer) {
      // 正解
      if (!hasAnsweredRef.current) {
        addCoins(1)
        hasAnsweredRef.current = true
      }
      se.playSe(se.right)
      if (el_text.current) {
        el_text.current.innerHTML = `<span style="color:red;">せいかい！　${answer} まい</span>`
      }
    } else {
      // 不正解：1秒後に再入力可能に
      se.playSe(se.alertSound)
      if (el_text.current) {
        el_text.current.innerHTML = `<span style="color:gray;">ちがうよ</span>`
        setTimeout(() => {
          setFlag(true)
          if (el_text.current) el_text.current.innerHTML = "いくつかな？"
        }, 1000)
      }
    }
  }

  // ── 描画 ─────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">
        🐾 かぞえよう
      </h1>

      {/* セレクト行 */}
      <div className="flex justify-center items-center">
        <select
          onChange={changeSelect}
          className="text-center font-bold m-2 p-2 min-w-16 text-base md:text-xl
                     border-brand-500 text-black dark:text-gray-100 dark:bg-gray-700
                     border-2 rounded-lg shadow-lg"
        >
          {SELECT_ITEMS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <span
          className="font-bold text-gray-700 dark:text-gray-200"
          style={{ fontSize: "max(2vw, 20px)" }}
        >
          までのかず
        </span>
      </div>

      {/* メッセージエリア */}
      <PutText el_text={el_text} />

      {/* 動物画像表示エリア */}
      <PutImage>
        {Array.from({ length: displayCount }).map((_, i) => (
          <Image
            key={i}
            src={`/images/${animalSrc}.png`}
            alt={animalSrc}
            width={60}
            height={60}
            className="object-contain"
          />
        ))}
      </PutImage>

      {/* 数字ボタン 1〜10 */}
      <BtnNum ITEM={NUM} handleEvent={checkAnswer} />

      {/* もんだいボタン */}
      <div className="flex justify-center mt-2">
        <BtnQuestion handleEvent={giveQuestion} />
      </div>

      {/* コイン表示 */}
      <CoinDisplay coins={coins} />

    </div>
  )
}
