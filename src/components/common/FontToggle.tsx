// ======================================================
// FontToggle コンポーネント
//
// 丸ゴシック（Noto Sans JP）と ゴシック（M PLUS 1p）を切り替える。
//
// 【修正後の仕組み】
//   CSS変数の属性セレクタ方式はTailwindのベーススタイルに
//   負ける場合があるため、JS で直接 document.body.style.fontFamily
//   を上書きする方式に変更。
//   インラインスタイルは CSS のどのルールよりも優先される。
// ======================================================

"use client"

import { useState, useEffect } from "react"
import { useSound, UI_SOUNDS } from "@/hooks/useSound"

// next/font が html 要素に注入する CSS 変数の参照
// layout.tsx で variable: "--font-noto-sans-jp" などと指定したものと対応する
const FONT_VALUES = {
  maru:   "var(--font-noto-sans-jp), sans-serif",
  gothic: "var(--font-m-plus-1p), sans-serif",
}

export default function FontToggle() {
  // localStorage から初期値を復元
  const [font, setFont] = useState<"maru" | "gothic">(() => {
    if (typeof window === "undefined") return "maru"
    const saved = localStorage.getItem("jimitas_font")
    return saved === "gothic" ? "gothic" : "maru"
  })
  const { play } = useSound()

  // font の変更を body のインラインスタイルに反映
  useEffect(() => {
    document.body.style.fontFamily = FONT_VALUES[font]
  }, [font])

  const toggle = () => {
    play(UI_SOUNDS.fontToggle)
    const next: "maru" | "gothic" = font === "maru" ? "gothic" : "maru"
    setFont(next)
    // body のインラインスタイルを直接書き換える
    document.body.style.fontFamily = FONT_VALUES[next]
    localStorage.setItem("jimitas_font", next)
  }

  return (
    <button
      onClick={toggle}
      title={font === "maru" ? "ゴシック体に切り替え" : "丸ゴシックに切り替え"}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <span className="text-sm">🔤</span>
      <span className="hidden sm:inline">
        {font === "maru" ? "丸ゴ" : "ゴシック"}
      </span>
    </button>
  )
}
