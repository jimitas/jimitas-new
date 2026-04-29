// ======================================================
// CoinDisplay コンポーネント（共通）
//
// 獲得コイン数を 1・10・100・1000 の4段階でまとめて表示。
// コインのサイズで単位を区別する（大きいほど高単位）。
//
// 単位の区切り:
//   1000コイン → 特大の金色コイン
//    100コイン → 大きめの橙色コイン
//     10コイン → 中サイズの黄色コイン
//      1コイン → 小さい明黄色コイン
//
// 使い方:
//   各ページで useCoins() を呼び、coins を prop で渡す。
//   これにより addCoins() の直後に確実に表示が更新される。
//
//   例）
//     const { coins, addCoins } = useCoins()
//     <CoinDisplay coins={coins} />
// ======================================================

"use client"

// ── コイン1枚の見た目 ─────────────────────────────────

interface CoinProps {
  /** 表示する単位（1・10・100・1000） */
  unit: 1 | 10 | 100 | 1000
}

// 単位ごとのスタイル定義
const COIN_STYLE: Record<number, { size: string; bg: string; border: string; text: string; label: string }> = {
  1: {
    size:   "w-7 h-7",
    bg:     "bg-yellow-200",
    border: "border-2 border-yellow-400",
    text:   "text-yellow-700 text-xs font-bold",
    label:  "1",
  },
  10: {
    size:   "w-10 h-10",
    bg:     "bg-yellow-400",
    border: "border-2 border-yellow-600",
    text:   "text-yellow-900 text-xs font-bold",
    label:  "10",
  },
  100: {
    size:   "w-14 h-14",
    bg:     "bg-amber-500",
    border: "border-[3px] border-amber-700",
    text:   "text-white text-xs font-bold",
    label:  "100",
  },
  1000: {
    size:   "w-20 h-20",
    bg:     "bg-linear-to-br from-yellow-300 via-amber-400 to-yellow-600",
    border: "border-4 border-amber-800",
    text:   "text-amber-900 text-sm font-black",
    label:  "1000",
  },
}

function Coin({ unit }: CoinProps) {
  const s = COIN_STYLE[unit]
  return (
    <div
      className={`${s.size} ${s.bg} ${s.border} rounded-full
                  flex items-center justify-center shrink-0
                  shadow-md select-none`}
    >
      <span className={s.text}>{s.label}</span>
    </div>
  )
}

// ── CoinDisplay 本体 ──────────────────────────────────

interface CoinDisplayProps {
  /** 現在のコイン枚数（親コンポーネントから useCoins().coins を渡す） */
  coins: number
  /** リセットボタンを表示する場合に渡す（省略可） */
  onReset?: () => void
  /** 外から幅などを上書きしたい場合に渡す（省略可） */
  className?: string
}

export function CoinDisplay({ coins, onReset, className }: CoinDisplayProps) {
  // コインを4段階に分解
  const thousands = Math.floor(coins / 1000)
  const hundreds  = Math.floor((coins % 1000) / 100)
  const tens      = Math.floor((coins % 100) / 10)
  const ones      = coins % 10

  return (
    <div
      className={`w-full mx-auto my-4 px-4 py-3
                 rounded-xl bg-amber-50 border-2 border-amber-300
                 dark:bg-amber-950 dark:border-amber-700
                 ${className ?? ""}`}
    >
      {/* コイン表示エリア */}
      <div className="flex flex-wrap gap-2 items-end min-h-[44px]">
        {/* 1000コイン */}
        {Array.from({ length: thousands }).map((_, i) => (
          <Coin key={`k${i}`} unit={1000} />
        ))}
        {/* 100コイン */}
        {Array.from({ length: hundreds }).map((_, i) => (
          <Coin key={`h${i}`} unit={100} />
        ))}
        {/* 10コイン */}
        {Array.from({ length: tens }).map((_, i) => (
          <Coin key={`t${i}`} unit={10} />
        ))}
        {/* 1コイン */}
        {Array.from({ length: ones }).map((_, i) => (
          <Coin key={`o${i}`} unit={1} />
        ))}

        {/* コインが0枚のときのメッセージ */}
        {coins === 0 && (
          <span className="text-sm text-amber-600 dark:text-amber-400 self-center">
            せいかいするとコインがもらえるよ！
          </span>
        )}
      </div>

      {/* 合計枚数 + リセットボタン */}
      <div className="flex justify-end items-center gap-3 mt-2">
        <span className="text-amber-700 dark:text-amber-300 font-bold text-sm">
          ぜんぶで {coins} まい
        </span>
        {onReset && (
          <button
            onClick={onReset}
            className="text-xs px-2 py-1 bg-danger-400 hover:bg-danger-500
                       text-white rounded-lg font-bold transition-colors"
          >
            リセット
          </button>
        )}
      </div>
    </div>
  )
}
