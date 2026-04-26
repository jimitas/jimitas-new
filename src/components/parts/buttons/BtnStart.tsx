// ======================================================
// BtnStart コンポーネント
//
// 「スタート」ボタン。タイムアタック系アプリで使用。
// brand（緑）カラーで積極的なアクションを示す。
// 配色: -400 ベース白抜き（docs/06_配色設計.md の新標準に準拠）
// ======================================================

"use client"

import * as se from "@/lib/se"

interface BtnStartProps {
  handleEvent: () => void
}

export function BtnStart({ handleEvent }: BtnStartProps) {
  return (
    <button
      onClick={() => { se.playSe(se.pi); handleEvent() }}
      className="flex justify-center items-center gap-1 font-bold m-2 p-2
                 w-24 md:w-32 text-sm md:text-base
                 bg-brand-400 hover:bg-brand-500 active:bg-brand-600
                 text-white border-2 border-brand-400
                 active:translate-y-0.5 transition-colors
                 rounded-lg shadow-sm"
    >
      ▶ スタート
    </button>
  )
}
