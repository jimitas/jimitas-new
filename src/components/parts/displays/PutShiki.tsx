// ======================================================
// PutShiki コンポーネント
//
// たしざんの式（左数 ＋ 右数 ＝ 答え）を表示・入力するエリア。
// 「もんだい」で左・右の input が自動入力される。
// 「セット」では左・右の input を手動で入力する。
// ======================================================

"use client"

import { RefObject } from "react"

interface PutShikiProps {
  /** たされる数の入力欄（自動入力・手動入力兼用） */
  el_left_input: RefObject<HTMLInputElement | null>
  /** たす数の入力欄（自動入力・手動入力兼用） */
  el_right_input: RefObject<HTMLInputElement | null>
  /** 答えの入力欄 */
  el_answer: RefObject<HTMLInputElement | null>
  /** 演算子（たしざんは "+"） */
  kigo: string
}

export function PutShiki({ el_left_input, el_right_input, el_answer, kigo }: PutShikiProps) {
  return (
    <div className="flex justify-center items-center">
      {/* たされる数 */}
      <input
        ref={el_left_input}
        type="number"
        min="0"
        max="20"
        step="1"
        className="h-[max(3vw,30px)] w-[max(4vw,42px)] text-[max(2vw,20px)]
                   text-center font-bold m-[5px] px-[5px]
                   text-brand-700 border-2 border-brand-600 bg-white rounded-[10%] cursor-pointer"
      />
      {/* 演算子（＋） */}
      <span className="h-[max(3vw,30px)] text-[max(2vw,20px)] font-bold px-1">
        {kigo}
      </span>
      {/* たす数 */}
      <input
        ref={el_right_input}
        type="number"
        min="0"
        max="20"
        step="1"
        className="h-[max(3vw,30px)] w-[max(4vw,42px)] text-[max(2vw,20px)]
                   text-center font-bold m-[5px] px-[5px]
                   text-brand-700 border-2 border-brand-600 bg-white rounded-[10%] cursor-pointer"
      />
      {/* ＝ */}
      <span className="h-[max(3vw,30px)] text-[max(2vw,20px)] font-bold px-1">
        ＝
      </span>
      {/* 答え */}
      <input
        ref={el_answer}
        type="number"
        min="0"
        max="40"
        step="1"
        className="h-[max(3vw,30px)] w-[max(4vw,42px)] text-[max(2vw,20px)]
                   text-center font-bold m-[5px] px-[5px]
                   text-brand-700 border-2 border-brand-600 bg-white rounded-[10%] cursor-pointer"
      />
    </div>
  )
}
