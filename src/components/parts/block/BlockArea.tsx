// ======================================================
// BlockArea コンポーネント（共通）
//
// たしざん・ひきざん共通の数図ブロック表示エリア。
// テーブル数・配置は counts[] 配列で制御するため、
// どのアプリからでも使い回せる汎用コンポーネント。
//
// 使い方:
//   counts に各テーブルのブロック数を渡す（最大 10 個/テーブル）。
//   たしざん: [leftUp, rightUp, leftDown, rightDown]  ← 4テーブル
//   ひきざん: [leftUp, 0, leftDown, 0]               ← 左側だけ
//
// 構造（flex-wrap で 2×2 グリッド）:
//   [テーブル0: 左上] [テーブル1: 右上]
//   [テーブル2: 左下] [テーブル3: 右下]
//
// ブロック色: 赤 (#ff8082) / 青 (#005aff) を交互に割り当て。
//            クリックで 3D 回転して色が変わる。
// ドラッグ&ドロップでブロックを移動できる。
// ======================================================

"use client"

import { useEffect, useState } from "react"
import * as se from "@/lib/se"
import styles from "@/components/parts/block/BlockArea.module.css"
import { useDragDrop } from "@/hooks/useDragDrop"
import { BtnSpace } from "@/components/parts/buttons/BtnSpace"
import { BtnUndo } from "@/components/parts/buttons/BtnUndo"

// ブロックの色：テーブルインデックスで交互に割り当て
const DIV_COLOR = ["#ff8082", "#005aff", "#ff8082", "#005aff"]

interface BlockAreaProps {
  /** DOM 要素の id（同一ページ内で重複しないようにする） */
  containerId: string
  /** 各テーブルのブロック数（例: [leftUp, rightUp, leftDown, rightDown]） */
  counts: number[]
}

export function BlockArea({ containerId, counts }: BlockAreaProps) {
  // ドラッグ&ドロップフック（全アプリ共通）
  const { dragStart, dragOver, dropEnd, touchStart, touchMove, touchEnd } = useDragDrop()

  // resetKey を増やすと useEffect が再実行されてテーブルが再生成される
  const [resetKey, setResetKey] = useState(0)

  // リセットボタン：テーブルを初期配置に戻す
  const resetTable = () => {
    setResetKey((k) => k + 1)
    se.playSe(se.seikai1)
  }

  // ── テーブルを DOM で直接生成 ──────────────────────────────
  // Tailwind preflight との競合・DnD 安定性のため useEffect 内で createElement。
  useEffect(() => {
    const container = document.getElementById(containerId) as HTMLDivElement | null
    if (!container) return

    // 既存の中身をすべて削除
    while (container.firstChild) container.removeChild(container.firstChild)

    counts.forEach((count, tableIndex) => {
      // 2行 × 5列 = 最大 10 個のテーブルを生成
      const TBL = document.createElement("table")
      container.appendChild(TBL)

      for (let row = 0; row < 2; row++) {
        const tr = document.createElement("tr")
        TBL.appendChild(tr)

        for (let col = 0; col < 5; col++) {
          const td = document.createElement("td")
          td.className = "droppable-elem"
          tr.appendChild(td)

          // count 個分だけブロック div を配置する
          if (row * 5 + col < count) {
            let colorIndex = tableIndex
            let touchStartFlag = false

            // ブロック本体
            const div = document.createElement("div")
            div.className = "draggable-elem"
            div.setAttribute("draggable", "true")
            td.appendChild(div)
            div.style.backgroundColor = DIV_COLOR[colorIndex % DIV_COLOR.length]

            // クリックで 3D 回転して色を変える
            const colorChange = (e: MouseEvent | TouchEvent) => {
              se.playSe(se.pi)
              colorIndex++
              const target = e.target as HTMLElement
              target.style.transform =
                target.style.transform === "rotateY(180deg)"
                  ? "rotateY(0deg)"
                  : "rotateY(180deg)"
              div.style.backgroundColor = DIV_COLOR[colorIndex % DIV_COLOR.length]
            }

            // タッチ短押し（150ms以内）をクリックとして扱う
            const touchStartEvent = () => {
              touchStartFlag = !touchStartFlag
              setTimeout(() => { touchStartFlag = false }, 150)
            }
            const touchEndEvent = (e: TouchEvent) => {
              if (touchStartFlag) colorChange(e)
            }

            div.addEventListener("click",      colorChange,     false)
            div.addEventListener("dragstart",  dragStart,       false)
            div.addEventListener("dragover",   dragOver,        false)
            div.addEventListener("drop",       dropEnd,         false)
            div.addEventListener("touchstart", touchStart,      false)
            div.addEventListener("touchstart", touchStartEvent, false)
            div.addEventListener("touchmove",  touchMove,       false)
            div.addEventListener("touchend",   touchEnd,        false)
            div.addEventListener("touchend",   touchEndEvent,   false)
          }
        }
      }
    })
  // counts は配列なので展開して依存に含める
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, containerId, ...counts, dragStart, dragOver, dropEnd, touchStart, touchMove, touchEnd])

  return (
    <div className="flex justify-center flex-wrap items-end my-4">
      <BtnSpace />

      {/* ブロックエリア：React の DnD イベントを親要素にも設定 */}
      <div
        id={containerId}
        className={styles.tableWrap}
        onDragStart={(e) => dragStart(e.nativeEvent)}
        onDragOver={(e) => dragOver(e.nativeEvent)}
        onDrop={(e) => dropEnd(e.nativeEvent)}
      />

      <BtnUndo handleEvent={resetTable} />
    </div>
  )
}
