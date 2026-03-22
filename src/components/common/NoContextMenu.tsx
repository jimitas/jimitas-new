"use client"

// ======================================================
// タブレット・スマホの長押しによる右クリックメニューを全アプリで無効化
//
// layout.tsx（サーバーコンポーネント）では onContextMenu を使えないため、
// このクライアントコンポーネントでグローバルに登録する。
// ======================================================

import { useEffect } from "react"

export default function NoContextMenu() {
  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault()
    document.addEventListener("contextmenu", handler)
    return () => document.removeEventListener("contextmenu", handler)
  }, [])

  // 描画するUIはない。イベント登録だけのコンポーネント
  return null
}
