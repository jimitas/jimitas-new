// ======================================================
// BtnSet コンポーネント
//
// 「セット」ボタン。brand（緑・確定系）。
// 見た目の定義は Btn.tsx に集約してある。
// ======================================================

"use client"

import { FaPenToSquare } from "react-icons/fa6"
import { Btn } from "./Btn"

interface BtnSetProps {
  handleEvent: () => void
}

export function BtnSet({ handleEvent }: BtnSetProps) {
  return (
    <Btn
      color="brand"
      onClick={handleEvent}
      icon={<FaPenToSquare />}
      className="gap-1 m-2 p-2 w-20 md:w-24 md:text-base"
    >
      セット
    </Btn>
  )
}
