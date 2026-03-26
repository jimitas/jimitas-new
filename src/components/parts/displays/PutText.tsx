// ======================================================
// PutText コンポーネント
//
// メッセージ表示エリア。
// 「もんだい」「せいかい」「ちがうよ」などのテキストを表示する。
// el_text は ref で受け取り、innerHTML を直接書き換えて使う。
// ======================================================

"use client"

import { RefObject } from "react"

interface PutTextProps {
  el_text: RefObject<HTMLDivElement | null>
}

export function PutText({ el_text }: PutTextProps) {
  return (
    <div className="w-full flex justify-center items-center">
      <div
        ref={el_text}
        className="container flex justify-center items-center
                   h-12 my-3 p-3
                   text-black bg-yellow-100
                   text-xl md:text-2xl lg:text-3xl font-bold"
      />
    </div>
  )
}
