// ======================================================
// BtnSet コンポーネント
//
// 「セット」ボタン。
// 式の入力欄に入力した数値を問題としてセットするときに押す。
// Font Awesome は CDN 方式（<i> タグ）を使用。
// ======================================================

"use client"

interface BtnSetProps {
  handleEvent: () => void
}

export function BtnSet({ handleEvent }: BtnSetProps) {
  return (
    <div className="flex flex-wrap justify-center">
      <button
        onClick={handleEvent}
        className="flex justify-center items-center gap-1 font-bold m-2 p-2
                   w-20 md:w-24 text-sm md:text-base
                   border-red-300 bg-white border-2 text-red-400
                   hover:bg-red-500 hover:text-white active:translate-y-1
                   rounded-lg shadow-lg"
      >
        {/* fa-pen-to-square: FA6 での fa-user-edit 相当 */}
        <i className="fa-solid fa-pen-to-square" />
        セット
      </button>
    </div>
  )
}
