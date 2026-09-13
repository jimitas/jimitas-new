// ======================================================
// BtnShowAnswer コンポーネント
//
// 「こたえをみる」ボタン。warm（オレンジ・ヒント系）。
// 見た目の定義は Btn.tsx に集約してある。
// ======================================================

"use client"

import { FaEye } from "react-icons/fa6"
import { Btn } from "./Btn"

interface BtnShowAnswerProps {
  handleEvent: () => void
  disabled?: boolean
}

export function BtnShowAnswer({ handleEvent, disabled = false }: BtnShowAnswerProps) {
  return (
    <Btn
      color="warm"
      onClick={handleEvent}
      disabled={disabled}
      icon={<FaEye />}
      className="gap-1 m-2 p-2 w-32 md:w-36 md:text-base"
    >
      こたえをみる
    </Btn>
  )
}
