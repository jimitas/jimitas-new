"use client"

// ======================================================
// リコーダー（けんばん + 運指表示）
//
// 旧版 07reco.js の移植。
// けんばん（XylophoneBoard）で演奏でき、
// 演奏中の音の運指を図でリアルタイム表示する。
//
// 【音域】ﾄﾞ4（soundIndex 8）〜 ﾚ6（soundIndex 34）
//
// 【操作】タッチ・マウスのみ
// ======================================================

import { useState, useCallback } from "react"
import { useAudioUnlock } from "@/hooks/useAudioUnlock"
import { useInstrumentSounds } from "@/hooks/useInstrumentSounds"
import XylophoneBoard, { BarItem } from "@/components/parts/block/XylophoneBoard"

// ── バーデータ ────────────────────────────────────────
// 旧版 No[] 配列の値をそのまま soundIndex に対応させている

const BK_BARS: BarItem[] = [
  { soundIndex: 9,  note: "#ﾄﾞ/♭ﾚ" },
  { soundIndex: 11, note: "#ﾚ/♭ﾐ"  },
  { soundIndex: 0,  note: ""         },  // スペーサー（ﾐ〜ﾌｧの間）
  { soundIndex: 14, note: "#ﾌｧ/♭ｿ" },
  { soundIndex: 16, note: "#ｿ/♭ﾗ"  },
  { soundIndex: 18, note: "#ﾗ/♭ｼ"  },
  { soundIndex: 0,  note: ""         },  // スペーサー（ｼ〜ﾄﾞの間）
  { soundIndex: 21, note: "#ﾄﾞ/♭ﾚ" },
  { soundIndex: 23, note: "#ﾚ/♭ﾐ"  },
  { soundIndex: 0,  note: ""         },  // スペーサー
  { soundIndex: 26, note: "#ﾌｧ/♭ｿ" },
  { soundIndex: 28, note: "#ｿ/♭ﾗ"  },
  { soundIndex: 30, note: "#ﾗ/♭ｼ"  },
  { soundIndex: 0,  note: ""         },  // スペーサー
  { soundIndex: 33, note: "#ﾄﾞ/♭ﾚ" },
]

const WH_BARS: BarItem[] = [
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

// リコーダーのバー色（温かみのある木製感）
const BAR_COLOR = "#8b5e3c"

// ── 運指データ ────────────────────────────────────────
// FINGERING[soundIndex] = 10穴の状態配列
//   0 = あける（開放）
//   1 = おさえる（閉じる）
//   2 = サミング（親指穴を半開き）
//
// 旧版: Finger(soundIndex - 7) で参照していた（u1〜u27）
// 穴の順: [hole0=親指, hole1=人差L, hole2=中L, hole3=薬L,
//          hole4=人差R, hole5=中R, hole6=薬Ra, hole7=薬Rb,
//          hole8=小Ra, hole9=小Rb]

const FINGERING: Record<number, number[]> = {
  8:  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  // ﾄﾞ低
  9:  [1, 1, 1, 1, 1, 1, 1, 1, 0, 1],  // #ﾄﾞ/♭ﾚ低
  10: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],  // ﾚ低
  11: [1, 1, 1, 1, 1, 1, 0, 1, 0, 0],  // #ﾚ/♭ﾐ低
  12: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0],  // ﾐ低
  13: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],  // ﾌｧ低
  14: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],  // #ﾌｧ/♭ｿ低
  15: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0],  // ｿ低
  16: [1, 1, 1, 0, 1, 1, 0, 1, 0, 0],  // #ｿ/♭ﾗ低
  17: [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],  // ﾗ低
  18: [1, 1, 0, 1, 1, 0, 0, 0, 0, 0],  // #ﾗ/♭ｼ低
  19: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],  // ｼ低
  20: [1, 0, 1, 0, 0, 0, 0, 0, 0, 0],  // ﾄﾞ中
  21: [0, 1, 1, 0, 0, 0, 0, 0, 0, 0],  // #ﾄﾞ/♭ﾚ中
  22: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],  // ﾚ中
  23: [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],  // #ﾚ/♭ﾐ中
  24: [2, 1, 1, 1, 1, 1, 0, 0, 0, 0],  // ﾐ中
  25: [2, 1, 1, 1, 1, 0, 0, 0, 0, 0],  // ﾌｧ中
  26: [2, 1, 1, 1, 0, 1, 0, 0, 1, 1],  // #ﾌｧ/♭ｿ中
  27: [2, 1, 1, 1, 0, 0, 0, 0, 0, 0],  // ｿ中
  28: [2, 1, 1, 1, 0, 1, 0, 0, 0, 0],  // #ｿ/♭ﾗ中
  29: [2, 1, 1, 0, 0, 0, 0, 0, 0, 0],  // ﾗ中
  30: [2, 1, 1, 0, 1, 1, 1, 1, 0, 0],  // #ﾗ/♭ｼ中
  31: [2, 1, 1, 0, 1, 1, 0, 0, 0, 0],  // ｼ中
  32: [2, 1, 0, 0, 1, 1, 0, 0, 0, 0],  // ﾄﾞ高
  33: [2, 1, 0, 1, 1, 0, 1, 1, 1, 1],  // #ﾄﾞ/♭ﾚ高
  34: [2, 1, 0, 1, 1, 0, 1, 1, 0, 0],  // ﾚ高
}

// ── 運指表示コンポーネント ────────────────────────────
// リコーダーの10穴を上から下の順で表示する。
// 表示順（上=高音側の穴）:
//   [8,9]   小指ペア（右手）
//   [6,7]   薬指ペア（右手）
//   [5]     中指（右手）
//   [4]     人差し指（右手）
//   [3]     薬指（左手）
//   [2]     中指（左手）
//   [0,1]   親指（左）＋人差し指（左）

function RecorderFingering({ holes }: { holes: number[] }) {
  const holeStyle = (state: number, small = false): React.CSSProperties => {
    const size = small ? 16 : 24
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
    <div className="flex flex-col items-center gap-1.5 py-3 px-4 bg-amber-50 border border-amber-200 rounded-lg select-none">
      <p className="text-xs font-bold text-amber-800 mb-0.5">運指</p>
      {/* 小指ペア */}
      <div className="flex gap-1">
        <div style={holeStyle(holes[8], true)} />
        <div style={holeStyle(holes[9], true)} />
      </div>
      {/* 薬指ペア */}
      <div className="flex gap-1">
        <div style={holeStyle(holes[6], true)} />
        <div style={holeStyle(holes[7], true)} />
      </div>
      {/* 中指R */}
      <div style={holeStyle(holes[5])} />
      {/* 人差R */}
      <div style={holeStyle(holes[4])} />
      {/* 薬指L */}
      <div style={holeStyle(holes[3])} />
      {/* 中指L */}
      <div style={holeStyle(holes[2])} />
      {/* 親指L + 人差L */}
      <div className="flex gap-1">
        <div style={holeStyle(holes[0])} />
        <div style={holeStyle(holes[1])} />
      </div>
    </div>
  )
}

// ── ページコンポーネント ──────────────────────────────

export default function RecorderPage() {
  useAudioUnlock()
  const { playSound, stopSound } = useInstrumentSounds("re_", 34)

  // 現在表示中の運指（初期値: 全開放）
  const [activeFingering, setActiveFingering] = useState<number[]>(
    new Array(10).fill(0)
  )

  const handlePressDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const idx = Number((e.currentTarget as HTMLElement).dataset.sound)
    if (idx > 0) {
      playSound(idx)
      ;(e.currentTarget as HTMLElement).style.filter = "brightness(1.4)"
      // 対応する運指を表示
      const f = FINGERING[idx]
      if (f) setActiveFingering([...f])
    }
  }, [playSound])

  const handlePressUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const idx = Number((e.currentTarget as HTMLElement).dataset.sound)
    if (idx > 0) {
      stopSound(idx)
      ;(e.currentTarget as HTMLElement).style.filter = ""
    }
  }, [stopSound])

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    const idx = Number((e.currentTarget as HTMLElement).dataset.sound)
    if (idx > 0) {
      stopSound(idx)
      ;(e.currentTarget as HTMLElement).style.filter = ""
    }
  }, [stopSound])

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold text-center mb-1">リコーダー</h1>
      <p className="text-center text-sm text-gray-500 mb-6">
        けんばんをおして演奏しよう・運指をかくにんしてね
      </p>

      {/* 運指図 + 凡例 */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6 mb-6">
        {/* 運指図 */}
        <RecorderFingering holes={activeFingering} />

        {/* 凡例 */}
        <div className="text-sm text-gray-600">
          <p className="font-bold text-gray-700 mb-2">●運指の見かた</p>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-block w-5 h-5 rounded-full border-2 border-amber-700 bg-amber-100 flex-shrink-0" />
            <span>あける</span>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-block w-5 h-5 rounded-full border-2 border-amber-700 bg-gray-900 flex-shrink-0" />
            <span>おさえる</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-5 h-5 rounded-full border-2 border-amber-700 flex-shrink-0"
              style={{ background: "linear-gradient(90deg, #1a1a1a 50%, #fef3c7 50%)" }}
            />
            <span>サミング（半開き）</span>
          </div>
        </div>
      </div>

      {/* 鍵盤エリア */}
      <XylophoneBoard
        bkBars={BK_BARS}
        whBars={WH_BARS}
        barColor={BAR_COLOR}
        onPressDown={handlePressDown}
        onPressUp={handlePressUp}
        onMouseLeave={handleMouseLeave}
      />
    </main>
  )
}
