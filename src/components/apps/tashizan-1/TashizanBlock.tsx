// ======================================================
// TashizanBlock コンポーネント
//
// たしざん１の数図ブロック UI。
// 4つのテーブル（左上・右上・左下・右下）で数を表現する。
//
// 構造：
//   左上テーブル: leftCount > 10 のときの 10 個（繰り上がり表示）
//   右上テーブル: rightCount > 10 のときの 10 個（繰り上がり表示）
//   左下テーブル: leftCount の端数（または leftCount 全体）
//   右下テーブル: rightCount の端数（または rightCount 全体）
//
// ブロック色：左=赤 (#ff8082) / 右=青 (#005aff)
// クリックで 3D 回転して色が変わる。
// ドラッグ&ドロップでブロックを移動できる。
// ======================================================

"use client"

import { useEffect, useState } from "react"
import * as se from "@/components/apps/suuzu-block/se"
import styles from "@/components/apps/tashizan-1/TashizanBlock.module.css"
import { useDragDrop } from "@/hooks/useDragDrop"
import { BtnSpace } from "@/components/apps/suuzu-block/BtnSpace"
import { BtnUndo } from "@/components/apps/suuzu-block/BtnUndo"

// ブロックの色：index 0,2=赤（左）/ 1,3=青（右）
const DIV_COLOR = ["#ff8082", "#005aff", "#ff8082", "#005aff"]

interface TashizanBlockProps {
  /** 左側のブロック数（たされる数） */
  leftCount: number
  /** 右側のブロック数（たす数） */
  rightCount: number
}

export function TashizanBlock({ leftCount, rightCount }: TashizanBlockProps) {
  // ドラッグ&ドロップフック（すうずぶろっくと共通）
  const { dragStart, dragOver, dropEnd, touchStart, touchMove, touchEnd } = useDragDrop()

  // resetKey を増やすと useEffect が再実行されてテーブルが再生成される
  const [resetKey, setResetKey] = useState(0)

  // リセットボタン：テーブルを再生成して初期配置に戻す
  const resetTable = () => {
    setResetKey((k) => k + 1)
    se.playSe(se.seikai1)
  }

  // ── 4テーブルのブロック数を計算 ──────────────────────
  // 上テーブルにメインのブロックを配置する（最大10個）。
  // 10 を超えた場合のみ、下テーブルに端数を表示する。
  const leftUp   = leftCount  <= 10 ? leftCount  : 10
  const rightUp  = rightCount <= 10 ? rightCount : 10
  const leftDown = leftCount  >  10 ? leftCount  - 10 : 0
  const rightDown= rightCount >  10 ? rightCount - 10 : 0

  // ── テーブルを DOM で直接生成 ──────────────────────────
  // react-draggable を使わず HTML5 DnD + Touch Events で実装。
  // Tailwind preflight との競合を避けるため、useEffect 内で直接生成。
  useEffect(() => {
    const container = document.getElementById("tashizan-block-area") as HTMLDivElement | null
    if (!container) return

    // 既存の中身をすべて削除
    while (container.firstChild) container.removeChild(container.firstChild)

    // 4テーブル分のブロック数（[左上, 右上, 左下, 右下]）
    const counts = [leftUp, rightUp, leftDown, rightDown]

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
            div.style.backgroundColor = DIV_COLOR[colorIndex]

            // クリックで 3D 回転して色を変える
            const colorChange = (e: MouseEvent | TouchEvent) => {
              se.playSe(se.pi)
              colorIndex++
              const target = e.target as HTMLElement
              target.style.transform =
                target.style.transform === "rotateY(180deg)"
                  ? "rotateY(0deg)"
                  : "rotateY(180deg)"
              div.style.backgroundColor = DIV_COLOR[colorIndex % 2]
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
  }, [resetKey, leftUp, rightUp, leftDown, rightDown, dragStart, dragOver, dropEnd, touchStart, touchMove, touchEnd])

  return (
    <div className="flex justify-center flex-wrap items-end my-4">
      <BtnSpace />

      {/* ブロックエリア：React の DnD イベントを親要素にも設定 */}
      <div
        id="tashizan-block-area"
        className={styles.tableWrap}
        onDragStart={(e) => dragStart(e.nativeEvent)}
        onDragOver={(e) => dragOver(e.nativeEvent)}
        onDrop={(e) => dropEnd(e.nativeEvent)}
      />

      <BtnUndo handleEvent={resetTable} />
    </div>
  )
}
