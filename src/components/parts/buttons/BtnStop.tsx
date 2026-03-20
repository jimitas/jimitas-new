// ======================================================
// BtnStop コンポーネント
//
// 「ストップ」ボタン。タイムアタック系アプリで使用。
// warm（オレンジ）カラーで停止アクションを示す。
// ======================================================

"use client"

interface BtnStopProps {
  handleEvent: () => void
}

export function BtnStop({ handleEvent }: BtnStopProps) {
  return (
    <button
      onClick={handleEvent}
      className="flex justify-center items-center gap-1 font-bold m-2 p-2
                 w-24 md:w-32 text-sm md:text-base
                 border-warm-500 bg-warm-500 border-2 text-white
                 hover:bg-warm-600 active:translate-y-1
                 rounded-lg shadow-lg"
    >
      ■ ストップ
    </button>
  )
}
