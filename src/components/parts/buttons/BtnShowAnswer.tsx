// ======================================================
// BtnShowAnswer コンポーネント
//
// 「こたえをみる」ボタン。
// 問題の正解を答え欄に表示する。
// Font Awesome は CDN 方式（<i> タグ）を使用。
// ======================================================

"use client"

import * as se from "@/lib/se"

interface BtnShowAnswerProps {
  handleEvent: () => void
}

export function BtnShowAnswer({ handleEvent }: BtnShowAnswerProps) {
  return (
    <div className="flex flex-wrap justify-center">
      <button
        onClick={() => { se.playSe(se.pi); handleEvent() }}
        className="flex justify-center items-center gap-1 font-bold m-2 p-2
                   w-32 md:w-36 text-sm md:text-base
                   bg-warm-400 hover:bg-warm-500 active:bg-warm-600
                   text-white border-2 border-warm-400
                   active:translate-y-0.5 transition-colors
                   rounded-lg shadow-sm"
      >
        {/* fa-eye: 答えを見せる */}
        <i className="fa-solid fa-eye" />
        こたえをみる
      </button>
    </div>
  )
}
