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
  // 初期位置：ブロックエリアの右下あたりに重なるようオフセット
  const [pos, setPos] = useState({ x: 80, y: -110 })

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
          // A) ラベル：中央に「🤚 かくす」を表示
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* A) パネルラベル：何のためのものかを直感的に伝える */}
        <span style={{
          color: "rgba(255,255,255,0.75)",
          fontSize: "max(1.4vw, 14px)",
          fontWeight: "bold",
          letterSpacing: "0.05em",
          pointerEvents: "none",
          userSelect: "none",
        }}>
          🤚 かくす
        </span>

        {/* B) グリップ（右端のつまみ）：↕ アイコンで「動かせる」を示す */}
        {/* pointer-events: all で、パネル本体の none を上書きして掴めるようにする */}
        <div
          onMouseDown={(e) => {
            startDrag(e.clientX, e.clientY)
            e.preventDefault()
          }}
          onTouchStart={(e) => {
            startDrag(e.touches[0].clientX, e.touches[0].clientY)
          }}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "max(2vw, 22px)",
            height: "100%",
            backgroundColor: "yellow",
            pointerEvents: "all",
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* ↕ で「ここを掴んで動かす」を示す */}
          <span style={{
            fontSize: "max(1.2vw, 13px)",
            color: "#555",
            userSelect: "none",
            pointerEvents: "none",
          }}>
            ↕
          </span>
        </div>
      </div>

      {/* D) 説明文：パネル直下に小さく表示 */}
      <div style={{
        marginTop: "4px",
        fontSize: "max(1vw, 11px)",
        color: "#666",
        textAlign: "center",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        userSelect: "none",
      }}>
        グリップを　つかんで　ブロックを　かくそう
      </div>

    </div>
  )
}
