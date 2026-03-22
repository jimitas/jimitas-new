"use client"

// ======================================================
// もっきん
//
// 旧版 22mokn.js の CSS・レイアウトを忠実に再現。
// XylophoneBoard コンポーネントで描画し、
// useAudioUnlock / useInstrumentSounds フックで音声管理する。
// ======================================================

import { useCallback } from "react"
import { useAudioUnlock } from "@/hooks/useAudioUnlock"
import { useInstrumentSounds } from "@/hooks/useInstrumentSounds"
import XylophoneBoard, { BarItem } from "@/components/parts/block/XylophoneBoard"

// ── バーデータ ────────────────────────────────────────
// soundIndex === 0 はスペーサー（音なし・バーなし）

const BK_BARS: BarItem[] = [
  { soundIndex: 2,  note: "#ﾌｧ/♭ソ" },
  { soundIndex: 4,  note: "#ソ/♭ラ"  },
  { soundIndex: 6,  note: "#ラ/♭シ"  },
  { soundIndex: 0,  note: ""          },  // スペーサー（ミ〜ファの間）
  { soundIndex: 9,  note: "#ド/♭レ"  },
  { soundIndex: 11, note: "#レ/♭ミ"  },
  { soundIndex: 0,  note: ""          },  // スペーサー（シ〜ドの間）
  { soundIndex: 14, note: "#ﾌｧ/♭ソ" },
  { soundIndex: 16, note: "#ソ/♭ラ"  },
  { soundIndex: 18, note: "#ラ/♭シ"  },
  { soundIndex: 0,  note: ""          },  // スペーサー
  { soundIndex: 21, note: "#ド/♭レ"  },
  { soundIndex: 23, note: "#レ/♭ミ"  },
  { soundIndex: 0,  note: ""          },  // スペーサー
  { soundIndex: 26, note: "#ﾌｧ/♭ソ" },
]

const WH_BARS: BarItem[] = [
  { soundIndex: 1,  note: "ﾌｧ" },
  { soundIndex: 3,  note: "ソ"   },
  { soundIndex: 5,  note: "ラ"   },
  { soundIndex: 7,  note: "シ"   },
  { soundIndex: 8,  note: "ド"   },
  { soundIndex: 10, note: "レ"   },
  { soundIndex: 12, note: "ミ"   },
  { soundIndex: 13, note: "ﾌｧ" },
  { soundIndex: 15, note: "ソ"   },
  { soundIndex: 17, note: "ラ"   },
  { soundIndex: 19, note: "シ"   },
  { soundIndex: 20, note: "ド"   },
  { soundIndex: 22, note: "レ"   },
  { soundIndex: 24, note: "ミ"   },
  { soundIndex: 25, note: "ﾌｧ" },
  { soundIndex: 27, note: "ソ"   },
]

// もっきんのバー色（こげ茶）
const BAR_COLOR = "#691c0d"

// ── ページコンポーネント ──────────────────────────────

export default function MokkinPage() {
  useAudioUnlock()
  const { playSound, stopSound } = useInstrumentSounds("mo_", 34)

  const handlePressDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const idx = Number((e.currentTarget as HTMLElement).dataset.sound)
    if (idx > 0) {
      playSound(idx)
      ;(e.currentTarget as HTMLElement).style.filter = "brightness(1.4)"
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
      <h1 className="text-2xl font-bold text-center mb-1">もっきん</h1>
      <p className="text-center text-sm text-gray-500 mb-6">
        けんばんをおして演奏しよう
      </p>
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
