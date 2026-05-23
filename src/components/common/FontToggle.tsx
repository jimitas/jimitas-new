// ======================================================
// FontToggle コンポーネント
//
// UD教科書体 と UDゴシック を切り替える。
//
// フォールバックチェーン:
//   教科書体: UD デジタル 教科書体 N-R（Windows優先）→ BIZ UDPGothic
//   ゴシック: BIZ UDGothic → var(--font-biz-ud-gothic)
//
// 仕組み: JS で document.body.style.fontFamily を直接書き換える。
//   インラインスタイルは CSS のどのルールよりも優先される。
// ======================================================

"use client"

import { useState, useEffect } from "react"
import { useSound, UI_SOUNDS } from "@/hooks/useSound"

const FONT_VALUES = {
  kyokasho: '"UD Digi Kyokasho N-R", "UD デジタル 教科書体 N-R", var(--font-biz-udp-gothic), sans-serif',
  gothic:   '"BIZ UDGothic", var(--font-biz-ud-gothic), sans-serif',
}

export default function FontToggle() {
  // サーバーとクライアントで同じ初期値にしてハイドレーション不一致を防ぐ
  const [font, setFont] = useState<"kyokasho" | "gothic">("kyokasho")
  const { play } = useSound()

  // 初回マウント時に localStorage から復元（SSR後に1回だけ実行）
  useEffect(() => {
    const saved = localStorage.getItem("jimitas_font")
    if (saved === "gothic") {
      // SSR/hydration の安全のために useEffect 内で setState する意図的な実装。
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFont("gothic")
      document.body.style.fontFamily = FONT_VALUES["gothic"]
    } else {
      document.body.style.fontFamily = FONT_VALUES["kyokasho"]
    }
  }, [])

  // font の変更を body のインラインスタイルに反映
  useEffect(() => {
    document.body.style.fontFamily = FONT_VALUES[font]
  }, [font])

  const toggle = () => {
    play(UI_SOUNDS.fontToggle)
    const next: "kyokasho" | "gothic" = font === "kyokasho" ? "gothic" : "kyokasho"
    setFont(next)
    document.body.style.fontFamily = FONT_VALUES[next]
    localStorage.setItem("jimitas_font", next)
  }

  return (
    <button
      onClick={toggle}
      title={font === "kyokasho" ? "UDゴシックに切り替え" : "UD教科書体に切り替え"}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <span className="text-sm">🔤</span>
      <span className="hidden sm:inline">
        {font === "kyokasho" ? "教科書体" : "UDゴシック"}
      </span>
    </button>
  )
}
