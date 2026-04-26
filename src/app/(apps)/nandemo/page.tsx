"use client"

// ======================================================
// なんでもトランプ
//
// スペード・クラブ・ダイヤ・ハート（各13枚） + ジョーカー2枚
// から好きな組み合わせをチェックして、シャッフルして並べる。
// 出たカードに合わせて先生が問題や質問を出す等、汎用的に使える。
//
// 旧 jimitas.com/nandemo/ から移植。
// ======================================================

import { useState, useCallback } from "react"
import Image from "next/image"
import { useSound } from "@/hooks/useSound"

// 各スートが占める番号レンジ（card1.png〜card54.png）
//   スペード 1〜13、クラブ 14〜26、ダイヤ 27〜39、ハート 40〜52、ジョーカー 53/54
type SuitKey = "spade" | "club" | "diamond" | "heart" | "joker1" | "joker2"

function rangeOf(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const SUITS: { key: SuitKey; label: string; range: number[] }[] = [
  { key: "spade",   label: "スペード",   range: rangeOf(1, 13) },
  { key: "club",    label: "クラブ",     range: rangeOf(14, 26) },
  { key: "diamond", label: "ダイヤ",     range: rangeOf(27, 39) },
  { key: "heart",   label: "ハート",     range: rangeOf(40, 52) },
  { key: "joker1",  label: "ジョーカー1", range: [53] },
  { key: "joker2",  label: "ジョーカー2", range: [54] },
]

export default function NandemoPage() {
  // どのスートを使うか（初期値：すべて on）
  const [enabled, setEnabled] = useState<Record<SuitKey, boolean>>({
    spade: true, club: true, diamond: true, heart: true,
    joker1: true, joker2: true,
  })

  // 並んでいるカード番号配列（シャッフル済み、card{num}.png）
  const [cardNums, setCardNums] = useState<number[]>([])
  // 各位置の表/裏（true=表）
  const [revealed, setRevealed] = useState<boolean[]>([])

  const [confirmingReset, setConfirmingReset] = useState(false)
  const [confirmingSet, setConfirmingSet] = useState(false)
  const { play } = useSound()

  // ----- カードクリックでひっくり返す -----
  const flipCard = useCallback((pos: number) => {
    setRevealed(prev => {
      const next = [...prev]
      const willReveal = !next[pos]
      next[pos] = willReveal
      play(`/sounds/nandemo/${willReveal ? "se_1" : "se_2"}.mp3`, 0.5)
      return next
    })
  }, [play])

  // ----- セット: 選択スートからシャッフルしてカード生成 -----
  const setCards = () => {
    play("/sounds/nandemo/se_3.mp3", 0.5)
    const all = SUITS.flatMap(s => enabled[s.key] ? s.range : [])
    const shuffled = shuffle(all)
    setCardNums(shuffled)
    setRevealed(Array(shuffled.length).fill(false))
    setConfirmingSet(false)
  }

  // ----- リセット: 全部裏に戻す（並びは維持） -----
  const reset = () => {
    setRevealed(prev => prev.map(() => false))
    setConfirmingReset(false)
  }

  const toggleSuit = (key: SuitKey) => {
    setEnabled(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        なんでもトランプ
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        出たカードに合わせて先生が問題や質問を出すなど、アイデア次第でいろいろ使えるよ。
      </p>

      {/* ===== スート選択 ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-3">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">使うカードの種類</div>
        <div className="flex flex-wrap gap-2">
          {SUITS.map(s => (
            <label key={s.key} className={`px-3 py-2 rounded-lg border-2 cursor-pointer text-sm transition-all ${
              enabled[s.key]
                ? "bg-brand-500 border-brand-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            }`}>
              <input
                type="checkbox"
                checked={enabled[s.key]}
                onChange={() => toggleSuit(s.key)}
                className="sr-only"
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      {/* ===== コントロール ===== */}
      <div className="flex flex-wrap gap-2 mb-4">
        {!confirmingReset ? (
          <button
            onClick={() => setConfirmingReset(true)}
            disabled={cardNums.length === 0}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold"
          >
            リセット
          </button>
        ) : (
          <div className="flex gap-1 items-center bg-red-50 dark:bg-red-950 rounded-lg p-1">
            <span className="text-xs text-red-700 dark:text-red-300 px-2">ぜんぶ裏に戻す？</span>
            <button onClick={reset} className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs font-bold">はい</button>
            <button onClick={() => setConfirmingReset(false)} className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 text-xs">いいえ</button>
          </div>
        )}

        {!confirmingSet ? (
          <button
            onClick={() => setConfirmingSet(true)}
            className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold"
          >
            セット
          </button>
        ) : (
          <div className="flex gap-1 items-center bg-brand-50 dark:bg-brand-950 rounded-lg p-1">
            <span className="text-xs text-brand-700 dark:text-brand-300 px-2">カードをならべる？</span>
            <button onClick={setCards} className="px-3 py-1 rounded bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold">はい</button>
            <button onClick={() => setConfirmingSet(false)} className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 text-xs">いいえ</button>
          </div>
        )}

        {cardNums.length > 0 && (
          <span className="ml-auto self-center text-sm text-gray-500 dark:text-gray-400">
            {cardNums.length}枚 / 表 {revealed.filter(Boolean).length}
          </span>
        )}
      </div>

      {/* ===== カードエリア ===== */}
      {cardNums.length === 0 ? (
        <p className="text-center text-gray-400 dark:text-gray-500 py-12 text-sm">
          上のチェックを選んで「セット」をおすと、カードがならぶよ。
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {cardNums.map((num, pos) => (
            <Card
              key={pos}
              num={num}
              isRevealed={revealed[pos]}
              onFlip={() => flipCard(pos)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------
// 1枚のカード（裏 ↔ 表 の 3D フリップ）
// -----------------------------------------------------
function Card({
  num,
  isRevealed,
  onFlip,
}: {
  num: number
  isRevealed: boolean
  onFlip: () => void
}) {
  return (
    <button
      onClick={onFlip}
      className="relative w-[68px] h-[96px] sm:w-[80px] sm:h-[112px]"
      style={{ perspective: 1000 }}
      aria-label={isRevealed ? `カード${num} 表` : "カード 裏"}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className="absolute inset-0 rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 bg-white"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Image
            src="/images/nandemo/cardura.png"
            alt="カード（裏）"
            fill
            className="object-cover"
            draggable={false}
            sizes="80px"
          />
        </div>
        <div
          className="absolute inset-0 rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 bg-white"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <Image
            src={`/images/nandemo/card${num}.png`}
            alt={`カード ${num}`}
            fill
            className="object-cover"
            draggable={false}
            sizes="80px"
          />
        </div>
      </div>
    </button>
  )
}
