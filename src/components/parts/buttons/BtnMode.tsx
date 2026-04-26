// ======================================================
// BtnMode コンポーネント
//
// モード切替・難易度切替・段選択など「現在の値（current）と
// 比較してアクティブ表示するボタン」の共通部品。
//
// 押した瞬間に必ず se.set（モード切替効果音）が鳴る。
// 同じ値を再度押した場合は何も起きない（無音・onChange 呼ばない）。
//
// 使い方:
//   <BtnMode value="A" current={mode} onChange={setMode}>モードA</BtnMode>
//
// デフォルトデザイン（brand 色のトグル）が気に入らない場合は
// className で上書きできる（既存スタイルを完全置き換えたい場合は
// className に bg-/text- などを書き、デフォルトの色クラスを上書き）。
// ======================================================

"use client"

import * as se from "@/lib/se"

interface BtnModeProps<T extends string | number> {
  /** このボタンが表すモード値 */
  value: T
  /** 現在選択中のモード値（一致するとアクティブ表示） */
  current: T
  /** モードを切り替える関数 */
  onChange: (v: T) => void
  /** ボタン内に表示する内容（テキスト・絵文字など） */
  children: React.ReactNode
  /** 押せない状態にする（例: 練習中はモード変更不可） */
  disabled?: boolean
  /** デザインを上書きしたい場合に追加クラスを渡す */
  className?: string
}

export function BtnMode<T extends string | number>({
  value,
  current,
  onChange,
  children,
  disabled = false,
  className = "",
}: BtnModeProps<T>) {
  const isActive = value === current

  return (
    <button
      onClick={() => {
        if (disabled || isActive) return
        se.playSe(se.set)
        onChange(value)
      }}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95
        disabled:opacity-40 disabled:cursor-not-allowed
        ${isActive
          ? "bg-brand-500 text-white"
          : "bg-white border border-brand-300 text-brand-600 hover:bg-brand-100 dark:bg-gray-800 dark:text-brand-300 dark:border-brand-700 dark:hover:bg-brand-900"}
        ${className}`}
    >
      {children}
    </button>
  )
}
