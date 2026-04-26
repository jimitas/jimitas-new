"use client"

// ======================================================
// 打楽器ボード（あそび用）
//
// いろいろな音が出せるシンプルなボタンボード。
// マルチタッチ対応で複数本指で同時に叩ける。
// 用途: 音楽の合間の遊び・ちょっとした効果音・リズム遊び。
//
// 絵文字に正規の「タンバリン」「カスタネット」が無いため、
// それらは白抜き SVG で簡易アイコンを描画。和太鼓は 🪘（長太鼓）を使用。
// ======================================================

import { useState, useCallback } from "react"
import { useSound } from "@/hooks/useSound"

type Percussion = {
  id: string
  label: string
  file: string
  color: "warm" | "brand" | "rose" | "amber" | "lime" | "violet" | "sky"
}

// 7つの音（あえてジャンル分けせず横並びに）
const PERCUSSION: Percussion[] = [
  { id: "kasuta", label: "カスタネット", file: "kasuta", color: "rose" },
  { id: "tam",    label: "タンバリン",   file: "tam",    color: "amber" },
  { id: "cow",    label: "カウベル",     file: "cow",    color: "lime" },
  { id: "don",    label: "ドン",         file: "don",    color: "warm" },
  { id: "dodon",  label: "ドドン",       file: "dodon",  color: "warm" },
  { id: "ka",     label: "カ",           file: "ka",     color: "brand" },
  { id: "kaka",   label: "カカ",         file: "kaka",   color: "brand" },
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

// -----------------------------------------------------
// SVG アイコン（白抜き：どの色のボタン上でも視認できる）
// -----------------------------------------------------
function CastanetIcon() {
  return (
    <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      {/* 上の貝、下の貝、つなぎひも */}
      <ellipse cx="14" cy="13" rx="9" ry="5.5" />
      <ellipse cx="26" cy="27" rx="9" ry="5.5" />
      <line x1="6" y1="8" x2="6" y2="18" />
    </svg>
  )
}

function TambourineIcon() {
  return (
    <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none" stroke="white" strokeWidth={2.5} strokeLinejoin="round">
      {/* 外周＋内側の皮 */}
      <circle cx="20" cy="20" r="15" />
      <circle cx="20" cy="20" r="9" strokeWidth={1.5} />
      {/* ジングル（鈴）4個 */}
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
  if (id === "cow")    return <span className="text-4xl leading-none">🔔</span>
  // don/dodon/ka/kaka は和太鼓系 → 🪘（長太鼓・タイコに近い）
  return <span className="text-4xl leading-none">🪘</span>
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
      <div className="flex items-center justify-center h-12 mb-1">
        <PercussionIcon id={p.id} />
      </div>
      <div className="text-sm">{p.label}</div>
    </button>
  )
}
