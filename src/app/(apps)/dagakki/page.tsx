"use client"

// ======================================================
// 打楽器ボード（あそび用）
//
// 3つの打楽器（カスタネット・タンバリン・カウベル）の音が出せる
// シンプルなボタンボード。マルチタッチ対応で複数本指で同時に叩ける。
// 用途: 音楽の合間の遊び・ちょっとした効果音・リズム遊び。
//
// 絵文字に正規の「タンバリン」「カスタネット」が無いため、
// それらは白抜き SVG で簡易アイコンを描画。
// ======================================================

import { useState, useCallback } from "react"
import { useSound } from "@/hooks/useSound"

type Percussion = {
  id: string
  label: string
  file: string
  color: "rose" | "amber" | "lime"
}

const PERCUSSION: Percussion[] = [
  { id: "kasuta", label: "カスタネット", file: "kasuta", color: "rose" },
  { id: "tam",    label: "タンバリン",   file: "tam",    color: "amber" },
  { id: "cow",    label: "カウベル",     file: "cow",    color: "lime" },
]

const COLOR_CLASSES: Record<Percussion["color"], string> = {
  rose:  "bg-rose-500 hover:bg-rose-600 active:bg-rose-700 border-rose-600",
  amber: "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 border-amber-600",
  lime:  "bg-lime-500 hover:bg-lime-600 active:bg-lime-700 border-lime-600",
}

// -----------------------------------------------------
// SVG アイコン（白抜き：色付きボタン上で視認できる）
// -----------------------------------------------------
function CastanetIcon() {
  return (
    <svg viewBox="0 0 40 40" className="w-12 h-12" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="14" cy="13" rx="9" ry="5.5" />
      <ellipse cx="26" cy="27" rx="9" ry="5.5" />
      <line x1="6" y1="8" x2="6" y2="18" />
    </svg>
  )
}

function TambourineIcon() {
  return (
    <svg viewBox="0 0 40 40" className="w-12 h-12" fill="none" stroke="white" strokeWidth={2.5} strokeLinejoin="round">
      <circle cx="20" cy="20" r="15" />
      <circle cx="20" cy="20" r="9" strokeWidth={1.5} />
      <circle cx="20" cy="3.5" r="2" fill="white" strokeWidth={1.5} />
      <circle cx="36.5" cy="20" r="2" fill="white" strokeWidth={1.5} />
      <circle cx="20" cy="36.5" r="2" fill="white" strokeWidth={1.5} />
      <circle cx="3.5" cy="20" r="2" fill="white" strokeWidth={1.5} />
    </svg>
  )
}

function PercussionIcon({ id }: { id: string }) {
  if (id === "kasuta") return <CastanetIcon />
  if (id === "tam")    return <TambourineIcon />
  return <span className="text-5xl leading-none">🔔</span>
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

      <div className="grid grid-cols-3 gap-3">
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
        py-8 px-3 font-bold transition-all duration-100
        ${isPressed ? "scale-95 shadow-inner" : "hover:-translate-y-0.5 hover:shadow-lg"}
      `}
    >
      <div className="flex items-center justify-center h-14 mb-2">
        <PercussionIcon id={p.id} />
      </div>
      <div className="text-base">{p.label}</div>
    </button>
  )
}
