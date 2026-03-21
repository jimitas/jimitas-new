// ======================================================
// SoundPreloader コンポーネント
//
// アプリ起動時に UI 効果音を事前にロードする。
// これにより、初回クリック時の音の遅延をなくす。
// layout.tsx から呼び出す（UIは何も表示しない）。
// ======================================================

"use client"

import { useEffect } from "react"
import { preloadUISounds } from "@/hooks/useSound"
import { preloadAll as preloadSe } from "@/lib/se"

export default function SoundPreloader() {
  useEffect(() => {
    preloadUISounds()  // ヘッダー・ナビ系の効果音
    preloadSe()        // アプリ内効果音（pi, right, alert など全種）
  }, [])

  return null
}
