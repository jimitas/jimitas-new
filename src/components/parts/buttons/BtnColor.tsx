// ======================================================
// BtnColor コンポーネント
//
// 色選択ボタンの共通部品。
// 色の四角ボタンを表示し、現在選択中の色（current）と一致すると
// 太枠＋スケール拡大でアクティブ表示する。
//
// 押した瞬間に必ず se.set（モード切替効果音）が鳴る。
// 同じ色を再度押した場合は何も起きない（無音・onChange 呼ばない）。
//
// 使い方:
//   <BtnColor color="#fbcfe8" current={selected} onChange={setSelected} label="ピンク" />
//
// 大きさを変えたいときは sizeClass でサイズ系クラスのみ上書き:
//   <BtnColor ... sizeClass="w-12 h-12" />
// ======================================================

"use client"

import * as se from "@/lib/se"

interface BtnColorProps {
  /** このボタンが表す色（CSS color 値） */
  color: string
  /** 現在選択中の色（一致するとアクティブ表示） */
  current: string
  /** 色を切り替える関数 */
  onChange: (c: string) => void
  /** ホバー/アクセシビリティ用のラベル */
  label?: string
  /** 大きさ（Tailwind の w/h クラス）。デフォルト w-9 h-9 */
  sizeClass?: string
}

export function BtnColor({
  color,
  current,
  onChange,
  label,
  sizeClass = "w-9 h-9",
}: BtnColorProps) {
  const isActive = color === current

  return (
    <button
      onClick={() => {
        if (isActive) return
        se.playSe(se.set)
        onChange(color)
      }}
      title={label}
      aria-label={label}
      className={`${sizeClass} rounded-md border-2 transition-all
        ${isActive
          ? "border-gray-700 dark:border-gray-200 scale-110 shadow-md"
          : "border-gray-300 dark:border-gray-600"}`}
      style={{ backgroundColor: color }}
    />
  )
}
