// ======================================================
// BtnShowAnswer コンポーネント
//
// 「こたえをみる」ボタン。
// 問題の正解を答え欄に表示する。
// Font Awesome は CDN 方式（<i> タグ）を使用。
// ======================================================

"use client"

interface BtnShowAnswerProps {
  handleEvent: () => void
}

export function BtnShowAnswer({ handleEvent }: BtnShowAnswerProps) {
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
        {/* fa-eye: 答えを見せる */}
        <i className="fa-solid fa-eye" />
        こたえをみる
      </button>
    </div>
  )
}
