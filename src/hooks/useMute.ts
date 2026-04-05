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
import { Howler } from "howler"

// localStorage に保存するキー名
const STORAGE_KEY = "jimitas_mute"

export function useMute() {
  // localStorage から初期値を復元
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(STORAGE_KEY) === "true"
  })

  // howler.js のミュート状態を同期
  useEffect(() => {
    Howler.mute(isMuted)
  }, [isMuted])

  // ミュートを切り替えて localStorage と howler.js の両方に保存
  const toggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    localStorage.setItem(STORAGE_KEY, String(next))
    Howler.mute(next)  // howler.js 全体のミュートを同期する
  }

  return { isMuted, toggleMute }
}
