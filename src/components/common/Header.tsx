// ======================================================
// Header コンポーネント
//
// 2段構成：
//   上段：ロゴ（猫アイコン＋サイト名）/ ツール類（フォント・ダーク・コイン）
//   下段：学年ジャンプナビ ＋ jimitasについて
// ======================================================

"use client"

import Link from "next/link"
import { useCoins } from "@/hooks/useCoins"
import FontToggle from "@/components/common/FontToggle"
import DarkModeToggle from "@/components/common/DarkModeToggle"

// 学年ジャンプナビの定義（page.tsx の SECTIONS の id と対応）
const NAV_ITEMS = [
  { label: "1ねん", href: "#grade-1" },
  { label: "2年",   href: "#grade-2" },
  { label: "3年",   href: "#grade-3" },
  { label: "4年",   href: "#grade-4" },
  { label: "5年",   href: "#grade-5" },
  { label: "6年",   href: "#grade-6" },
  { label: "🎵 音楽・その他", href: "#tools" },
  { label: "📄 教材作成",     href: "#print" },
]

export default function Header() {
  const { coins } = useCoins()

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">

      {/* ===== 上段：ロゴ ＋ ツール類 ===== */}
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-4">

        {/* --- ロゴ --- */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
          {/* Font Awesome の猫アイコン（黒） */}
          <i className="fa-solid fa-cat text-2xl text-gray-900 dark:text-gray-100" />
          {/* サイト名（黒） */}
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Jimitas
          </span>
          {/* キャッチフレーズ（タブレット以上） */}
          <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-500">
            地味に助かる学習コンテンツ
          </span>
        </Link>

        {/* --- 右側：ツール類 --- */}
        <div className="flex items-center gap-1">
          <FontToggle />
          <DarkModeToggle />
          {/* コイン残数 */}
          <div className="flex items-center gap-1 bg-warm-50 dark:bg-gray-700 border border-warm-200 dark:border-gray-600 rounded-full px-3 py-1 ml-1">
            <span className="text-sm">🪙</span>
            <span className="text-sm font-bold text-warm-600 dark:text-warm-400">{coins}</span>
          </div>
        </div>
      </div>

      {/* ===== 下段：学年ジャンプナビ ===== */}
      <nav className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
        <ul className="max-w-5xl mx-auto px-4 flex items-center gap-1 py-1 whitespace-nowrap">
          {/* 学年・セクションのジャンプリンク */}
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="block px-3 py-1 text-xs font-medium rounded text-gray-600 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
              >
                {item.label}
              </a>
            </li>
          ))}

          {/* 区切り線 */}
          <li className="text-gray-300 dark:text-gray-600 px-1 select-none">|</li>

          {/* jimitasについて（ページ遷移リンク） */}
          <li>
            <Link
              href="/about"
              className="block px-3 py-1 text-xs font-medium rounded text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              jimitasについて
            </Link>
          </li>
        </ul>
      </nav>

    </header>
  )
}
