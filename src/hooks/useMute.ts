// ======================================================
// useMute フック
//
// サイト全体の効果音ミュート ON/OFF を管理する。
// 設定は localStorage に保存し、次回アクセス時も維持される。
//
// 使い方：
//   const { isMuted, toggleMute } = useMute()
// ======================================================

"use client"

import { useState, useEffect } from "react"

// localStorage に保存するキー名
const STORAGE_KEY = "jimitas_mute"

export function useMute() {
  const [isMuted, setIsMuted] = useState(false)

  // マウント時に localStorage から設定を復元
  useEffect(() => {
    setIsMuted(localStorage.getItem(STORAGE_KEY) === "true")
  }, [])

  // ミュートを切り替えて localStorage に保存
  const toggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    localStorage.setItem(STORAGE_KEY, String(next))
  }

  return { isMuted, toggleMute }
}
