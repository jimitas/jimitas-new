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

import { useState, useCallback, useEffect } from "react"
import { useSound } from "@/hooks/useSound"
import { BtnConfirm } from "@/components/parts/buttons/BtnConfirm"

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
  // 初期値は固定（昇順）にして hydration 不一致を回避し、マウント後にシャッフル
  const [cardOrder, setCardOrder] = useState<number[]>(
    () => Array.from({ length: NUM_CARDS }, (_, i) => i)
  )
  // 各位置の表/裏。true = 表（くだものが見える）
  const [revealed, setRevealed] = useState<boolean[]>(Array(NUM_CARDS).fill(false))
  // ひだり/みぎラベルの色（true で赤、false で透明）
  const [hintOn, setHintOn] = useState(false)
  const { play } = useSound()

  // マウント後にクライアント側でシャッフル（SSR 結果と CSR 結果が一致するように）
  useEffect(() => {
    // SSR/hydration の安全のために useEffect 内で setState する意図的な実装。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCardOrder(shuffle())
  }, [])

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
  }

  // ----- りせっと: 最初の状態に戻す（並び再シャッフル + 裏返し + ヒントOFF） -----
  const reset = () => {
    play("/sounds/eawase/se_3.mp3", 0.5)
    setCardOrder(shuffle())
    setRevealed(Array(NUM_CARDS).fill(false))
    setHintOn(false)
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
        <BtnConfirm
          label="りせっと"
          color="danger"
          promptLabel="さいしょから？"
          yesColor="danger"
          onConfirm={reset}
        />

        <BtnConfirm
          label="せっと"
          color="brand"
          promptLabel="カードをならべる？"
          yesColor="brand"
          onConfirm={setCards}
        />

        {/* ひんと: OFF時は brand（緑、開始系）、ON時は warm（オレンジ、補助系） */}
        <button
          onClick={toggleHint}
          className={`px-3 py-2 font-bold text-sm rounded-lg shadow-sm
                      active:translate-y-0.5 transition-colors text-white border-2 ${
            hintOn
              ? "bg-warm-400 hover:bg-warm-500 active:bg-warm-600 border-warm-400"
              : "bg-brand-400 hover:bg-brand-500 active:bg-brand-600 border-brand-400"
          }`}
        >
          ひんと
        </button>
      </div>

      {/* ===== ひだり / みぎ ラベル ===== */}
      {/* カードと同じ横幅で左右両端に配置（max-w を外して全幅で揃える） */}
      <div className="flex justify-between items-center px-2 mb-2">
        <h3 className={`text-2xl font-bold transition-colors ${hintOn ? "text-red-500" : "text-transparent select-none"}`}>
          ひだり
        </h3>
        <h3 className={`text-2xl font-bold transition-colors ${hintOn ? "text-red-500" : "text-transparent select-none"}`}>
          みぎ
        </h3>
      </div>

      {/* ===== カードエリア ===== */}
      {/* 「左から何番目」の練習のため、必ず10枚を横一列に並べる */}
      {/* flex-1 で10等分・aspect-[5/7] でアスペクト比維持・flex-wrap なし */}
      <div className="flex gap-1 sm:gap-2">
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
  // <button> 内では transform-style: preserve-3d が効かないブラウザがあるため
  // <div role="button"> でクリック・キーボード操作を扱う
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onFlip()
        }
      }}
      // flex-1 で10等分・aspect-[5/7] でカードのアスペクト比を維持・min-w-0 で flex 内で縮小可能に
      className="relative flex-1 min-w-0 aspect-[5/7] select-none"
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/eawase/cardura.png"
            alt="カード（裏）"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
        {/* 表面 */}
        <div
          className="absolute inset-0 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/images/eawase/${imageIndex}.png`}
            alt={`カード ${imageIndex}`}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}
