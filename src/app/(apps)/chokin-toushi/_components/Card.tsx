// ======================================================
// カードの枠 — このアプリの各セクション共通（角丸はカード用の12px）
// gacha-kakuritu/_components/Card.tsx と同じ形。
// 3本目のアプリで使うときは parts/ へ引き上げる候補。
// ======================================================

import type { ReactNode } from "react"

interface Props {
  title?: string
  children: ReactNode
  className?: string
}

export function Card({ title, children, className = "" }: Props) {
  return (
    <section
      className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 md:px-5 ${className}`}
    >
      {title && <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h2>}
      {children}
    </section>
  )
}
