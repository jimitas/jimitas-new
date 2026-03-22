"use client"

// ======================================================
// リコーダー（運指シミュレータ）
//
// 旧版 20rec2.js の移植。
// 画面上の11個の穴をタッチ/クリックして指を押さえ、
// 運指コードに対応した音を鳴らす。
//
// 【穴の構成（h0〜h10）】
//   h0: 親指（左手）
//   h1: 人差し指（左手）
//   h2: 中指（左手）
//   h3: 薬指（左手）
//   h4: 小指（左手）
//   h5: 人差し指（右手）
//   h6: 中指（右手）
//   h7,h8: 薬指（右手・2穴）
//   h9,h10: 小指（右手・2穴）
//
// 【連動する穴】
//   h1押し → h0自動ON / h8押し → h7自動ON / h10押し → h9自動ON
//
// 【アルトリコーダー】
//   音番号を7下げることで移調（完全一致ではない）
// ======================================================

import { useState, useRef, useCallback, useEffect } from "react"
import { useAudioUnlock } from "@/hooks/useAudioUnlock"
import { useInstrumentSounds } from "@/hooks/useInstrumentSounds"

// ── 運指コード → 音番号マッピング ────────────────────
// Code = Σ hole[i] * 2^i で計算した値が LIST_A のどこかにあれば、
// 対応する LIST_B の値（soundIndex）を鳴らす

const LIST_A = [
  2047, 1023, 511, 255, 127, 63, 447, 1983, 2015, 479,
  31, 239, 495, 111, 15, 55, 7, 11, 12, 3,
  8, 504, 253, 125, 61, 445, 93, 29, 45, 2013,
  13, 493, 109, 101, 1653, 437,
]
const LIST_B = [
  8, 9, 10, 11, 12, 13, 13, 13, 14, 14,
  15, 16, 16, 16, 17, 18, 19, 20, 21, 21,
  22, 23, 23, 24, 25, 25, 26, 27, 28, 28,
  29, 30, 31, 32, 33, 34,
]

// ── 穴の配置データ ────────────────────────────────────
// 旧版の position:fixed + data_top/data_left をそのまま再現

type HoleData = {
  id: number
  top: number
  left: number
  width: number
  height: number
  borderRadius: string
  label: string
}

const HOLES: HoleData[] = [
  { id: 0,  top: 430, left: 200, width: 100, height: 150, borderRadius: "50% 0 0 50%", label: "親指"     },
  { id: 1,  top: 430, left: 300, width: 100, height: 150, borderRadius: "0 50% 50% 0", label: "人差し指L" },
  { id: 2,  top: 250, left: 225, width: 100, height: 100, borderRadius: "50%",          label: "中指L"    },
  { id: 3,  top: 160, left: 130, width: 100, height: 100, borderRadius: "50%",          label: "薬指L"    },
  { id: 4,  top: 100, left:  25, width: 100, height: 100, borderRadius: "50%",          label: "小指L"    },
  { id: 5,  top: 350, left: 450, width: 100, height: 100, borderRadius: "50%",          label: "人差し指R" },
  { id: 6,  top: 225, left: 510, width: 100, height: 100, borderRadius: "50%",          label: "中指R"    },
  { id: 7,  top: 160, left: 660, width:  50, height:  75, borderRadius: "50%",          label: "薬指Ra"   },
  { id: 8,  top: 130, left: 610, width:  50, height:  75, borderRadius: "50%",          label: "薬指Rb"   },
  { id: 9,  top: 100, left: 740, width:  50, height:  75, borderRadius: "50%",          label: "小指Ra"   },
  { id: 10, top:  90, left: 690, width:  50, height:  75, borderRadius: "50%",          label: "小指Rb"   },
]

// ── 連動穴の定義 ──────────────────────────────────────
// COUPLED[j]: hole[j] を押したとき自動で一緒に押さえる穴
const COUPLED: Record<number, number> = { 1: 0, 8: 7, 10: 9 }

// ── ページコンポーネント ──────────────────────────────

export default function RecorderPlayPage() {
  useAudioUnlock()
  const { playSound, stopSound } = useInstrumentSounds("re_", 34)

  // アルトリコーダーモード
  const [isAlt, setIsAlt] = useState(false)
  const altOffsetRef = useRef(0)
  useEffect(() => { altOffsetRef.current = isAlt ? 7 : 0 }, [isAlt])

  // 穴の状態（0=離す, 1=押す）
  const holesRef = useRef<number[]>(new Array(11).fill(0))
  const [holesDisplay, setHolesDisplay] = useState<number[]>(new Array(11).fill(0))
  const currentSoundRef = useRef(0)  // 現在鳴らしている soundIndex

  // 現在の運指コードに合う音を再生（前の音を止めてから）
  const updateSound = useCallback(() => {
    // 前の音を止める
    if (currentSoundRef.current > 0) {
      stopSound(currentSoundRef.current)
      currentSoundRef.current = 0
    }

    // 穴の状態をビットコード化
    const holes = holesRef.current
    let code = 0
    for (let i = 0; i < 11; i++) code += holes[i] * (2 ** i)

    // LIST_A から対応する音を探して鳴らす
    const idx = LIST_A.indexOf(code)
    if (idx !== -1) {
      const soundIdx = LIST_B[idx] - altOffsetRef.current
      if (soundIdx >= 1 && soundIdx <= 34) {
        playSound(soundIdx)
        currentSoundRef.current = soundIdx
      }
    }
  }, [playSound, stopSound])

  // 穴を押す
  const pressHole = useCallback((j: number) => {
    const holes = holesRef.current
    holes[j] = 1
    if (COUPLED[j] !== undefined) holes[COUPLED[j]] = 1
    setHolesDisplay([...holes])
    updateSound()
  }, [updateSound])

  // 穴を離す
  const releaseHole = useCallback((j: number) => {
    const holes = holesRef.current
    holes[j] = 0
    if (COUPLED[j] !== undefined) holes[COUPLED[j]] = 0
    setHolesDisplay([...holes])
    updateSound()
  }, [updateSound])

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold text-center mb-1">リコーダー（運指）</h1>
      <p className="text-center text-sm text-gray-500 mb-4">
        穴をタッチして運指で演奏しよう
      </p>

      {/* アルトリコーダー切り替え */}
      <div className="flex justify-center mb-4">
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
          <input
            type="checkbox"
            className="w-5 h-5 accent-amber-700"
            checked={isAlt}
            onChange={e => setIsAlt(e.target.checked)}
          />
          <span>アルトリコーダー</span>
        </label>
      </div>
      {isAlt && (
        <p className="text-center text-xs text-gray-400 mb-2">
          ※ アルトリコーダーは移調したもので、運指が完全には一致しない音があります
        </p>
      )}

      {/* 操作説明 */}
      <p className="text-center text-xs text-gray-400 mb-4">
        穴をタッチ（またはクリック）しながら押さえてください。複数同時に押さえられます。
      </p>

      {/* 運指操作エリア */}
      <div className="overflow-x-auto pb-4">
        {/*
          コンテナは旧版の data_top/data_left の最大値に合わせたサイズ。
          穴を absolute で配置する。
        */}
        <div className="relative mx-auto" style={{ width: "840px", height: "620px" }}>
          {HOLES.map(hole => (
            <div
              key={hole.id}
              className="absolute select-none touch-none cursor-pointer"
              style={{
                top:          hole.top,
                left:         hole.left,
                width:        hole.width,
                height:       hole.height,
                borderRadius: hole.borderRadius,
                backgroundColor: holesDisplay[hole.id] === 1 ? "#1a1a1a" : "lightgray",
                border: "3px solid #555",
                transition: "background-color 0.05s",
              }}
              title={hole.label}
              onPointerDown={e => {
                // setPointerCapture で指が穴の外に出ても pointerup を受け取る
                e.currentTarget.setPointerCapture(e.pointerId)
                pressHole(hole.id)
              }}
              onPointerUp={() => releaseHole(hole.id)}
              onPointerCancel={() => releaseHole(hole.id)}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
