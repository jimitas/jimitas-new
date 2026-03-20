// ======================================================
// BtnShuffle コンポーネント
//
// 「シャッフル」ボタン。並び順をランダムに変えるときに使用。
// accent（青）カラーで変化アクションを示す。
// ======================================================

"use client"

interface BtnShuffleProps {
  handleEvent: () => void
  btnText?: string
}

export function BtnShuffle({ handleEvent, btnText = "シャッフル" }: BtnShuffleProps) {
  return (
    <button
      onClick={handleEvent}
      className="flex justify-center items-center gap-1 font-bold m-2 p-2
                 w-28 md:w-36 text-sm md:text-base
                 border-accent-500 bg-white border-2 text-accent-600
                 hover:bg-accent-500 hover:text-white active:translate-y-1
                 rounded-lg shadow-lg"
    >
      {/* Font Awesome CDN: シャッフルアイコン */}
      <i className="fa-solid fa-shuffle" />
      {btnText}
    </button>
  )
}
