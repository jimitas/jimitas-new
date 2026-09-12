// ======================================================
// BtnQuestion コンポーネント
//
// 「もんだい」ボタン。brand（緑・開始系）。
// 見た目の定義は Btn.tsx に集約してある。
// ======================================================

"use client"

import { FaQuestion } from "react-icons/fa6"
import { Btn } from "./Btn"

interface BtnQuestionProps {
  handleEvent: () => void
  btnText?: string
  disabled?: boolean
}

export function BtnQuestion({ handleEvent, btnText = "もんだい", disabled = false }: BtnQuestionProps) {
  return (
    <Btn
      color="brand"
      onClick={handleEvent}
      disabled={disabled}
      icon={<FaQuestion className="w-4 h-4 md:w-6 md:h-6" />}
      className="gap-1 m-2 p-2 w-24 md:w-32 md:text-base"
      centerWrapper
    >
      {btnText}
    </Btn>
  )
}
