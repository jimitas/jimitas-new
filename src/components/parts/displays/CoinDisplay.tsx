// ======================================================
// CoinDisplay コンポーネント（共通）
//
// 獲得コイン数を 🪙 アイコンで表示する共通部品。
// useCoins フックと連携し、正解ごとに自動更新される。
//
// 使い方:
//   問題を含むアプリの描画エリア末尾に配置するだけ。
//   コインの加算は各アプリで addCoins(1) を呼ぶ。
// ======================================================

"use client"

import { useCoins } from "@/hooks/useCoins"

export function CoinDisplay() {
  const { coins } = useCoins()

  return (
    <div
      className="flex items-center gap-3 mx-auto my-4 px-4 py-3
                 rounded-xl bg-amber-50 border-2 border-amber-300
                 dark:bg-amber-950 dark:border-amber-700"
      style={{ width: "max(44vw, 320px)" }}
    >
      {/* コインアイコン表示エリア */}
      <div className="flex flex-wrap gap-1 flex-1 min-h-[44px] items-center">
        {Array.from({ length: coins }).map((_, i) => (
          <span key={i} className="text-2xl leading-none">🪙</span>
        ))}
        {coins === 0 && (
          <span className="text-sm text-amber-600 dark:text-amber-400">
            せいかいするとコインがもらえるよ！
          </span>
        )}
      </div>

      {/* 枚数テキスト */}
      <div className="text-right shrink-0 text-amber-700 dark:text-amber-300 font-bold text-sm">
        {coins}まい
      </div>
    </div>
  )
}
