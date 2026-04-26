// ======================================================
// BtnCheck コンポーネント
//
// 「たしかめ」または「こたえあわせ」ボタン。
// アイコンは Font Awesome CDN（fa-solid fa-check）を使用。
// ======================================================

"use client"

import * as se from "@/lib/se"

interface BtnCheckProps {
  handleEvent: () => void
  btnText?: string
}

export function BtnCheck({ handleEvent, btnText = "こたえあわせ" }: BtnCheckProps) {
  return (
    <div className="flex flex-wrap justify-center">
      <button
        onClick={() => { se.playSe(se.pi); handleEvent() }}
        className="flex justify-center items-center gap-1 font-bold m-2 p-2
                   w-32 md:w-36 text-sm md:text-base
                   bg-accent-400 hover:bg-accent-500 active:bg-accent-600
                   text-white border-2 border-accent-400
                   active:translate-y-0.5 transition-colors
                   rounded-lg shadow-sm"
      >
        {/* Font Awesome CDN: チェックマークアイコン */}
        <i className="fa-solid fa-check w-4 h-4 md:w-6 md:h-6" />
        {btnText}
      </button>
    </div>
  )
}
