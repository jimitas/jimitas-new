// ======================================================
// なんばんめ ページ
//
// URL: /nanbanme
// 対象: 小学1年生
// 内容: 10匹の動物が並んだ列で「何番目か」を答えさせる
//
// モード:
//   もんだい1 → 「ひだり/みぎから N ばんめのどうぶつは？」
//               → 正しい動物画像をクリックして答える
//   もんだい2 → 動物の画像を1枚見せて「は　なんばんめ？」
//               → 方向（ひだり/みぎ）と番号をセレクトで選び「こたえあわせ」
//   シャッフル → 動物の並び順をランダムに変える
// ======================================================

"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import * as se from "@/lib/se"
import { shuffled } from "@/lib/utils"
import { BtnQuestion } from "@/components/parts/buttons/BtnQuestion"
import { BtnCheck } from "@/components/parts/buttons/BtnCheck"
import { BtnShuffle } from "@/components/parts/buttons/BtnShuffle"
import { PutText } from "@/components/parts/displays/PutText"
import { PutImage } from "@/components/parts/displays/PutImage"
import { CoinDisplay } from "@/components/parts/displays/CoinDisplay"
import { useCoins } from "@/hooks/useCoins"

// ── 定数 ─────────────────────────────────────────────

// 10匹の動物（public/images/ 内の png ファイル名）
const ANIMALS = ["dog", "cat", "monkey", "frog", "usagi", "niwatori", "ika", "tako", "iruka", "butterfly"]

const DIRS    = ["ひだり", "みぎ"]
const NUMS    = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// ── コンポーネント ───────────────────────────────────

export default function NanbanmePage() {
  // ── 状態管理 ─────────────────────────────────────

  // 動物の並び順（ANIMALS 配列のインデックスをシャッフルした配列）
  const [order, setOrder] = useState<number[]>(() => shuffled([0,1,2,3,4,5,6,7,8,9]))

  // 現在のモード（0=初期, 1=もんだい1, 2=もんだい2）
  const [mode, setMode] = useState<0 | 1 | 2>(0)

  // 回答受付フラグ
  const [flag, setFlag] = useState<boolean>(false)

  // 正解の動物名（ref で管理して useCallback 内でも最新値を参照）
  const answerRef = useRef<string>("")

  // もんだい2 で問題文に表示する動物名
  const [q2Animal, setQ2Animal] = useState<string>("")

  // もんだい2 の回答用セレクト値
  const [selectDir, setSelectDir] = useState<string>("ひだり")
  const [selectNum, setSelectNum] = useState<number>(1)

  // メッセージ表示エリアへの参照
  const el_text = useRef<HTMLDivElement | null>(null)

  // 1問ごとの初回正解のみコインを付与するフラグ
  const hasAnsweredRef = useRef<boolean>(false)

  // コインシステム
  const { coins, addCoins } = useCoins()

  // ── 初期化 ───────────────────────────────────────
  useEffect(() => {
    if (el_text.current) el_text.current.innerHTML = "もんだいをおしてね。"
  }, [])

  // ── 正誤フィードバック ────────────────────────────

  const sendRight = () => {
    if (!hasAnsweredRef.current) {
      addCoins(1)
      hasAnsweredRef.current = true
    }
    se.playSe(se.right)
    if (el_text.current) {
      el_text.current.innerHTML = `<span style="color:red;">せいかい！</span>`
    }
  }

  const sendWrong = (retry: () => void) => {
    se.playSe(se.alertSound)
    if (el_text.current) {
      el_text.current.innerHTML = `<span style="color:gray;">ちがうよ</span>`
    }
    setTimeout(() => {
      setFlag(true)
      retry()
    }, 1000)
  }

  // ── もんだい1：動物クリックで答える ──────────────

  const giveQuestion1 = useCallback(() => {
    se.playSe(se.set)
    setMode(1)
    setFlag(true)
    hasAnsweredRef.current = false

    // ひだり/みぎ をランダムに決める
    const dir = Math.floor(Math.random() * 2 + 1)  // 1=ひだり, 2=みぎ
    const num = Math.floor(Math.random() * 9 + 1)   // 1〜9（端の動物は除く）

    // 正解：左から num 番目の動物（dir に関わらず order[num-1] が基準）
    answerRef.current = ANIMALS[order[num - 1]]

    if (el_text.current) {
      el_text.current.innerHTML =
        `${dir === 1 ? "ひだり" : "みぎ"}から　` +
        `${dir === 1 ? num : 11 - num}　ばんめのどうぶつは？`
      // 不正解後の復元用にテキストを保存しておく
      el_text.current.dataset.q1text = el_text.current.innerHTML
    }
  }, [order])

  // 動物画像クリック時の正誤判定（もんだい1）
  const checkAnswer1 = useCallback((clickedAnimal: string) => {
    if (!flag || mode !== 1) return
    setFlag(false)

    if (clickedAnimal === answerRef.current) {
      sendRight()
    } else {
      sendWrong(() => {
        if (el_text.current) {
          // 問題文を復元（再入力のため）
          const prev = el_text.current.dataset.q1text ?? ""
          el_text.current.innerHTML = prev
        }
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flag, mode])

  // ── もんだい2：セレクトで番号を答える ────────────

  const giveQuestion2 = useCallback(() => {
    se.playSe(se.set)
    setMode(2)
    setFlag(true)
    hasAnsweredRef.current = false
    setSelectDir("ひだり")
    setSelectNum(1)

    // ランダムな位置の動物を問題に出す
    const pos = Math.floor(Math.random() * 10)  // 0〜9
    const animal = ANIMALS[order[pos]]
    answerRef.current = animal
    setQ2Animal(animal)

    if (el_text.current) el_text.current.innerHTML = "↓の　どうぶつは　なんばんめ？"
  }, [order])

  // こたえあわせボタン（もんだい2）
  const checkAnswer2 = () => {
    if (!flag || mode !== 2) return
    setFlag(false)

    // selectDir と selectNum から正解の動物を求める
    const myAnswer =
      selectDir === "ひだり"
        ? ANIMALS[order[selectNum - 1]]      // 左から selectNum 番目
        : ANIMALS[order[10 - selectNum]]     // 右から selectNum 番目

    if (myAnswer === answerRef.current) {
      sendRight()
    } else {
      sendWrong(() => {
        if (el_text.current) el_text.current.innerHTML = "↓の　どうぶつは　なんばんめ？"
      })
    }
  }

  // ── シャッフル ────────────────────────────────────

  const handleShuffle = useCallback(() => {
    se.playSe(se.seikai1)
    setOrder(shuffled([0,1,2,3,4,5,6,7,8,9]))
    setMode(0)
    setFlag(false)
    setQ2Animal("")
    if (el_text.current) el_text.current.innerHTML = "もんだいをおしてね。"
  }, [])

  // ── 描画 ─────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* タイトル */}
      <h1 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">
        🐾 なんばんめ
      </h1>

      {/* ボタン行 */}
      <div className="flex flex-wrap justify-center items-center">
        <BtnQuestion btnText="もんだい１" handleEvent={giveQuestion1} />
        <BtnQuestion btnText="もんだい２" handleEvent={giveQuestion2} />
        <BtnShuffle handleEvent={handleShuffle} />
      </div>

      {/* メッセージエリア（もんだい1の問題文・正誤フィードバック） */}
      <PutText el_text={el_text} />

      {/* もんだい2：問題の動物画像 */}
      {mode === 2 && q2Animal && (
        <div className="flex justify-center items-center gap-3 my-2">
          <Image
            src={`/images/${q2Animal}.png`}
            alt={q2Animal}
            width={72}
            height={72}
            className="object-contain"
          />
        </div>
      )}

      {/* 動物の列（10匹を横並び・シャッフル対応） */}
      <PutImage>
        {order.map((animalIdx, pos) => (
          <button
            key={pos}
            onClick={() => checkAnswer1(ANIMALS[animalIdx])}
            className="p-0 border-0 bg-transparent cursor-pointer
                       hover:scale-110 transition-transform"
            aria-label={ANIMALS[animalIdx]}
          >
            <Image
              src={`/images/${ANIMALS[animalIdx]}.png`}
              alt={ANIMALS[animalIdx]}
              width={52}
              height={52}
              className="object-contain"
            />
          </button>
        ))}
      </PutImage>

      {/* もんだい2 の回答エリア（もんだい2のときだけ表示） */}
      {mode === 2 && (
        <div className="flex flex-wrap justify-center items-center gap-2 my-3">
          {/* 方向セレクト */}
          <select
            value={selectDir}
            onChange={(e) => setSelectDir(e.target.value)}
            className="font-bold p-2 text-base md:text-xl
                       border-brand-500 text-black dark:text-gray-100 dark:bg-gray-700
                       border-2 rounded-lg shadow-lg"
          >
            {DIRS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="font-bold text-gray-700 dark:text-gray-200"
                style={{ fontSize: "max(2vw, 18px)" }}>から</span>
          {/* 番号セレクト */}
          <select
            value={selectNum}
            onChange={(e) => { setSelectNum(Number(e.target.value)); se.playSe(se.set) }}
            className="font-bold p-2 text-base md:text-xl
                       border-brand-500 text-black dark:text-gray-100 dark:bg-gray-700
                       border-2 rounded-lg shadow-lg"
          >
            {NUMS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="font-bold text-gray-700 dark:text-gray-200"
                style={{ fontSize: "max(2vw, 18px)" }}>ばんめ</span>
          <BtnCheck handleEvent={checkAnswer2} />
        </div>
      )}

      {/* コイン表示 */}
      <CoinDisplay coins={coins} />

    </div>
  )
}
