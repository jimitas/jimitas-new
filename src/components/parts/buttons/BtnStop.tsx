// ======================================================
// BtnStop コンポーネント
//
// 「ストップ」ボタン。タイムアタック系アプリで使用。
// danger（赤系）— 停止・破壊的アクションの統一トークン。
// 見た目の定義は Btn.tsx に集約してある。
// ※ この部品は外側のラッパー div を持たない（横に並べて使える）。
// ======================================================

"use client"

import { Btn } from "./Btn"

interface BtnStopProps {
  handleEvent: () => void
}

export function BtnStop({ handleEvent }: BtnStopProps) {
  return (
    <Btn
      color="danger"
      onClick={handleEvent}
      className="gap-1 m-2 p-2 w-24 md:w-32 md:text-base"
    >
      ■ ストップ
    </Btn>
  )
}
