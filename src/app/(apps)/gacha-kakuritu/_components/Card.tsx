// ======================================================
// カードの枠 — このアプリの各セクション共通（角丸はカード用の12px）
// ======================================================

import type { ReactNode } from "react"

interface Props {
  title?: string
  /** タイトル行の右側に置くもの（集計セッション数など） */
  aside?: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ title, aside, children, className = "" }: Props) {
  return (
    <section
      className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 md:px-5 ${className}`}
    >
      {(title || aside) && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 mb-2">
          {title && <h2 className="font-bold text-gray-800 dark:text-gray-100">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  )
}
