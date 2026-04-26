// ======================================================
// BtnStop コンポーネント
//
// 「ストップ」ボタン。タイムアタック系アプリで使用。
// 配色: danger（赤系）— 停止・破壊的アクションの統一トークン。
// 詳細は docs/06_配色設計.md 参照。
// ======================================================

"use client"

import * as se from "@/lib/se"

interface BtnStopProps {
  handleEvent: () => void
}

export function BtnStop({ handleEvent }: BtnStopProps) {
  return (
    <button
      onClick={() => { se.playSe(se.pi); handleEvent() }}
      className="flex justify-center items-center gap-1 font-bold m-2 p-2
                 w-24 md:w-32 text-sm md:text-base
                 bg-danger-400 hover:bg-danger-500 active:bg-danger-600
                 text-white border-2 border-danger-400
                 active:translate-y-0.5 transition-colors
                 rounded-lg shadow-sm"
    >
      ■ ストップ
    </button>
  )
}
