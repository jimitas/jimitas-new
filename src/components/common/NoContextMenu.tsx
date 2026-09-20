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
    // ── ハイドレーション完了の目印 ─────────────────────
    // これはテストのために置いている。
    //
    // React のハイドレーション不整合は「ハイドレーション中」に console へ出る。
    // effect はハイドレーションが終わったあとに走るので、
    // **この属性が付いた時点で不整合のエラーは出そろっている。**
    //
    // これが無いと、テスト側は「たぶんこれくらい待てば終わるだろう」という
    // 固定時間で待つしかない。短すぎればエラーを見逃して緑になり、
    // 長すぎれば全アプリぶん遅くなる。どちらも良くない。
    //
    // 消さないこと。消すと tests/smoke.spec.ts が待てなくなる。
    document.documentElement.dataset.hydrated = "1"

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
