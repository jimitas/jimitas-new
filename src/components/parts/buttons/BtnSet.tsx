// ======================================================
// BtnSet コンポーネント
//
// 「セット」ボタン。
// 式の入力欄に入力した数値を問題としてセットするときに押す。
// ======================================================

"use client"

import { FaPenToSquare } from "react-icons/fa6"
import * as se from "@/lib/se"

interface BtnSetProps {
  handleEvent: () => void
}

export function BtnSet({ handleEvent }: BtnSetProps) {
  return (
    <div className="flex flex-wrap justify-center">
      <button
        onClick={() => { se.playSe(se.pi); handleEvent() }}
        className="flex justify-center items-center gap-1 font-bold m-2 p-2
                   w-20 md:w-24 text-sm md:text-base
                   bg-brand-400 hover:bg-brand-500 active:bg-brand-600
                   text-white border-2 border-brand-400
                   active:translate-y-0.5 transition-colors
                   rounded-lg shadow-sm"
      >
        <FaPenToSquare />
        セット
      </button>
    </div>
  )
}
