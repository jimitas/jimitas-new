// ======================================================
// BtnStart コンポーネント
//
// 「スタート」ボタン。タイムアタック系アプリで使用。
// brand（緑）カラーで積極的なアクションを示す。
// ======================================================

"use client"

interface BtnStartProps {
  handleEvent: () => void
}

export function BtnStart({ handleEvent }: BtnStartProps) {
  return (
    <button
      onClick={handleEvent}
      className="flex justify-center items-center gap-1 font-bold m-2 p-2
                 w-24 md:w-32 text-sm md:text-base
                 border-brand-500 bg-brand-500 border-2 text-white
                 hover:bg-brand-600 active:translate-y-1
                 rounded-lg shadow-lg"
    >
      ▶ スタート
    </button>
  )
}
