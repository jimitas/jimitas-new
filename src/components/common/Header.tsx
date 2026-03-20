// ======================================================
// Header コンポーネント
//
// 全ページ共通のヘッダー。
// - 左：サイト名（クリックでトップページへ）
// - 右：コイン残数の表示
//
// "use client" が必要な理由：
//   useCoins フックの中で localStorage（ブラウザのAPI）を使っているため。
//   Next.js の App Router では、ブラウザ専用の処理は
//   "use client" と書いたコンポーネントの中でしか使えない。
// ======================================================

"use client"

import Link from "next/link"
import { useCoins } from "@/hooks/useCoins"

export default function Header() {
  // コイン残数を取得する
  const { coins } = useCoins()

  return (
    // sticky top-0：スクロールしてもヘッダーが上部に固定される
    // z-10：他の要素より手前に表示する（重なり順）
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* ===== 左側：サイト名 ===== */}
        {/* Link はNext.jsの部品。<a>タグと違い、ページ全体をリロードせずに遷移できる */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {/* サイト名 */}
          <span className="text-xl font-bold text-orange-500">Jimitas</span>
          {/* キャッチフレーズ（タブレット以上で表示） */}
          <span className="hidden sm:block text-sm text-gray-500">
            地味に助かる学習コンテンツ
          </span>
        </Link>

        {/* ===== 右側：コイン残数 ===== */}
        <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
          {/* コインアイコン（絵文字） */}
          <span className="text-base">🪙</span>
          {/* コイン数 */}
          <span className="text-sm font-bold text-orange-600">{coins}</span>
        </div>

      </div>
    </header>
  )
}
