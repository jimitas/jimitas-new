"use client"

// ======================================================
// タブレット・スマホの長押しによる右クリックメニューを全アプリで無効化
//
// layout.tsx（サーバーコンポーネント）では onContextMenu を使えないため、
// このクライアントコンポーネントでグローバルに登録する。
//
// 無効化する操作:
//   contextmenu: 長押しによる右クリックメニューの表示を禁止
//
// ※ dragstart は禁止しない。
//   全 dragstart を preventDefault すると HTML5 DnD（Block/BlockAreaコンポーネント）
//   のマウスドラッグが動かなくなるため。
// ======================================================

import { useEffect } from "react"

export default function NoContextMenu() {
  useEffect(() => {
    // 長押し右クリックメニューを禁止
    const preventContextMenu = (e: MouseEvent) => e.preventDefault()

    document.addEventListener("contextmenu", preventContextMenu)

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu)
    }
  }, [])

  // 描画するUIはない。イベント登録だけのコンポーネント
  return null
}
