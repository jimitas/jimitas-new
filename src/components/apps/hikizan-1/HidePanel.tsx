// ======================================================
// HidePanel コンポーネント
//
// ひきざん１で使う「かくすパネル」。
// ドラッグしてブロックの上に被せることで、
// 疑似的に「ものが減る」ことを示す教具。
//
// 例）4－2＝2 の場合:
//   4つのブロックの上に 2つ分だけパネルを被せる
//   → 残り 2つが見える → それが答え
//
// 操作：
//   右端の黄色グリップを掴んでドラッグ（マウス・タッチ対応）
//   パネル本体は pointer-events: none なので
//   下のブロックは引き続きドラッグ・クリックできる
//
// react-draggable を使わず、マウス・タッチイベントで実装。
// ======================================================

"use client"

import { useEffect, useRef, useState } from "react"

export function HidePanel() {
  // パネルの位置（自然な位置からの offset）
  const [pos, setPos] = useState({ x: 0, y: 0 })

  // ドラッグ中かどうか
  const isDragging = useRef(false)

  // ドラッグ開始時の情報を ref で保持（re-render で失われないよう）
  const dragData = useRef({ startMouseX: 0, startMouseY: 0, startPosX: 0, startPosY: 0 })

  // ドラッグ開始（グリップを掴んだとき）
  const startDrag = (clientX: number, clientY: number) => {
    isDragging.current = true
    dragData.current = {
      startMouseX: clientX,
      startMouseY: clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    }
  }

  // document レベルで move / end を監視（グリップ外に出ても動くように）
  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
      setPos({
        x: dragData.current.startPosX + clientX - dragData.current.startMouseX,
        y: dragData.current.startPosY + clientY - dragData.current.startMouseY,
      })
    }
    const onEnd = () => { isDragging.current = false }

    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup",   onEnd)
    document.addEventListener("touchmove", onMove, { passive: true })
    document.addEventListener("touchend",  onEnd)

    return () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup",   onEnd)
      document.removeEventListener("touchmove", onMove)
      document.removeEventListener("touchend",  onEnd)
    }
  }, [])

  return (
    /*
     * position: relative + left/top で自然な位置からオフセット。
     * react-draggable が内部でやっているのと同じ手法。
     * inline-block にすることでブロックエリアの中に収まりやすくする。
     */
    <div style={{ display: "inline-block", position: "relative", left: pos.x, top: pos.y }}>

      {/* ── パネル本体（暗い長方形）── */}
      <div
        style={{
          width: "max(22vw, 200px)",
          height: "max(9vw, 90px)",
          backgroundColor: "#333",
          opacity: 0.92,
          border: "2px solid yellowgreen",
          // pointer-events: none → 下のブロックはクリック・ドラッグ可能なまま
          pointerEvents: "none",
          position: "relative",
          userSelect: "none",
        }}
      >
        {/* ── グリップ（右端の黄色つまみ）── */}
        {/* pointer-events: all で、パネル本体の none を上書きして掴めるようにする */}
        <div
          onMouseDown={(e) => {
            startDrag(e.clientX, e.clientY)
            e.preventDefault()
          }}
          onTouchStart={(e) => {
            startDrag(e.touches[0].clientX, e.touches[0].clientY)
            // touchmove は document 側で処理するため preventDefault は不要
          }}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "max(2vw, 20px)",
            height: "100%",
            backgroundColor: "yellow",
            pointerEvents: "all",
            cursor: "grab",
          }}
        />
      </div>
    </div>
  )
}
