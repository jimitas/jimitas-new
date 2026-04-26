// ======================================================
// BtnUndo コンポーネント
//
// リセット（元に戻す・もどす）ボタン。
// アイコンは Font Awesome CDN（fa-solid fa-rotate-left）を使用。
// 配色: danger（赤系）— リセット・破壊的アクションの統一トークン。
// 詳細は docs/06_配色設計.md 参照。
// ======================================================

"use client"

import * as se from "@/lib/se"

interface BtnUndoProps {
  handleEvent: () => void
}

export function BtnUndo({ handleEvent }: BtnUndoProps) {
  return (
    <div className="flex flex-wrap justify-center">
      <button
        onClick={() => { se.playSe(se.pi); handleEvent() }}
        className="flex justify-center items-center font-bold m-2 p-2
                   w-10 h-12 md:w-12 text-sm md:text-base
                   bg-danger-400 hover:bg-danger-500 active:bg-danger-600
                   text-white border-2 border-danger-400
                   active:translate-y-0.5 transition-colors
                   rounded-lg shadow-sm"
      >
        {/* Font Awesome CDN: 巻き戻しアイコン */}
        <i className="fa-solid fa-rotate-left w-4 h-4 md:w-6 md:h-6" />
      </button>
    </div>
  )
}
