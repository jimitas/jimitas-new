// ======================================================
// セクションの枠（番号つき見出し＋ひとこと）
// scroll-mt はページ内リンクで飛んだとき、上に固定されたヘッダーに隠れないようにするため。
// ======================================================

import type { ReactNode } from "react"

interface Props {
  id: string
  num: number
  title: string
  lead?: ReactNode
  children: ReactNode
}

export function Section({ id, num, title, lead, children }: Props) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 p-3 sm:p-5">
      <h2 id={`${id}-h`} className="flex items-baseline gap-2 text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
        <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-500 text-white text-lg">{num}</span>
        <span>{title}</span>
      </h2>
      {lead && <p className="mt-1 mb-3 text-sm sm:text-base text-gray-600 dark:text-gray-300">{lead}</p>}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}
