"use client"

// ======================================================
// 打楽器ボード（あそび用）
//
// 3つの打楽器（カスタネット・タンバリン・カウベル）の音が出せる
// シンプルなボタンボード。マルチタッチ対応で複数本指で同時に叩ける。
// 用途: 音楽の合間の遊び・ちょっとした効果音・リズム遊び。
//
// アイコンはイラスト画像（public/images/dagakki/*.png）。
// ======================================================

import { useState, useCallback } from "react"
import Image from "next/image"
import { useSound } from "@/hooks/useSound"

type Percussion = {
  id: string
  label: string
  file: string         // 音声ファイル名（拡張子なし）
  image: string        // /images/dagakki/*.png
  color: "rose" | "amber" | "lime"
}

const PERCUSSION: Percussion[] = [
  { id: "kasuta", label: "カスタネット", file: "kasuta", image: "/images/dagakki/kasuta-v2.png", color: "rose" },
  { id: "tam",    label: "タンバリン",   file: "tam",    image: "/images/dagakki/tam.png",    color: "amber" },
  { id: "cow",    label: "カウベル",     file: "cow",    image: "/images/dagakki/cow.png",    color: "lime" },
]

const COLOR_CLASSES: Record<Percussion["color"], string> = {
  rose:  "bg-rose-100 dark:bg-rose-900 hover:bg-rose-200 dark:hover:bg-rose-800 active:bg-rose-300 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100",
  amber: "bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 dark:hover:bg-amber-800 active:bg-amber-300 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100",
  lime:  "bg-lime-100 dark:bg-lime-900 hover:bg-lime-200 dark:hover:bg-lime-800 active:bg-lime-300 border-lime-300 dark:border-lime-700 text-lime-900 dark:text-lime-100",
}

export default function DagakkiPage() {
  const { play } = useSound()
  const [pressed, setPressed] = useState<Set<string>>(new Set())

  const handleHit = useCallback((p: Percussion) => {
    play(`/sounds/percussion/${p.file}.mp3`, 0.8)
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

      <div className="grid grid-cols-3 gap-4">
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
        rounded-2xl border-2 shadow-md
        py-6 px-3 font-bold transition-all duration-100
        ${isPressed ? "scale-95 shadow-inner" : "hover:-translate-y-0.5 hover:shadow-lg"}
      `}
    >
      <div className="flex items-center justify-center h-28 mb-2">
        <Image
          src={p.image}
          alt={p.label}
          width={140}
          height={112}
          className="object-contain max-h-full w-auto"
          draggable={false}
          priority
        />
      </div>
      <div className="text-base">{p.label}</div>
    </button>
  )
}
