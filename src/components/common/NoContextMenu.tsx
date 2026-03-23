"use client"

// ======================================================
// タブレット・スマホの誤操作をグローバルに無効化
//
// layout.tsx（サーバーコンポーネント）では onXxx を使えないため、
// このクライアントコンポーネントでグローバルに登録する。
//
// 無効化する操作:
//   contextmenu: 長押しによる右クリックメニューの表示を禁止
//   dragstart:   ブラウザデフォルトのドラッグ（画像保存など）を禁止
// ======================================================

import { useEffect } from "react"

export default function NoContextMenu() {
  useEffect(() => {
    // 長押し右クリックメニューを禁止
    const preventContextMenu = (e: MouseEvent) => e.preventDefault()
    // ブラウザデフォルトのドラッグ動作（画像保存・テキスト選択ドラッグ）を禁止
    const preventDragStart = (e: DragEvent) => e.preventDefault()

    document.addEventListener("contextmenu", preventContextMenu)
    document.addEventListener("dragstart", preventDragStart)

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu)
      document.removeEventListener("dragstart", preventDragStart)
    }
  }, [])

  // 描画するUIはない。イベント登録だけのコンポーネント
  return null
}
