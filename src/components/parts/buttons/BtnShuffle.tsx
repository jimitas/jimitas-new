// ======================================================
// BtnShuffle コンポーネント
//
// 「シャッフル」ボタン。並び順をランダムに変えるときに使用。
// accent（青）カラーで変化アクションを示す。
// ======================================================

"use client"

import { FaShuffle } from "react-icons/fa6"
import * as se from "@/lib/se"

interface BtnShuffleProps {
  handleEvent: () => void
  btnText?: string
}

export function BtnShuffle({ handleEvent, btnText = "シャッフル" }: BtnShuffleProps) {
  return (
    <button
      onClick={() => { se.playSe(se.pi); handleEvent() }}
      className="flex justify-center items-center gap-1 font-bold m-2 p-2
                 w-28 md:w-36 text-sm md:text-base
                 bg-accent-400 hover:bg-accent-500 active:bg-accent-600
                 text-white border-2 border-accent-400
                 active:translate-y-0.5 transition-colors
                 rounded-lg shadow-sm"
    >
      <FaShuffle />
      {btnText}
    </button>
  )
}
