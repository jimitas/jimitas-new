// ======================================================
// DarkModeToggle コンポーネント
//
// ライトモードとダークモードを切り替えるボタン。
//
// 仕組み：
//   html 要素の class に "dark" を追加/削除する。
//   globals.css の @custom-variant dark により、
//   dark クラスがついている間は dark: プレフィックスのスタイルが適用される。
//
//   localStorage に保存するため、次回アクセス時も設定が維持される。
//   保存と復元は layout.tsx のテーマスクリプトが行う。
// ======================================================

"use client"

import { useState } from "react"
import { useSound, UI_SOUNDS } from "@/hooks/useSound"

export default function DarkModeToggle() {
  // ダークモードかどうかを状態として持つ（localStorage から初期値を復元）
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("jimitas_dark") === "true"
  })
  const { play } = useSound()

  // ダークモードを切り替える
  const toggle = () => {
    play(UI_SOUNDS.darkMode)
    const next = !isDark
    setIsDark(next)

    // html 要素の class に "dark" を追加/削除
    if (next) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    // localStorage に保存
    localStorage.setItem("jimitas_dark", String(next))
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      {/* 現在のモードに合わせてアイコンを切り替え */}
      <span>{isDark ? "☀️" : "🌙"}</span>
    </button>
  )
}
