"use client"

// ======================================================
// BtnConfirm
//
// 「アラート代わりの埋め込み確認」共通部品。
// 通常時はラベル付きボタン、押すと「○○？ [はい] [いいえ]」に展開する。
//
// 配色は color prop で指定する（docs/06_配色設計.md の新標準に準拠）。
//   color="brand"   → 緑・開始・確定系（セットなど）
//   color="accent"  → 青・判定系
//   color="warm"    → オレンジ・補助系
//   color="danger"  → 赤系・リセット・破壊的アクション
//   color="neutral" → グレー・控えめなアクション（デフォルト）
//
// すべて -400 ベース白抜き（共通部品の標準スタイル）で統一される。
//
// 効果音は内蔵：
//   - 起動（ボタンを押した瞬間）   → alert.mp3（少し強めの注意喚起）
//   - いいえ（取り消し）           → cancel.mp3（控えめな取り消し音）
//   - はい（確定）                 → 親の onConfirm で各アプリ固有の音を鳴らす
//
// 使い方の例：
//   <BtnConfirm
//     label="リセット"
//     color="danger"
//     promptLabel="ぜんぶ消す？"
//     onConfirm={resetAll}
//   />
//
//   <BtnConfirm
//     label="セット"
//     color="brand"
//     promptLabel={pendingCount > current ? "ふやす？" : "へらす？"}
//     guard={() => pendingCount !== current}
//     onConfirm={apply}
//   />
//
// ⚠️ buttonClassName で raw color を上書きする使い方は禁止。
//    必ず color prop を使うこと。buttonClassName は強い上書き用に残してあるが、
//    アプリで使う場合は配色設計書を逸脱していないか確認すること。
// ======================================================

import { ReactNode, useState } from "react"
import { useSound } from "@/hooks/useSound"

type ConfirmColor = "brand" | "accent" | "warm" | "danger" | "neutral"
type YesColor = "danger" | "brand" | "warm"

type Props = {
  /** 通常時のボタン表示（文字列または JSX）*/
  label: ReactNode
  /** 通常時のボタンの色（デフォルト: neutral）*/
  color?: ConfirmColor
  /** 通常時のボタン className（強い上書き用。原則 color prop を使うこと）*/
  buttonClassName?: string
  /** 通常時のボタン disabled */
  disabled?: boolean
  /** ボタンを押したときに「進めるか」を判定。false を返すと確認バーを開かない（無音）*/
  guard?: () => boolean
  /** 確認バー表示時のメッセージ（"もどす？" "ふやす？" など）*/
  promptLabel: string
  /** 「はい」を押したときに呼ばれる */
  onConfirm: () => void
  /** 「はい」ボタンの色（破壊的=danger / 開始=brand / 注意=warm）。デフォルト danger */
  yesColor?: YesColor
  /** 「はい」「いいえ」のラベル（変える必要がある場合）*/
  yesLabel?: string
  noLabel?: string
}

// 通常時ボタンの色クラス（-400 ベース白抜き）
const COLOR_CLASS: Record<ConfirmColor, string> = {
  brand:   "bg-brand-400  hover:bg-brand-500  active:bg-brand-600  text-white border-2 border-brand-400",
  accent:  "bg-accent-400 hover:bg-accent-500 active:bg-accent-600 text-white border-2 border-accent-400",
  warm:    "bg-warm-400   hover:bg-warm-500   active:bg-warm-600   text-white border-2 border-warm-400",
  danger:  "bg-danger-400 hover:bg-danger-500 active:bg-danger-600 text-white border-2 border-danger-400",
  neutral: "bg-gray-300   hover:bg-gray-400   active:bg-gray-500   text-gray-800 border-2 border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
}

// 通常時ボタンの共通クラス（余白・フォント・形状・disabled 時の見た目）
const COMMON_BUTTON_CLASS =
  "px-3 py-2 font-bold text-sm rounded-lg shadow-sm active:translate-y-0.5 transition-colors " +
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0"

// 「はい」の色テーマ（背景＋ホバー）— 破壊的=danger, 開始=brand, 注意=warm
const YES_BG: Record<YesColor, string> = {
  danger: "bg-danger-500 hover:bg-danger-600",
  brand:  "bg-brand-500  hover:bg-brand-600",
  warm:   "bg-warm-500   hover:bg-warm-600",
}

// 確認バー全体の背景色（薄め）
const PROMPT_BG: Record<YesColor, string> = {
  danger: "bg-danger-50 dark:bg-danger-700/20",
  brand:  "bg-brand-50  dark:bg-brand-700/20",
  warm:   "bg-warm-50   dark:bg-warm-700/20",
}

// 確認バーのメッセージ文字色
const PROMPT_TEXT: Record<YesColor, string> = {
  danger: "text-danger-700 dark:text-danger-300",
  brand:  "text-brand-700  dark:text-brand-300",
  warm:   "text-warm-700   dark:text-warm-300",
}

export function BtnConfirm({
  label,
  color = "neutral",
  buttonClassName,
  disabled,
  guard,
  promptLabel,
  onConfirm,
  yesColor = "danger",
  yesLabel = "はい",
  noLabel = "いいえ",
}: Props) {
  const [confirming, setConfirming] = useState(false)
  const { play } = useSound()

  // buttonClassName が指定されていればそれを使う（互換維持）。
  // それ以外は color prop からスタイルを組み立てる。
  const buttonClass = buttonClassName
    ?? `${COMMON_BUTTON_CLASS} ${COLOR_CLASS[color]}`

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
        className={buttonClass}
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
