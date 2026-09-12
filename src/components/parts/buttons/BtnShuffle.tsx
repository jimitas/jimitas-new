// ======================================================
// BtnShuffle コンポーネント
//
// 「シャッフル」ボタン。accent（青・変化系）。
// 見た目の定義は Btn.tsx に集約してある。
// ※ この部品は外側のラッパー div を持たない（横に並べて使える）。
// ======================================================

"use client"

import { FaShuffle } from "react-icons/fa6"
import { Btn } from "./Btn"

interface BtnShuffleProps {
  handleEvent: () => void
  btnText?: string
}

export function BtnShuffle({ handleEvent, btnText = "シャッフル" }: BtnShuffleProps) {
  return (
    <Btn
      color="accent"
      onClick={handleEvent}
      icon={<FaShuffle />}
      className="gap-1 m-2 p-2 w-28 md:w-36 md:text-base"
    >
      {btnText}
    </Btn>
  )
}
