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

import { useState, useEffect } from "react"

export default function DarkModeToggle() {
  // ダークモードかどうかを状態として持つ
  const [isDark, setIsDark] = useState(false)

  // ページ読み込み時に localStorage から設定を復元
  // （テーマスクリプトが html に適用済みなので、状態と同期させる）
  useEffect(() => {
    const saved = localStorage.getItem("jimitas_dark")
    setIsDark(saved === "true")
  }, [])

  // ダークモードを切り替える
  const toggle = () => {
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
