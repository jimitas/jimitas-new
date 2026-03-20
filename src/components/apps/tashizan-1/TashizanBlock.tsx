// ======================================================
// TashizanBlock コンポーネント
//
// たしざん１の数図ブロック UI。
// ブロック数の計算（upper-first ロジック）を行い、
// 共通の BlockArea コンポーネントに渡す薄いラッパー。
//
// テーブル配置: [左上, 右上, 左下, 右下]
//   10 以下 → 上テーブルだけを使用（upper-first）
//   11〜20  → 上テーブルに 10 個 + 下テーブルに端数
// ======================================================

"use client"

import { BlockArea } from "@/components/parts/block/BlockArea"

interface TashizanBlockProps {
  /** たされる数 */
  leftCount: number
  /** たす数 */
  rightCount: number
}

export function TashizanBlock({ leftCount, rightCount }: TashizanBlockProps) {
  // ── upper-first でブロック数を計算 ────────────────────
  const leftUp    = leftCount  <= 10 ? leftCount  : 10
  const rightUp   = rightCount <= 10 ? rightCount : 10
  const leftDown  = leftCount  >  10 ? leftCount  - 10 : 0
  const rightDown = rightCount >  10 ? rightCount - 10 : 0

  return (
    <BlockArea
      containerId="tashizan-block-area"
      counts={[leftUp, rightUp, leftDown, rightDown]}
    />
  )
}
