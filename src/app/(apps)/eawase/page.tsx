"use client"

// ======================================================
// えあわせ（絵合わせ）
//
// 5種類のくだものイラスト × 2枚 = 計10枚のカードを並べて、
// 1枚ずつタップで裏↔表をひっくり返せる。
// 「ひだり」「みぎ」のヒント表示で左右の方向練習にも使える。
//
// 旧 jimitas.com/eawase/ から移植（ペア判定なしの単純フリップ式）。
// ======================================================

import { useState, useCallback } from "react"
import Image from "next/image"
import { useSound } from "@/hooks/useSound"

const NUM_CARDS = 10  // 5種類 × 2枚

// 0..(NUM_CARDS-1) のシャッフル配列を返す
function shuffle(): number[] {
  const arr = Array.from({ length: NUM_CARDS }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function EawasePage() {
  // 各位置のカードに割り当てられた番号（0..9）。番号は 1.png〜10.png に対応
  const [cardOrder, setCardOrder] = useState<number[]>(shuffle())
  // 各位置の表/裏。true = 表（くだものが見える）
  const [revealed, setRevealed] = useState<boolean[]>(Array(NUM_CARDS).fill(false))
  // ひだり/みぎラベルの色（true で赤、false で透明）
  const [hintOn, setHintOn] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [confirmingSet, setConfirmingSet] = useState(false)
  const { play } = useSound()

  // ----- カードクリックでひっくり返す -----
  const flipCard = useCallback((pos: number) => {
    setRevealed(prev => {
      const next = [...prev]
      const willReveal = !next[pos]
      next[pos] = willReveal
      // 裏→表 は se_1、表→裏 は se_2
      play(`/sounds/eawase/${willReveal ? "se_1" : "se_2"}.mp3`, 0.5)
      return next
    })
  }, [play])

  // ----- せっと: 並び順を再シャッフルし、すべて裏に戻す -----
  const setCards = () => {
    play("/sounds/eawase/se_3.mp3", 0.5)
    setCardOrder(shuffle())
    setRevealed(Array(NUM_CARDS).fill(false))
    setConfirmingSet(false)
  }

  // ----- りせっと: 最初の状態に戻す（並び再シャッフル + 裏返し + ヒントOFF） -----
  const reset = () => {
    setCardOrder(shuffle())
    setRevealed(Array(NUM_CARDS).fill(false))
    setHintOn(false)
    setConfirmingReset(false)
  }

  // ----- ひんと: ひだり/みぎラベルを赤くする/戻す -----
  const toggleHint = () => {
    setHintOn(prev => {
      play(`/sounds/eawase/${prev ? "se_2" : "se_1"}.mp3`, 0.5)
      return !prev
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        えあわせを　しましょう
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        カードをおすと、おもてとうらをひっくりかえせるよ。「ひんと」をおすと「ひだり」「みぎ」のもじが赤くなるよ。
      </p>

      {/* ===== コントロール ===== */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* りせっと（インライン確認付き） */}
        {!confirmingReset ? (
          <button
            onClick={() => setConfirmingReset(true)}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold"
          >
            りせっと
          </button>
        ) : (
          <div className="flex gap-1 items-center bg-red-50 dark:bg-red-950 rounded-lg p-1">
            <span className="text-xs text-red-700 dark:text-red-300 px-2">さいしょから？</span>
            <button onClick={reset} className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs font-bold">はい</button>
            <button onClick={() => setConfirmingReset(false)} className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 text-xs">いいえ</button>
          </div>
        )}

        {/* せっと（インライン確認付き） */}
        {!confirmingSet ? (
          <button
            onClick={() => setConfirmingSet(true)}
            className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold"
          >
            せっと
          </button>
        ) : (
          <div className="flex gap-1 items-center bg-brand-50 dark:bg-brand-950 rounded-lg p-1">
            <span className="text-xs text-brand-700 dark:text-brand-300 px-2">カードをならべる？</span>
            <button onClick={setCards} className="px-3 py-1 rounded bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold">はい</button>
            <button onClick={() => setConfirmingSet(false)} className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 text-xs">いいえ</button>
          </div>
        )}

        {/* ひんと */}
        <button
          onClick={toggleHint}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${
            hintOn
              ? "bg-warm-500 hover:bg-warm-600 text-white"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          ひんと
        </button>
      </div>

      {/* ===== ひだり / みぎ ラベル ===== */}
      <div className="flex justify-between items-center px-2 mb-2 max-w-3xl">
        <h3 className={`text-2xl font-bold transition-colors ${hintOn ? "text-red-500" : "text-transparent select-none"}`}>
          ひだり
        </h3>
        <h3 className={`text-2xl font-bold transition-colors ${hintOn ? "text-red-500" : "text-transparent select-none"}`}>
          みぎ
        </h3>
      </div>

      {/* ===== カードエリア ===== */}
      <div className="flex flex-wrap gap-2">
        {cardOrder.map((cardNum, pos) => (
          <Card
            key={pos}
            cardNum={cardNum}
            isRevealed={revealed[pos]}
            onFlip={() => flipCard(pos)}
          />
        ))}
      </div>
    </div>
  )
}

// -----------------------------------------------------
// 1枚のカード（裏 ↔ 表 を CSS 3D フリップで切り替え）
// -----------------------------------------------------
function Card({
  cardNum,
  isRevealed,
  onFlip,
}: {
  cardNum: number
  isRevealed: boolean
  onFlip: () => void
}) {
  // cardNum は 0..9、画像ファイル名は 1.png〜10.png
  const imageIndex = cardNum + 1
  return (
    <button
      onClick={onFlip}
      className="relative w-20 h-28 sm:w-24 sm:h-32"
      style={{ perspective: 1000 }}
      aria-label={isRevealed ? `カード${imageIndex} 表` : "カード 裏"}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* 裏面 */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Image
            src="/images/eawase/cardura.png"
            alt="カード（裏）"
            fill
            className="object-cover"
            draggable={false}
            sizes="100px"
          />
        </div>
        {/* 表面 */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <Image
            src={`/images/eawase/${imageIndex}.png`}
            alt={`カード ${imageIndex}`}
            fill
            className="object-contain"
            draggable={false}
            sizes="100px"
          />
        </div>
      </div>
    </button>
  )
}
