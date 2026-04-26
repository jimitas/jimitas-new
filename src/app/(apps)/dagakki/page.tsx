"use client"

// ======================================================
// 打楽器ボード（あそび用）
//
// いろいろな音が出せるシンプルなボタンボード。
// マルチタッチ対応で複数本指で同時に叩ける。
// 用途: 音楽の合間の遊び・ちょっとした効果音・リズム遊び。
// ======================================================

import { useState, useCallback } from "react"
import { useSound } from "@/hooks/useSound"

type Percussion = {
  id: string
  label: string
  emoji: string
  file: string
  color: "warm" | "brand" | "rose" | "amber" | "lime" | "violet" | "sky"
}

// 7つの音（あえてジャンル分けせず横並びに）
const PERCUSSION: Percussion[] = [
  { id: "kasuta", label: "カスタネット", emoji: "🥁", file: "kasuta", color: "rose" },
  { id: "tam",    label: "タンバリン",   emoji: "🪇",  file: "tam",    color: "amber" },
  { id: "cow",    label: "カウベル",     emoji: "🔔",  file: "cow",    color: "lime" },
  { id: "don",    label: "ドン",         emoji: "🥁", file: "don",    color: "warm" },
  { id: "dodon",  label: "ドドン",       emoji: "🥁", file: "dodon",  color: "warm" },
  { id: "ka",     label: "カ",           emoji: "🥁", file: "ka",     color: "brand" },
  { id: "kaka",   label: "カカ",         emoji: "🥁", file: "kaka",   color: "brand" },
]

// 色ごとのクラス（Tailwind の動的クラスを完全展開）
const COLOR_CLASSES: Record<Percussion["color"], string> = {
  warm:    "bg-warm-500 hover:bg-warm-600 active:bg-warm-700 border-warm-600",
  brand:   "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 border-brand-600",
  rose:    "bg-rose-500 hover:bg-rose-600 active:bg-rose-700 border-rose-600",
  amber:   "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 border-amber-600",
  lime:    "bg-lime-500 hover:bg-lime-600 active:bg-lime-700 border-lime-600",
  violet:  "bg-violet-500 hover:bg-violet-600 active:bg-violet-700 border-violet-600",
  sky:     "bg-sky-500 hover:bg-sky-600 active:bg-sky-700 border-sky-600",
}

export default function DagakkiPage() {
  const { play } = useSound()
  const [pressed, setPressed] = useState<Set<string>>(new Set())

  const handleHit = useCallback((p: Percussion) => {
    play(`/sounds/percussion/${p.file}.mp3`, 0.8)
    // 視覚フィードバック（150ms ハイライト）
    setPressed(prev => new Set(prev).add(p.id))
    setTimeout(() => {
      setPressed(prev => {
        const next = new Set(prev)
        next.delete(p.id)
        return next
      })
    }, 150)
  }, [play])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        打楽器ボード
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        ボタンをタップすると、いろいろな音が出せるよ。タブレットなら何本指でも同時にOK。
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PERCUSSION.map(p => (
          <PercussionButton
            key={p.id}
            p={p}
            isPressed={pressed.has(p.id)}
            onHit={() => handleHit(p)}
          />
        ))}
      </div>
    </div>
  )
}

// -----------------------------------------------------
// 打楽器ボタン
// -----------------------------------------------------
function PercussionButton({
  p,
  isPressed,
  onHit,
}: {
  p: Percussion
  isPressed: boolean
  onHit: () => void
}) {
  return (
    <button
      onPointerDown={onHit}
      className={`
        ${COLOR_CLASSES[p.color]}
        text-white rounded-2xl border-2 shadow-md
        py-6 px-3 font-bold transition-all duration-100
        ${isPressed ? "scale-95 shadow-inner" : "hover:-translate-y-0.5 hover:shadow-lg"}
      `}
    >
      <div className="text-4xl mb-1">{p.emoji}</div>
      <div className="text-sm">{p.label}</div>
    </button>
  )
}
