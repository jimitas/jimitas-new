// ======================================================
// BtnStart コンポーネント
//
// 「スタート」ボタン。タイムアタック系アプリで使用。
// brand（緑）カラーで積極的なアクションを示す。
// 見た目の定義は Btn.tsx に集約してある。
// ※ この部品は外側のラッパー div を持たない（横に並べて使える）。
// ======================================================

"use client"

import { Btn } from "./Btn"

interface BtnStartProps {
  handleEvent: () => void
}

export function BtnStart({ handleEvent }: BtnStartProps) {
  return (
    <Btn
      color="brand"
      onClick={handleEvent}
      className="gap-1 m-2 p-2 w-24 md:w-32 md:text-base"
    >
      ▶ スタート
    </Btn>
  )
}
