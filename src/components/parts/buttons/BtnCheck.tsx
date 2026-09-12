// ======================================================
// BtnCheck コンポーネント
//
// 「たしかめ」または「こたえあわせ」ボタン。accent（青・判定系）。
// 見た目の定義は Btn.tsx に集約してある。
// ======================================================

"use client"

import { FaCheck } from "react-icons/fa6"
import { Btn } from "./Btn"

interface BtnCheckProps {
  handleEvent: () => void
  btnText?: string
  disabled?: boolean
}

export function BtnCheck({ handleEvent, btnText = "こたえあわせ", disabled = false }: BtnCheckProps) {
  return (
    <Btn
      color="accent"
      onClick={handleEvent}
      disabled={disabled}
      icon={<FaCheck className="w-4 h-4 md:w-6 md:h-6" />}
      className="gap-1 m-2 p-2 w-32 md:w-36 md:text-base"
      centerWrapper
    >
      {btnText}
    </Btn>
  )
}
