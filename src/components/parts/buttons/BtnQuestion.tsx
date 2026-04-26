// ======================================================
// BtnQuestion コンポーネント
//
// 「もんだい」ボタン。
// アイコンは Font Awesome CDN（fa-solid fa-question）を使用。
// ======================================================

"use client"

import * as se from "@/lib/se"

interface BtnQuestionProps {
  handleEvent: () => void
  btnText?: string
  disabled?: boolean
}

export function BtnQuestion({ handleEvent, btnText = "もんだい", disabled = false }: BtnQuestionProps) {
  return (
    <div className="flex flex-wrap justify-center">
      <button
        onClick={() => { se.playSe(se.pi); handleEvent() }}
        disabled={disabled}
        className="flex justify-center items-center gap-1 font-bold m-2 p-2
                   w-24 md:w-32 text-sm md:text-base
                   bg-brand-400 hover:bg-brand-500 active:bg-brand-600
                   text-white border-2 border-brand-400
                   active:translate-y-0.5 transition-colors
                   rounded-lg shadow-sm
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0"
      >
        {/* Font Awesome CDN: はてなマークアイコン */}
        <i className="fa-solid fa-question w-4 h-4 md:w-6 md:h-6" />
        {btnText}
      </button>
    </div>
  )
}
