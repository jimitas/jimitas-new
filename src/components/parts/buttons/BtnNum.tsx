// ======================================================
// BtnNum コンポーネント
//
// 数字ボタン（0〜20）。
// モード②「ならべたかずはいくつ？」で使用する。
// ======================================================

"use client"

import * as se from "@/lib/se"

interface BtnNumProps {
  /** 表示する数字の配列（例: [0,1,2,...,10]） */
  ITEM: number[]
  /** ボタンを押したときに呼ばれるコールバック（押した数字を渡す） */
  handleEvent: (num: number) => void
}

export function BtnNum({ ITEM, handleEvent }: BtnNumProps) {
  return (
    <div className="h-12 md:h-16 container flex justify-center items-center flex-wrap bg-warm-50">
      {ITEM.map((num) => (
        <button
          key={num}
          value={num}
          onClick={() => { se.playSe(se.pi); handleEvent(num) }}
          className="m-0.5 sm:m-1 p-1 font-bold
                     w-7 sm:w-10 md:w-12
                     text-sm sm:text-base md:text-xl
                     bg-accent-400 hover:bg-accent-500 active:bg-accent-600
                     text-white border-2 border-accent-400
                     active:translate-y-0.5 transition-colors
                     rounded-lg shadow-sm"
        >
          {num}
        </button>
      ))}
    </div>
  )
}
