// ======================================================
// Btn — 共通ボタンの土台
//
// 「もんだい」「こたえあわせ」「リセット」など、役割ごとに名前が付いた
// ボタン部品（BtnQuestion / BtnCheck / BtnUndo ...）の中身を1つにまとめたもの。
//
// なぜ作ったか:
//   以前は 8 個の部品が、同じ 8 行の className を色だけ変えてコピーしていた。
//   その結果、直したつもりが 1 個だけ直っていない、という取りこぼしが起きていた。
//   （実際に「ラッパーの有無」「disabled の見た目」「アイコンサイズ」が
//     部品ごとにズレていた）
//   スタイルの定義をここ 1 箇所に集め、各部品は「色とアイコンとラベルを
//   渡すだけ」にする。
//
// 配色の決まりは docs/06_配色設計.md が正本。
//   brand   (緑)    開始・確定    もんだい / セット / スタート
//   accent  (青)    判定・入力    こたえあわせ / 数字 / シャッフル
//   warm    (橙)    ヒント・補助  こたえをみる
//   danger  (赤系)  リセット・停止・破壊的アクション
//   neutral (灰)    控えめなアクション
//
// ⚠️ 生の色（bg-red-500 など）をアプリ側で書かないこと。必ず color を使う。
//    色を変えたくなったら globals.css のトークンを書き換えれば全部に効く。
// ======================================================

"use client"

import type { ReactNode } from "react"
import * as se from "@/lib/se"

export type BtnColor = "brand" | "accent" | "warm" | "danger" | "neutral"

// -------------------------------------------------------
// 色ごとのクラス
//
// -400 を基準に、ホバーで -500、押している間は -600 と濃くなる。
// 枠線を背景と同色で引いているのは、枠線ありのボタン（BtnMode など）と
// 並んだときに高さが 4px ずれないようにするため。
// -------------------------------------------------------
export const BTN_COLOR_CLASS: Record<BtnColor, string> = {
  brand:   "bg-brand-400  hover:bg-brand-500  active:bg-brand-600  text-white border-2 border-brand-400",
  accent:  "bg-accent-400 hover:bg-accent-500 active:bg-accent-600 text-white border-2 border-accent-400",
  warm:    "bg-warm-400   hover:bg-warm-500   active:bg-warm-600   text-white border-2 border-warm-400",
  danger:  "bg-danger-400 hover:bg-danger-500 active:bg-danger-600 text-white border-2 border-danger-400",
  neutral: "bg-gray-300   hover:bg-gray-400   active:bg-gray-500   text-gray-800 border-2 border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
}

// -------------------------------------------------------
// 形（色・余白以外の共通部分）
//
// BtnConfirm が以前から使っていたものを、ここへ引き上げて共有している。
// 余白と幅はボタンごとに違うのでここには入れない。各部品が className で渡す。
//   例: 名前付き部品は "m-2 p-2 w-24 md:w-32"
//       BtnConfirm は "px-3 py-2"（中身に合わせて伸びる）
// -------------------------------------------------------
export const BTN_SHAPE_CLASS =
  "font-bold text-sm rounded-lg shadow-sm active:translate-y-0.5 transition-colors " +
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0"

// 中身を中央に並べる形。
//
// アイコンと文字の隙間（gap-1）はここに入れない。
// アイコンだけの部品（BtnUndo）は gap を持たないため、ここで gap-1 を付けると
// 部品側から gap-0 で打ち消せない。Tailwind は「クラスを書いた順」ではなく
// 「生成された CSS の順」で勝敗が決まるので、後から渡しても消せないことがある。
// 隙間が要る部品が自分で gap-1 を指定する。
const BTN_LAYOUT = "flex justify-center items-center"

interface BtnProps {
  /** 役割に対応する色。docs/06_配色設計.md を参照 */
  color: BtnColor
  /** クリック時の処理。効果音は内部で鳴らすので、ここでは鳴らさなくてよい */
  onClick: () => void
  /** ボタンの中身（ラベル） */
  children?: ReactNode
  /**
   * 左に並べるアイコン（react-icons の要素）。
   * サイズは渡す側で指定する（部品ごとに大きさが違うため）。
   */
  icon?: ReactNode
  /** 押せない状態にする */
  disabled?: boolean
  /**
   * 余白・幅など、名前付き部品ごとの差分を渡す。
   * 例: "m-2 p-2 w-24 md:w-32 text-sm md:text-base"
   * 既定の形（BTN_SHAPE_CLASS）を上書きしたい場合もここへ書く。
   */
  className?: string
  /**
   * 外側を <div className="flex flex-wrap justify-center"> で囲む。
   * 既存部品の見た目を変えないために用意している互換用の指定。
   *
   * ⚠️ 新しく使うときは付けないこと。
   *    このラッパーがあるとボタンを横に2つ並べられない。
   *    既存部品が使われなくなっていた理由でもある。
   */
  centerWrapper?: boolean
  /** アイコンだけのボタンで読み上げ用のラベルを付けたいとき */
  ariaLabel?: string
}

export function Btn({
  color,
  onClick,
  children,
  icon,
  disabled = false,
  className = "",
  centerWrapper = false,
  ariaLabel,
}: BtnProps) {
  const button = (
    <button
      onClick={() => { se.playSe(se.pi); onClick() }}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${BTN_LAYOUT} ${BTN_SHAPE_CLASS} ${BTN_COLOR_CLASS[color]} ${className}`}
    >
      {icon}
      {children}
    </button>
  )

  return centerWrapper
    ? <div className="flex flex-wrap justify-center">{button}</div>
    : button
}
