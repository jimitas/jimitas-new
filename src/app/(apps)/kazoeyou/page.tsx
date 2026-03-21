// ======================================================
// かぞえよう ページ
//
// URL: /kazoeyou
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

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import * as se from "@/lib/se"
import { BtnNum } from "@/components/parts/buttons/BtnNum"
import { BtnQuestion } from "@/components/parts/buttons/BtnQuestion"
import { PutText } from "@/components/parts/displays/PutText"
import { PutImage } from "@/components/parts/displays/PutImage"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { useCoins } from "@/hooks/useCoins"
import { useAnswerCheck } from "@/hooks/useAnswerCheck"

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

  // answer の最新値を ref で保持（useAnswerCheck の onCorrect 内で参照するため）
  const answerRef = useRef<number>(0)
  useEffect(() => { answerRef.current = answer }, [answer])

  // コインシステム
  const { coins, addCoins } = useCoins()

  // 正誤判定フック
  // kazoeyou は正解テキストに枚数を含めるため、onCorrect で上書きする
  const { checkAnswer } = useAnswerCheck({
    addCoins,
    hasAnsweredRef,
    // 不正解後に戻すテキストは固定の "いくつかな？"
    getPrevText: () => "いくつかな？",
    el_text,
    // 正解テキストを枚数付きに上書きする
    onCorrect: () => {
      if (el_text.current) {
        el_text.current.innerHTML =
          `<span style="color:red;">せいかい！　${answerRef.current} まい</span>`
      }
    },
    // 不正解後1秒で再入力可能に（flag を true に戻す）
    onWrongRestore: () => setFlag(true),
  })

  // 初期メッセージを表示する
  useEffect(() => {
    if (el_text.current) {
      el_text.current.innerHTML = "かずをえらんで　もんだいをおそう"
    }
  }, [])

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
  // useAnswerCheck フックの checkAnswer をラップして前処理を追加する
  const handleCheckAnswer = (myAnswer: number) => {
    if (!flag) return
    setFlag(false)
    checkAnswer(myAnswer, answer)
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
          className="font-bold text-brand-600 dark:text-brand-400"
          style={{ fontSize: "max(2vw, 20px)" }}
        >
          ← かずをえらぼう
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
      <BtnNum ITEM={NUM} handleEvent={handleCheckAnswer} />

      {/* もんだいボタン */}
      <div className="flex justify-center mt-2">
        <BtnQuestion handleEvent={giveQuestion} />
      </div>

      {/* コイン表示 */}
      <CoinDisplay coins={coins} />

    </div>
  )
}
