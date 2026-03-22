"use client"

// ======================================================
// リコーダー（けんばん + 運指表示）
//
// 旧版 07reco.js の移植。
// ピアノ鍵盤で演奏でき、演奏中の音の運指を図でリアルタイム表示する。
//
// 【音域】ﾄﾞ4（soundIndex 8）〜 ﾚ6（soundIndex 34）
//
// 【操作】タッチ・マウスのみ
// ======================================================

import { useState, useCallback } from "react"
import { useAudioUnlock } from "@/hooks/useAudioUnlock"
import { useInstrumentSounds } from "@/hooks/useInstrumentSounds"

// ── 鍵盤データ型 ──────────────────────────────────────

type PianoKey = {
  soundIndex: number  // 0またはスペーサー用の90台以外は音符インデックス
  note: string
}

// ── 白鍵データ ─────────────────────────────────────────
// soundIndex 8〜34 の白鍵（ﾄﾞ4〜ﾚ6）

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

// ── 黒鍵データ ─────────────────────────────────────────
// soundIndex 91〜94 はスペーサー（ミ→ファ、シ→ドの間に黒鍵がない隙間）

const BK_KEYS: PianoKey[] = [
  { soundIndex: 9,  note: "#ﾄﾞ" },
  { soundIndex: 11, note: "#ﾚ"  },
  { soundIndex: 91, note: ""    },  // スペーサー（ﾐ〜ﾌｧ）
  { soundIndex: 14, note: "#ﾌｧ" },
  { soundIndex: 16, note: "#ｿ"  },
  { soundIndex: 18, note: "#ﾗ"  },
  { soundIndex: 92, note: ""    },  // スペーサー（ｼ〜ﾄﾞ）
  { soundIndex: 21, note: "#ﾄﾞ" },
  { soundIndex: 23, note: "#ﾚ"  },
  { soundIndex: 93, note: ""    },  // スペーサー（ﾐ〜ﾌｧ）
  { soundIndex: 26, note: "#ﾌｧ" },
  { soundIndex: 28, note: "#ｿ"  },
  { soundIndex: 30, note: "#ﾗ"  },
  { soundIndex: 94, note: ""    },  // スペーサー（ｼ〜ﾄﾞ）
  { soundIndex: 33, note: "#ﾄﾞ" },
]

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
//
// 2カラムレイアウト:
//   左カラム: hole0（親指・裏側）を一番下に配置
//   右カラム: hole1〜hole9（表側・上から下へ）
//
// これにより hole1・hole2・hole3 が同じ縦ラインに揃う

function RecorderFingering({ holes }: { holes: number[] }) {
  // 穴のスタイル: 0=あける（薄色）, 1=おさえる（黒）, 2=サミング（半黒）
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

      {/* 2カラム: items-end で両カラムを下揃えにする */}
      <div className="flex gap-3 items-end">

        {/* 左カラム: 親指（裏）*/}
        {/* 「裏」ラベルは absolute で配置し、hole0 のレイアウト高さに影響させない */}
        {/* → items-end により hole0 と hole1 が横方向に揃う */}
        <div className="relative flex items-center justify-center">
          <div style={holeStyle(holes[0])} />
          <span className="absolute top-full mt-0.5 text-[0.6rem] text-amber-700 font-bold leading-none whitespace-nowrap">裏</span>
        </div>

        {/* 右カラム: 表側の穴（上=高音側から下=低音側へ） */}
        <div className="flex flex-col items-center gap-1.5">
          {/* 小指ペア（右手）*/}
          <div className="flex gap-1">
            <div style={holeStyle(holes[8], true)} />
            <div style={holeStyle(holes[9], true)} />
          </div>
          {/* 薬指ペア（右手）*/}
          <div className="flex gap-1">
            <div style={holeStyle(holes[6], true)} />
            <div style={holeStyle(holes[7], true)} />
          </div>
          {/* 中指（右手）*/}
          <div style={holeStyle(holes[5])} />
          {/* 人差し指（右手）*/}
          <div style={holeStyle(holes[4])} />
          {/* 薬指（左手）*/}
          <div style={holeStyle(holes[3])} />
          {/* 中指（左手）*/}
          <div style={holeStyle(holes[2])} />
          {/* 人差し指（左手）— 親指（hole0）と同じ高さに揃う */}
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

  // 現在表示中の運指（初期値: 全開放）
  const [activeFingering, setActiveFingering] = useState<number[]>(
    new Array(10).fill(0)
  )

  // 鍵を押したとき: 音を鳴らし、運指を更新
  const handlePressDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const idx = Number((e.currentTarget as HTMLElement).id)
    if (idx >= 8 && idx <= 34) {
      playSound(idx)
      ;(e.currentTarget as HTMLElement).style.filter = "brightness(1.4)"
      const f = FINGERING[idx]
      if (f) setActiveFingering([...f])
    }
  }, [playSound])

  // 鍵を離したとき: 音を止める
  const handlePressUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const idx = Number((e.currentTarget as HTMLElement).id)
    if (idx >= 8 && idx <= 34) {
      stopSound(idx)
      ;(e.currentTarget as HTMLElement).style.filter = ""
    }
  }, [stopSound])

  // マウスが鍵から外れたとき: 音を止める
  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    const idx = Number((e.currentTarget as HTMLElement).id)
    if (idx >= 8 && idx <= 34) {
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

      {/* 注意書き: 鍵盤の上に配置 */}
      <p className="text-center text-xs text-gray-400 mb-4">
        ※ うまく表示されない場合は「PC版で表示」にしてお試しください
      </p>

      {/* 運指図・凡例・鍵盤を横並び（中央揃え、モバイルは縦積み） */}
      <div className="flex flex-col md:flex-row justify-center items-start gap-6">

        {/* 左エリア: 運指図 + 凡例 */}
        <div className="flex flex-col items-center md:items-start gap-4 md:shrink-0">

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

        {/* 右エリア: ピアノ鍵盤（横スクロール対応） */}
        <div className="overflow-x-auto pb-4">

          {/*
            鍵盤コンテナ。
            白鍵 16 本 × (24px mobile / 40px desktop) = 384px / 640px
          */}
          <div className="relative mx-auto w-[384px] h-40 md:w-[640px] md:h-64">

            {/* 黒鍵行: 白鍵の半幅ぶん右にずらして白鍵の間に入るようにする */}
            <div className="absolute top-0 left-3 md:left-5 flex">
              {BK_KEYS.map((key) => {
                const isSpacer = key.soundIndex > 90
                if (isSpacer) {
                  return (
                    <div key={key.soundIndex} className="w-5 h-24 md:w-9 md:h-40 mx-0.5" />
                  )
                }
                return (
                  <div
                    key={key.soundIndex}
                    id={String(key.soundIndex)}
                    className="select-none w-5 h-24 md:w-9 md:h-40 bg-gray-800 text-white flex flex-col items-center justify-end pb-2 md:pb-3 mx-0.5 border border-gray-500 rounded-b cursor-pointer z-20 hover:bg-red-400 active:translate-y-1"
                    onMouseDown={handlePressDown}
                    onMouseUp={handlePressUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handlePressDown}
                    onTouchEnd={handlePressUp}
                  >
                    <span className="font-bold text-[0.55rem] md:text-xs text-gray-100 leading-tight text-center">
                      {key.note}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* 白鍵行: z-10 で黒鍵の下に入る */}
            <div className="absolute top-0 flex">
              {WH_KEYS.map((key) => (
                <div
                  key={key.soundIndex}
                  id={String(key.soundIndex)}
                  className="select-none w-6 h-40 md:w-10 md:h-64 bg-white text-gray-900 flex flex-col items-center justify-end pb-2 md:pb-3 border border-gray-500 rounded-b cursor-pointer z-10 hover:bg-red-200 active:translate-y-1"
                  onMouseDown={handlePressDown}
                  onMouseUp={handlePressUp}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handlePressDown}
                  onTouchEnd={handlePressUp}
                >
                  <span className="font-bold text-[0.7rem] md:text-sm text-gray-800 leading-tight">
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
