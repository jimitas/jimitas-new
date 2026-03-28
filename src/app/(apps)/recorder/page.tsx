"use client"

// ======================================================
// リコーダー（けんばん + 運指表示）
//
// URL: /recorder
// 対象: 小学3〜5年生（音楽）
//
// 【音域】ﾄﾞ4（soundIndex 8）〜 ﾚ6（soundIndex 34）
// 【操作】タッチ・マウスのみ
// ======================================================

import { useState, useCallback } from "react"
import { useAudioUnlock } from "@/hooks/useAudioUnlock"
import { useInstrumentSounds } from "@/hooks/useInstrumentSounds"

// ── 鍵盤データ型 ──────────────────────────────────────

type PianoKey = {
  soundIndex: number  // 90台はスペーサー
  note: string
}

// ── 白鍵データ（16本：ﾄﾞ4〜ﾚ6）─────────────────────────

const WH_KEYS: PianoKey[] = [
  { soundIndex: 8,  note: "ﾄﾞ" },
  { soundIndex: 10, note: "ﾚ"   },
  { soundIndex: 12, note: "ﾐ"   },
  { soundIndex: 13, note: "ﾌｧ" },
  { soundIndex: 15, note: "ｿ"   },
  { soundIndex: 17, note: "ﾗ"   },
  { soundIndex: 19, note: "ｼ"   },
  { soundIndex: 20, note: "ﾄﾞ" },
  { soundIndex: 22, note: "ﾚ"   },
  { soundIndex: 24, note: "ﾐ"   },
  { soundIndex: 25, note: "ﾌｧ" },
  { soundIndex: 27, note: "ｿ"   },
  { soundIndex: 29, note: "ﾗ"   },
  { soundIndex: 31, note: "ｼ"   },
  { soundIndex: 32, note: "ﾄﾞ" },
  { soundIndex: 34, note: "ﾚ"   },
]

// ── 黒鍵データ（15本：スペーサー4本含む）─────────────
// soundIndex 91〜94 はスペーサー（ﾐ→ﾌｧ、ｼ→ﾄﾞの隙間）

const BK_KEYS: PianoKey[] = [
  { soundIndex: 9,  note: "#ﾄﾞ" },
  { soundIndex: 11, note: "#ﾚ"  },
  { soundIndex: 91, note: ""    },
  { soundIndex: 14, note: "#ﾌｧ" },
  { soundIndex: 16, note: "#ｿ"  },
  { soundIndex: 18, note: "#ﾗ"  },
  { soundIndex: 92, note: ""    },
  { soundIndex: 21, note: "#ﾄﾞ" },
  { soundIndex: 23, note: "#ﾚ"  },
  { soundIndex: 93, note: ""    },
  { soundIndex: 26, note: "#ﾌｧ" },
  { soundIndex: 28, note: "#ｿ"  },
  { soundIndex: 30, note: "#ﾗ"  },
  { soundIndex: 94, note: ""    },
  { soundIndex: 33, note: "#ﾄﾞ" },
]

// ── 運指データ ────────────────────────────────────────
// FINGERING[soundIndex] = 10穴の状態配列
//   0=あける  1=おさえる  2=サミング（親指半開き）
// 穴順: [hole0=親指裏, hole1=人差L, hole2=中L, hole3=薬L,
//         hole4=人差R, hole5=中R, hole6=薬Ra, hole7=薬Rb,
//         hole8=小Ra, hole9=小Rb]

const FINGERING: Record<number, number[]> = {
  8:  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  9:  [1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
  10: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  11: [1, 1, 1, 1, 1, 1, 0, 1, 0, 0],
  12: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  13: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  14: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
  15: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  16: [1, 1, 1, 0, 1, 1, 0, 1, 0, 0],
  17: [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  18: [1, 1, 0, 1, 1, 0, 0, 0, 0, 0],
  19: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  20: [1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  21: [0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  22: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  23: [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  24: [2, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  25: [2, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  26: [2, 1, 1, 1, 0, 1, 0, 0, 1, 1],
  27: [2, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  28: [2, 1, 1, 1, 0, 1, 0, 0, 0, 0],
  29: [2, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  30: [2, 1, 1, 0, 1, 1, 1, 1, 0, 0],
  31: [2, 1, 1, 0, 1, 1, 0, 0, 0, 0],
  32: [2, 1, 0, 0, 1, 1, 0, 0, 0, 0],
  33: [2, 1, 0, 1, 1, 0, 1, 1, 1, 1],
  34: [2, 1, 0, 1, 1, 0, 1, 1, 0, 0],
}

// ── 運指表示コンポーネント ────────────────────────────
//
// 2カラムレイアウト:
//   左カラム: hole0（親指・裏）
//   右カラム: hole1〜hole9（表側・上から下へ）

function RecorderFingering({ holes }: { holes: number[] }) {
  // 穴のスタイル: 0=あける, 1=おさえる, 2=サミング
  const holeStyle = (state: number, small = false): React.CSSProperties => {
    const size = small ? 28 : 42   // 大きめサイズ
    const base: React.CSSProperties = {
      width: size,
      height: size,
      borderRadius: "50%",
      border: "2px solid #7a5a3a",
      display: "inline-block",
      flexShrink: 0,
    }
    if (state === 2) {
      return { ...base, background: "linear-gradient(90deg, #1a1a1a 50%, #f5e6c8 50%)" }
    }
    return { ...base, backgroundColor: state === 1 ? "#1a1a1a" : "#f5e6c8" }
  }

  return (
    <div className="flex flex-col items-center gap-3 py-5 px-6 bg-amber-50 border border-amber-200 rounded-xl select-none">
      <p className="text-base font-bold text-amber-800 mb-0.5">運指</p>

      <div className="flex gap-5 items-end">

        {/* 左カラム: 親指（裏）*/}
        <div className="relative flex items-center justify-center">
          <div style={holeStyle(holes[0])} />
          <span className="absolute top-full mt-1 text-xs text-amber-700 font-bold leading-none whitespace-nowrap">裏</span>
        </div>

        {/* 右カラム: 表側の穴（上=高音から下=低音） */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <div style={holeStyle(holes[8], true)} />
            <div style={holeStyle(holes[9], true)} />
          </div>
          <div className="flex gap-2">
            <div style={holeStyle(holes[6], true)} />
            <div style={holeStyle(holes[7], true)} />
          </div>
          <div style={holeStyle(holes[5])} />
          <div style={holeStyle(holes[4])} />
          <div style={holeStyle(holes[3])} />
          <div style={holeStyle(holes[2])} />
          <div style={holeStyle(holes[1])} />
        </div>

      </div>
    </div>
  )
}

// ── ページコンポーネント ──────────────────────────────

export default function RecorderPage() {
  useAudioUnlock()
  const { playSound, stopSound } = useInstrumentSounds("re_", 34)

  const [activeFingering, setActiveFingering] = useState<number[]>(
    new Array(10).fill(0)
  )

  const handlePressDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const idx = Number((e.currentTarget as HTMLElement).id)
    if (idx >= 8 && idx <= 34) {
      playSound(idx)
      ;(e.currentTarget as HTMLElement).style.filter = "brightness(1.4)"
      const f = FINGERING[idx]
      if (f) setActiveFingering([...f])
    }
  }, [playSound])

  const handlePressUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const idx = Number((e.currentTarget as HTMLElement).id)
    if (idx >= 8 && idx <= 34) {
      stopSound(idx)
      ;(e.currentTarget as HTMLElement).style.filter = ""
    }
  }, [stopSound])

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    const idx = Number((e.currentTarget as HTMLElement).id)
    if (idx >= 8 && idx <= 34) {
      stopSound(idx)
      ;(e.currentTarget as HTMLElement).style.filter = ""
    }
  }, [stopSound])

  return (
    <main className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-1">リコーダー</h1>
      <p className="text-center text-sm text-gray-500 mb-4">
        けんばんをおして演奏しよう・運指をかくにんしてね
      </p>

      {/* 運指図・凡例・鍵盤を横並び */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">

        {/* 左エリア: 運指図 + 凡例（幅固定・縮まない） */}
        <div className="flex flex-col items-center md:items-start gap-4 md:shrink-0">
          <RecorderFingering holes={activeFingering} />

          {/* 凡例 */}
          <div className="text-sm text-gray-600">
            <p className="font-bold text-gray-700 mb-2">●運指の見かた</p>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-block w-6 h-6 rounded-full border-2 border-amber-700 bg-amber-100 flex-shrink-0" />
              <span>あける</span>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-block w-6 h-6 rounded-full border-2 border-amber-700 bg-gray-900 flex-shrink-0" />
              <span>おさえる</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-6 h-6 rounded-full border-2 border-amber-700 flex-shrink-0"
                style={{ background: "linear-gradient(90deg, #1a1a1a 50%, #fef3c7 50%)" }}
              />
              <span>サミング（半開き）</span>
            </div>
          </div>
        </div>

        {/* 右エリア: ピアノ鍵盤
            max-w-[768px] mx-auto: h-72(288px)×(16/6)=768px を上限にして
            1鍵あたりの横幅が広くなりすぎないよう制限しつつ中央寄せ
        */}
        <div className="flex-1 min-w-0">
          <div className="relative w-full max-w-[768px] mx-auto h-56 md:h-80">

            {/* 黒鍵（パーセント位置・z-20で白鍵より前面） */}
            {BK_KEYS.map((key, i) => {
              const leftPct = (i + 1) * (100 / 16) - 1.875
              const isSpacer = key.soundIndex > 90
              if (isSpacer) {
                return <div key={key.soundIndex} className="absolute z-20 pointer-events-none" style={{ left: `${leftPct}%`, width: "3.75%", height: "60%" }} />
              }
              return (
                <div
                  key={key.soundIndex}
                  id={String(key.soundIndex)}
                  className="absolute z-20 bg-gray-800 text-white flex flex-col items-center justify-end pb-2 border border-gray-500 rounded-b cursor-pointer hover:bg-red-400 active:translate-y-1 select-none"
                  style={{ left: `${leftPct}%`, width: "3.75%", height: "60%" }}
                  onMouseDown={handlePressDown}
                  onMouseUp={handlePressUp}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handlePressDown}
                  onTouchEnd={handlePressUp}
                >
                  <span className="font-bold text-[0.65rem] text-gray-100 leading-tight text-center">
                    {key.note}
                  </span>
                </div>
              )
            })}

            {/* 白鍵（flex-1 で均等展開・z-10） */}
            <div className="absolute inset-0 flex">
              {WH_KEYS.map((key) => (
                <div
                  key={key.soundIndex}
                  id={String(key.soundIndex)}
                  className="relative flex-1 h-full z-10 bg-white text-gray-900 flex flex-col items-center justify-end pb-2 border border-gray-400 rounded-b cursor-pointer hover:bg-red-100 active:translate-y-1 select-none"
                  onMouseDown={handlePressDown}
                  onMouseUp={handlePressUp}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handlePressDown}
                  onTouchEnd={handlePressUp}
                >
                  <span className="font-bold text-sm text-gray-700 leading-tight">
                    {key.note}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </main>
  )
}
