// ======================================================
// HikizanBlock コンポーネント
//
// ひきざん１の数図ブロック UI。
// ひかれる数（leftCount）のブロック数を計算し、
// 共通の BlockArea コンポーネントに渡す薄いラッパー。
//
// テーブル配置: [左上, 右上(空), 左下, 右下(空)]
//   ひきざんでは右側テーブルは常に 0（ひかれる数のみ表示）。
//   10 以下 → 左上テーブルだけを使用（upper-first）
//   11〜20  → 左上テーブルに 10 個 + 左下テーブルに端数
// ======================================================

"use client"

import { BlockArea } from "@/components/parts/block/BlockArea"

interface HikizanBlockProps {
  /** ひかれる数（表示するブロックの総数） */
  leftCount: number
}

export function HikizanBlock({ leftCount }: HikizanBlockProps) {
  // ── upper-first でブロック数を計算（右側は常に 0）────────
  const leftUp   = leftCount <= 10 ? leftCount : 10
  const leftDown = leftCount >  10 ? leftCount - 10 : 0

  return (
    <BlockArea
      containerId="hikizan-block-area"
      counts={[leftUp, 0, leftDown, 0]}
    />
  )
}
