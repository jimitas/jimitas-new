// ======================================================
// BtnUndo コンポーネント
//
// リセット（元に戻す・もどす）ボタン。アイコンのみ。
// danger（赤系）— リセット・破壊的アクションの統一トークン。
// 見た目の定義は Btn.tsx に集約してある。
//
// gap-1 を渡していない理由:
//   他の部品は「アイコン＋文字」なので gap-1 で隙間を空けるが、
//   この部品はアイコン1つだけなので、元から gap を持っていなかった。
//   見た目は同じ（子要素が1つなので隙間は生じない）だが、
//   移行時に「本当に何も変わっていない」ことを機械的に確かめられるよう、
//   元の状態をそのまま保っている。
// ======================================================

"use client"

import { FaRotateLeft } from "react-icons/fa6"
import { Btn } from "./Btn"

interface BtnUndoProps {
  handleEvent: () => void
}

export function BtnUndo({ handleEvent }: BtnUndoProps) {
  return (
    <Btn
      color="danger"
      onClick={handleEvent}
      icon={<FaRotateLeft className="w-4 h-4 md:w-6 md:h-6" />}
      className="m-2 p-2 w-10 h-12 md:w-12 md:text-base"
      // アイコンだけのボタンは、読み上げると中身が空になって何のボタンか伝わらない。
      // 見た目は変わらない（aria-label は属性であって描画に影響しない）。
      ariaLabel="さいしょにもどす"
    />
  )
}
