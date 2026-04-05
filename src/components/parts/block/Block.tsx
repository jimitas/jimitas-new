// ======================================================
// Block コンポーネント
//
// かずぶろっくのメインUI。
// 「上エリア（ならべるところ）」と「下エリア（木箱）」の
// 2つのエリアに分かれており、ブロックをドラッグして移動できる。
//
// 構造：
//   上エリア：最大2テーブル（左0〜10、右0〜10）
//   ─── ぶろっくのはこ ───
//   下エリア（木箱）：最大2テーブル（左右各10）
//
// 注意: useEffect 内で document.createElement を使って
//       テーブルを直接構築している（Reactらしくない書き方だが
//       DnD の動作安定性のため意図的にこのまま維持する）。
// ======================================================

"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import * as se from "@/lib/se"
import styles from "@/components/parts/block/Block.module.css"
import { useDragDrop } from "@/hooks/useDragDrop"
import { BtnSpace } from "@/components/parts/buttons/BtnSpace"
import { BtnUndo } from "@/components/parts/buttons/BtnUndo"

// ブロックの色：インデックス 0=ピンク 1=青（クリックで交互に変わる）
const divColor = ["#ff8082", "#005aff", "#ff8082", "#005aff"]

interface BlockProps {
  /** 上エリアに自動配置するブロック数（0=空、問題モードで使用） */
  autoCount: number
  /** 下エリア（木箱）を表示するか（false のとき非表示） */
  lowerEnabled?: boolean
  /** 上エリアのブロック数が変わったときに呼ばれるコールバック */
  onCountChange?: (count: number) => void
}

export function Block(props: BlockProps) {
  // 上エリア・下エリアのコンテナへの参照
  const el_upper = useRef<HTMLDivElement>(null)
  const el_lower = useRef<HTMLDivElement>(null)

  // resetKey を増やすと useEffect が再実行されてテーブルが再生成される
  const [resetKey, setResetKey] = useState(0)

  // onCountChange を ref に保存（useEffect の依存配列に入れないため）
  const onCountChangeRef = useRef(props.onCountChange)
  onCountChangeRef.current = props.onCountChange

  // 上エリアのブロック数を数えてコールバックで通知する
  const notifyCount = useCallback(() => {
    const count = el_upper.current?.querySelectorAll(".draggable-elem").length ?? 0
    onCountChangeRef.current?.(count)
  }, [])

  // DnD フックからイベントハンドラーを取得（ドロップ後にブロック数を更新）
  // 効果音は useDragDrop 内で鳴らすため、ここはカウント更新のみ渡す
  const { dragStart, dragOver, dropEnd, touchStart, touchMove, touchEnd } =
    useDragDrop(notifyCount)

  // リセットボタン：テーブルを再生成して初期配置に戻す
  const resetTable = () => {
    setResetKey((k) => k + 1)
    se.playSe(se.seikai1)
  }

  // ── テーブル配置の計算 ──────────────────────────────
  // autoCount が 0〜10 なら左テーブルのみ、11〜20 なら右テーブルにあふれる
  const upperLeft  = Math.min(props.autoCount, 10)
  const upperRight = Math.max(0, props.autoCount - 10)
  const lowerEnabled = props.lowerEnabled !== false
  // 下エリアは常に左右各10個（木箱に入っているブロック）
  const lowerLeft  = lowerEnabled ? 10 : 0
  const lowerRight = lowerEnabled ? 10 : 0

  // ── テーブルをDOMで直接生成 ──────────────────────────
  useEffect(() => {
    /**
     * テーブルを動的生成してコンテナに追加する。
     * @param container  描画先の div 要素
     * @param counts     各テーブルに配置するブロック数の配列
     * @param colorOffset  色インデックスのオフセット（上エリア=0、下エリア=2）
     */
    const createTables = (
      container: HTMLDivElement,
      counts: number[],
      colorOffset: number
    ) => {
      // 既存の中身を全部消す
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }

      for (let i = 0; i < counts.length; i++) {
        // 2行×5列のテーブルを作る（= 1テーブルで最大10個のブロック）
        const TBL = document.createElement("table")
        container.appendChild(TBL)

        for (let j = 0; j < 2; j++) {          // 行
          const tr = document.createElement("tr")
          TBL.appendChild(tr)

          for (let k = 0; k < 5; k++) {        // 列
            const td = document.createElement("td")
            td.className = "droppable-elem"    // ドロップ先マーカー
            tr.appendChild(td)

            // counts[i] 個までブロックを配置する
            if (j * 5 + k < counts[i]) {
              let colorIndex = i + colorOffset
              let touchStartFlag = false

              // ブロック本体（丸い div）
              const div = document.createElement("div")
              div.className = "draggable-elem" // ドラッグ元マーカー
              div.setAttribute("draggable", "true")
              td.appendChild(div)
              div.style.backgroundColor = divColor[colorIndex]

              // クリック（またはタップ短押し）で色を反転させる
              const colorChange = (e: MouseEvent | TouchEvent) => {
                se.playSe(se.pi)
                colorIndex++
                const target = e.target as HTMLElement
                target.style.transform =
                  target.style.transform === "rotateY(180deg)"
                    ? "rotateY(0deg)"
                    : "rotateY(180deg)"
                div.style.backgroundColor = divColor[colorIndex % 2]
              }

              // タッチ短押し（150ms以内に離す）を「クリック」として扱う
              const touchStartEvent = () => {
                touchStartFlag = !touchStartFlag
                setTimeout(() => { touchStartFlag = false }, 150)
              }
              const touchEndEvent = (e: TouchEvent) => {
                if (touchStartFlag) colorChange(e)
              }

              // イベントリスナーを登録
              div.addEventListener("click",      colorChange,      false)
              div.addEventListener("dragstart",  dragStart,        false)
              div.addEventListener("dragover",   dragOver,         false)
              div.addEventListener("drop",       dropEnd,          false)
              div.addEventListener("touchstart", touchStart,       false)
              div.addEventListener("touchstart", touchStartEvent,  false)
              div.addEventListener("touchmove",  touchMove,        false)
              div.addEventListener("touchend",   touchEnd,         false)
              div.addEventListener("touchend",   touchEndEvent,    false)
            }
          }
        }
      }
    }

    // 上エリア・下エリアそれぞれにテーブルを生成
    if (el_upper.current) createTables(el_upper.current, [upperLeft, upperRight], 0)
    if (el_lower.current) createTables(el_lower.current, [lowerLeft, lowerRight], 2)

    // 生成直後のカウントを通知（autoCount が変わったときに親が正しい値を持てるように）
    onCountChangeRef.current?.(upperLeft + upperRight)
  }, [
    resetKey,
    upperLeft, upperRight,
    lowerLeft, lowerRight,
    dragStart, dragOver, dropEnd,
    touchStart, touchMove, touchEnd,
  ])

  return (
    <div className="flex justify-center flex-wrap items-end">
      {/* 左右のスペーサー（BtnUndo と高さを合わせるための空ボタン） */}
      <BtnSpace />

      {/* ブロックエリア全体（React のDnDイベントも親に設定する） */}
      <div
        className={styles.blockWrapper}
        onDragStart={(e) => dragStart(e.nativeEvent)}
        onDragOver={(e) => dragOver(e.nativeEvent)}
        onDrop={(e) => dropEnd(e.nativeEvent)}
      >
        {/* 上エリア：ならべるところ */}
        <div ref={el_upper} className={styles.upperArea}></div>

        {/* 仕切りラベル */}
        <div className={styles.separator}>ぶろっくのはこ</div>

        {/* 下エリア：木箱 */}
        <div className={styles.woodBox}>
          <div ref={el_lower} className={styles.lowerGrid}></div>
        </div>
      </div>

      {/* リセットボタン（↩ アイコン） */}
      <BtnUndo handleEvent={resetTable} />
    </div>
  )
}
