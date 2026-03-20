// ======================================================
// BtnUndo コンポーネント
//
// リセット（元に戻す）ボタン。
// アイコンは Font Awesome CDN（fa-solid fa-rotate-left）を使用。
// ======================================================

"use client"

interface BtnUndoProps {
  handleEvent: () => void
}

export function BtnUndo({ handleEvent }: BtnUndoProps) {
  return (
    <div className="flex flex-wrap justify-center">
      <button
        onClick={handleEvent}
        className="flex justify-center items-center font-bold m-2 p-2
                   w-10 h-12 md:w-12 text-sm md:text-base
                   border-brand-300 bg-white border-2 text-brand-500
                   hover:bg-brand-500 hover:text-white active:translate-y-1
                   rounded-lg shadow-lg"
      >
        {/* Font Awesome CDN: 巻き戻しアイコン */}
        <i className="fa-solid fa-rotate-left w-4 h-4 md:w-6 md:h-6" />
      </button>
    </div>
  )
}
