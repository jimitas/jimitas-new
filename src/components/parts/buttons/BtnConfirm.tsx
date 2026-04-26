"use client"

// ======================================================
// BtnConfirm
//
// 「アラート代わりの埋め込み確認」共通部品。
// 通常時はラベル付きボタン、押すと「○○？ [はい] [いいえ]」に展開する。
//
// 効果音は内蔵：
//   - 起動（ボタンを押した瞬間）   → alert.mp3（少し強めの注意喚起）
//   - いいえ（取り消し）           → cancel.mp3（控えめな取り消し音）
//   - はい（確定）                 → 親の onConfirm で各アプリ固有の音を鳴らす
//
// 使い方の例：
//   <BtnConfirm
//     label="リセット"
//     promptLabel="ぜんぶ消す？"
//     onConfirm={resetAll}
//   />
//
//   <BtnConfirm
//     label="セット"
//     promptLabel={pendingCount > current ? "ふやす？" : "へらす？"}
//     yesColor="yellow"
//     buttonClassName="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-bold text-sm"
//     guard={() => pendingCount !== current}
//     onConfirm={apply}
//   />
// ======================================================

import { ReactNode, useState } from "react"
import { useSound } from "@/hooks/useSound"

type YesColor = "red" | "yellow" | "brand"

type Props = {
  /** 通常時のボタン表示（文字列または JSX）*/
  label: ReactNode
  /** 通常時のボタン className（色指定など全部上書き）*/
  buttonClassName?: string
  /** 通常時のボタン disabled */
  disabled?: boolean
  /** ボタンを押したときに「進めるか」を判定。false を返すと確認バーを開かない（無音）*/
  guard?: () => boolean
  /** 確認バー表示時のメッセージ（"もどす？" "ふやす？" など）*/
  promptLabel: string
  /** 「はい」を押したときに呼ばれる */
  onConfirm: () => void
  /** 「はい」ボタンの色（赤=破壊的、黄=注意、青=積極） */
  yesColor?: YesColor
  /** 「はい」「いいえ」のラベル（変える必要がある場合）*/
  yesLabel?: string
  noLabel?: string
}

// 「はい」の色テーマ（背景＋ホバー）
const YES_BG: Record<YesColor, string> = {
  red:    "bg-red-500 hover:bg-red-600",
  yellow: "bg-yellow-500 hover:bg-yellow-600",
  brand:  "bg-brand-500 hover:bg-brand-600",
}

// 確認バー全体の背景色（薄め）
const PROMPT_BG: Record<YesColor, string> = {
  red:    "bg-red-50 dark:bg-red-950",
  yellow: "bg-yellow-50 dark:bg-yellow-950",
  brand:  "bg-brand-50 dark:bg-brand-950",
}

// 確認バーのメッセージ文字色
const PROMPT_TEXT: Record<YesColor, string> = {
  red:    "text-red-700 dark:text-red-300",
  yellow: "text-yellow-800 dark:text-yellow-200",
  brand:  "text-brand-700 dark:text-brand-300",
}

const DEFAULT_BUTTON_CLASS =
  "px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-red-100 dark:hover:bg-red-900"

export function BtnConfirm({
  label,
  buttonClassName = DEFAULT_BUTTON_CLASS,
  disabled,
  guard,
  promptLabel,
  onConfirm,
  yesColor = "red",
  yesLabel = "はい",
  noLabel = "いいえ",
}: Props) {
  const [confirming, setConfirming] = useState(false)
  const { play } = useSound()

  const handleOpen = () => {
    if (guard && !guard()) return  // 進めない条件なら無音で終了
    play("/sounds/alert.mp3", 0.4)
    setConfirming(true)
  }

  const handleNo = () => {
    play("/sounds/cancel.mp3", 0.4)
    setConfirming(false)
  }

  const handleYes = () => {
    setConfirming(false)
    // 効果音は親側で鳴らす（reset.mp3 / set.mp3 など action ごとに違うため）
    onConfirm()
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={buttonClassName}
      >
        {label}
      </button>
    )
  }

  return (
    <div className={`flex gap-1 items-center rounded-lg p-1 ${PROMPT_BG[yesColor]}`}>
      <span className={`text-xs px-1 ${PROMPT_TEXT[yesColor]}`}>{promptLabel}</span>
      <button
        type="button"
        onClick={handleYes}
        className={`px-2 py-1 rounded text-white text-xs font-bold ${YES_BG[yesColor]}`}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={handleNo}
        className="px-2 py-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 text-xs"
      >
        {noLabel}
      </button>
    </div>
  )
}
