// ======================================================
// BtnCheck コンポーネント
//
// 「たしかめ」または「こたえあわせ」ボタン。
// アイコンは Font Awesome CDN（fa-solid fa-check）を使用。
// ======================================================

"use client"

interface BtnCheckProps {
  handleEvent: () => void
  btnText?: string
}

export function BtnCheck({ handleEvent, btnText = "こたえあわせ" }: BtnCheckProps) {
  return (
    <div className="flex flex-wrap justify-center">
      <button
        onClick={handleEvent}
        className="flex justify-center items-center gap-1 font-bold m-2 p-2
                   w-32 md:w-36 text-sm md:text-base
                   border-red-300 bg-white border-2 text-red-400
                   hover:bg-red-500 hover:text-white active:translate-y-1
                   rounded-lg shadow-lg"
      >
        {/* Font Awesome CDN: チェックマークアイコン */}
        <i className="fa-solid fa-check w-4 h-4 md:w-6 md:h-6" />
        {btnText}
      </button>
    </div>
  )
}
