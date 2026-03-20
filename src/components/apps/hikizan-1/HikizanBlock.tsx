// ======================================================
// HikizanBlock コンポーネント
//
// ひきざん１の数図ブロック UI。
// ひかれる数（leftCount）を4テーブル構造で表示する。
//
// テーブル配置（flex-wrap で 2×2 グリッド）:
//   [テーブル0: 左上] [テーブル1: 右上]  ← leftCount > 10 のとき使用
//   [テーブル2: 左下] [テーブル3: 右下]  ← メインエリア（10以下はここへ）
//
// ブロック配置ロジック（upper-first）:
//   leftCount ≤ 10 → 左上テーブルにブロックを配置（左下は空）
//   leftCount > 10 → 左上に10個 + 左下に端数
//   右側（right）はひきざんでは常に空
// ======================================================

"use client"

import { useEffect, useState } from "react"
import * as se from "@/components/apps/suuzu-block/se"
import styles from "@/components/apps/hikizan-1/HikizanBlock.module.css"
import { useDragDrop } from "@/hooks/useDragDrop"
import { BtnSpace } from "@/components/apps/suuzu-block/BtnSpace"
import { BtnUndo } from "@/components/apps/suuzu-block/BtnUndo"

// ブロックの色：赤→青へクリックで反転
// divColor[0] = 左上用（赤）/ [1] = 右上用（青）/ [2] = 左下用（赤）/ [3] = 右下用（青）
const DIV_COLOR = ["#ff8082", "#005aff", "#ff8082", "#005aff"]

interface HikizanBlockProps {
  /** ひかれる数（表示するブロックの総数） */
  leftCount: number
}

export function HikizanBlock({ leftCount }: HikizanBlockProps) {
  // ドラッグ&ドロップフック（suuzu-block・tashizan-1 と共通）
  const { dragStart, dragOver, dropEnd, touchStart, touchMove, touchEnd } = useDragDrop()

  // resetKey を増やすと useEffect が再実行されてテーブルが再生成される
  const [resetKey, setResetKey] = useState(0)

  // リセットボタン：テーブルを初期配置に戻す
  const resetTable = () => {
    setResetKey((k) => k + 1)
    se.playSe(se.seikai1)
  }

  // ── 4テーブルのブロック数を計算（upper-first） ─────────
  // left_up  : leftCount ≤ 10 のとき leftCount 全部、11〜20 のとき 10（上テーブル優先）
  // left_down: leftCount > 10 のとき端数のみ（それ以外は 0）
  // right_*  : ひきざんでは常に 0
  const leftUp   = leftCount <= 10 ? leftCount : 10
  const rightUp  = 0
  const leftDown = leftCount >  10 ? leftCount - 10 : 0
  const rightDown = 0

  // ── テーブルを DOM で直接生成 ──────────────────────────────
  useEffect(() => {
    const container = document.getElementById("hikizan-block-area") as HTMLDivElement | null
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
        id="hikizan-block-area"
        className={styles.tableWrap}
        onDragStart={(e) => dragStart(e.nativeEvent)}
        onDragOver={(e) => dragOver(e.nativeEvent)}
        onDrop={(e) => dropEnd(e.nativeEvent)}
      />

      <BtnUndo handleEvent={resetTable} />
    </div>
  )
}
