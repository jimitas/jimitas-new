// ======================================================
// BtnQuestion コンポーネント
//
// 「もんだい」ボタン。
// アイコンは Font Awesome CDN（fa-solid fa-question）を使用。
// ======================================================

"use client"

interface BtnQuestionProps {
  handleEvent: () => void
  btnText?: string
}

export function BtnQuestion({ handleEvent, btnText = "もんだい" }: BtnQuestionProps) {
  return (
    <div className="flex flex-wrap justify-center">
      <button
        onClick={handleEvent}
        className="flex justify-center items-center gap-1 font-bold m-2 p-2
                   w-24 md:w-32 text-sm md:text-base
                   border-red-300 bg-white border-2 text-red-400
                   hover:bg-red-500 hover:text-white active:translate-y-1
                   rounded-lg shadow-lg"
      >
        {/* Font Awesome CDN: はてなマークアイコン */}
        <i className="fa-solid fa-question w-4 h-4 md:w-6 md:h-6" />
        {btnText}
      </button>
    </div>
  )
}
