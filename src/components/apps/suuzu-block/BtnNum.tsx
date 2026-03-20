// ======================================================
// BtnNum コンポーネント
//
// 数字ボタン（0〜20）。
// モード②「ならべたかずはいくつ？」で使用する。
// ======================================================

"use client"

interface BtnNumProps {
  /** 表示する数字の配列（例: [0,1,2,...,10]） */
  ITEM: number[]
  /** ボタンを押したときに呼ばれるコールバック（押した数字を渡す） */
  handleEvent: (num: number) => void
}

export function BtnNum({ ITEM, handleEvent }: BtnNumProps) {
  return (
    <div className="h-12 md:h-16 container flex justify-center items-center flex-wrap bg-orange-100">
      {ITEM.map((num) => (
        <button
          key={num}
          value={num}
          onClick={() => handleEvent(num)}
          className="m-0.5 sm:m-1 p-1 font-bold
                     w-7 sm:w-10 md:w-12
                     text-sm sm:text-base md:text-xl
                     border-blue-700 bg-white border-2 text-blue-700
                     hover:bg-blue-700 hover:text-white active:translate-y-1
                     rounded-lg shadow-lg"
        >
          {num}
        </button>
      ))}
    </div>
  )
}
