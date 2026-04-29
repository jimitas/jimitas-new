// ======================================================
// NumPad — 横一列テンキー（共通部品）
//
// 数字入力が必要なアプリで使う汎用のテンキー UI。
// 電卓キーを押すような見た目・感触を意識したデザイン。
// ドラッグ用の BtnNum とは明確に区別できるよう、
// 暗いパネル背景 + 立体的なキーで「入力装置」感を出す。
//
// レイアウト（横一列）:
//   [パネル] 0 1 2 3 4 5 6 7 8 9 ← C
//
// Props:
//   onDigit  - 数字ボタン（0〜9）を押したとき
//   onDelete - ← ボタン（最後の1桁を消す）を押したとき
//   onClear  - C ボタン（全消し）を押したとき
//   disabled - true のときグレーアウト・操作不可（省略可）
// ======================================================

"use client"

import * as se from "@/lib/se"

interface NumPadProps {
  onDigit: (n: number) => void
  onDelete: () => void
  onClear: () => void
  disabled?: boolean
}

export function NumPad({ onDigit, onDelete, onClear, disabled = false }: NumPadProps) {
  return (
    // 電卓本体のパネル（暗めのグレー）
    <div
      className={`flex items-center gap-1.5 overflow-x-auto
                  bg-gray-600 dark:bg-gray-900
                  rounded-2xl px-3 py-3
                  shadow-inner
                  ${disabled ? "opacity-40 pointer-events-none" : ""}`}
    >
      {/* 数字キー 0〜9 */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
        <button
          key={n}
          onClick={() => { se.playSe(se.pi); onDigit(n) }}
          className="flex-shrink-0 w-11 h-11
                     bg-gray-100 dark:bg-gray-700
                     text-gray-800 dark:text-gray-100
                     text-lg font-bold
                     rounded-lg
                     border-2 border-gray-300 dark:border-gray-500
                     border-b-4 border-b-gray-400 dark:border-b-gray-600
                     shadow-md
                     hover:bg-white dark:hover:bg-gray-600
                     active:border-b-2 active:translate-y-[2px] active:shadow-sm
                     transition-all duration-75
                     select-none"
        >
          {n}
        </button>
      ))}

      {/* 区切り線 */}
      <div className="flex-shrink-0 w-px h-8 bg-gray-500 dark:bg-gray-700 mx-0.5" />

      {/* ← バックスペース */}
      <button
        onClick={() => { se.playSe(se.cancel); onDelete() }}
        title="1文字消す"
        className="flex-shrink-0 w-11 h-11
                   bg-warm-200 dark:bg-orange-900
                   text-orange-800 dark:text-orange-200
                   text-base font-bold
                   rounded-lg
                   border-2 border-warm-300 dark:border-orange-700
                   border-b-4 border-b-warm-400 dark:border-b-orange-800
                   shadow-md
                   hover:bg-warm-100 dark:hover:bg-orange-800
                   active:border-b-2 active:translate-y-[2px] active:shadow-sm
                   transition-all duration-75
                   select-none"
      >
        ←
      </button>

      {/* C クリア */}
      <button
        onClick={() => { se.playSe(se.reset); onClear() }}
        title="全部消す"
        className="flex-shrink-0 w-11 h-11
                   bg-danger-300 dark:bg-red-900
                   text-red-900 dark:text-red-200
                   text-base font-bold
                   rounded-lg
                   border-2 border-danger-400 dark:border-red-700
                   border-b-4 border-b-danger-500 dark:border-b-red-800
                   shadow-md
                   hover:bg-danger-200 dark:hover:bg-red-800
                   active:border-b-2 active:translate-y-[2px] active:shadow-sm
                   transition-all duration-75
                   select-none"
      >
        C
      </button>
    </div>
  )
}
