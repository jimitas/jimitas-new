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

export default function SoundPreloader() {
  useEffect(() => {
    preloadUISounds()
  }, [])

  return null
}
