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
//
// 【穴の移動・リサイズ】
//   react-moveable を使い、手の小さい子用に穴の位置・サイズを調整可能。
//   設定は localStorage に自動保存される。
// ======================================================

import { useState, useRef, useCallback, useEffect } from "react"
import Moveable from "react-moveable"
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

// デフォルト配置（リセット時に使う）
const DEFAULT_HOLES: HoleData[] = [
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

// ── localStorage ─────────────────────────────────────
// 穴の位置・サイズのみ保存する（borderRadius は固定）
type SavedPos = { top: number; left: number; width: number; height: number }
const LS_KEY = "recorder-play-holes-v1"

function getDefaultPositions(): SavedPos[] {
  return DEFAULT_HOLES.map(h => ({ top: h.top, left: h.left, width: h.width, height: h.height }))
}

function savePositions(positions: SavedPos[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(positions)) } catch {}
}

// ── ページコンポーネント ──────────────────────────────

export default function RecorderPlayPage() {
  useAudioUnlock()
  const { playSound, stopSound } = useInstrumentSounds("re_", 34)

  // アルトリコーダーモード
  const [isAlt, setIsAlt] = useState(false)
  const altOffsetRef = useRef(0)
  useEffect(() => { altOffsetRef.current = isAlt ? 7 : 0 }, [isAlt])

  // 穴の押下状態（0=離す, 1=押す）
  const holesRef = useRef<number[]>(new Array(11).fill(0))
  const [holesDisplay, setHolesDisplay] = useState<number[]>(new Array(11).fill(0))
  const currentSoundRef = useRef(0)  // 現在鳴らしている soundIndex

  // 穴の位置・サイズ（localStorage から復元、なければデフォルト）
  const [positions, setPositions] = useState<SavedPos[]>(() => {
    if (typeof window === "undefined") return getDefaultPositions()
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const parsed: SavedPos[] = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === 11) return parsed
      }
    } catch {}
    return getDefaultPositions()
  })

  // 移動モード・選択中の穴
  const [isMoveMode, setIsMoveMode] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // Moveable のターゲット要素（ref をレンダー中に読まないよう state で管理）
  const [moveTarget, setMoveTarget] = useState<HTMLDivElement | null>(null)


  // 各穴の DOM ref（Moveable のターゲット指定用）
  const holeRefs = useRef<(HTMLDivElement | null)[]>(new Array(11).fill(null))

  // 現在の運指コードに合う音を再生（前の音を止めてから）
  const updateSound = useCallback(() => {
    if (currentSoundRef.current > 0) {
      stopSound(currentSoundRef.current)
      currentSoundRef.current = 0
    }
    const holes = holesRef.current
    let code = 0
    for (let i = 0; i < 11; i++) code += holes[i] * (2 ** i)
    const idx = LIST_A.indexOf(code)
    if (idx !== -1) {
      const soundIdx = LIST_B[idx] - altOffsetRef.current
      if (soundIdx >= 1 && soundIdx <= 34) {
        playSound(soundIdx)
        currentSoundRef.current = soundIdx
      }
    }
  }, [playSound, stopSound])

  // 穴を押す（演奏モードのみ）
  const pressHole = useCallback((j: number) => {
    const holes = holesRef.current
    holes[j] = 1
    if (COUPLED[j] !== undefined) holes[COUPLED[j]] = 1
    setHolesDisplay([...holes])
    updateSound()
  }, [updateSound])

  // 穴を離す（演奏モードのみ）
  const releaseHole = useCallback((j: number) => {
    const holes = holesRef.current
    holes[j] = 0
    if (COUPLED[j] !== undefined) holes[COUPLED[j]] = 0
    setHolesDisplay([...holes])
    updateSound()
  }, [updateSound])

  // 位置・サイズを更新して localStorage に保存
  const updatePosition = useCallback((id: number, partial: Partial<SavedPos>) => {
    setPositions(prev => {
      const next = prev.map((p, i) => i === id ? { ...p, ...partial } : p)
      savePositions(next)
      return next
    })
  }, [])

  // デフォルト配置にリセット
  const resetPositions = useCallback(() => {
    const defaults = getDefaultPositions()
    setPositions(defaults)
    savePositions(defaults)
    setSelectedId(null)
    setMoveTarget(null)
  }, [])

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold text-center mb-1">リコーダー（運指）</h1>
      <p className="text-center text-sm text-gray-500 mb-4">
        穴をタッチして運指で演奏しよう
      </p>

      {/* アルトリコーダー切り替え */}
      <div className="flex justify-center mb-3">
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

      {/* 穴の移動モード切り替え */}
      <div className="flex justify-center items-center gap-4 mb-3">
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
          <input
            type="checkbox"
            className="w-5 h-5 accent-amber-700"
            checked={isMoveMode}
            onChange={e => {
              const next = e.target.checked
              setIsMoveMode(next)
              if (!next) { setSelectedId(null); setMoveTarget(null) }
            }}
          />
          <span>✋ 穴を移動・リサイズする</span>
        </label>
        {/* リセットボタンは移動モード中のみ表示 */}
        {isMoveMode && (
          <button
            className="text-xs text-amber-700 border border-amber-400 bg-amber-50 px-2 py-1 rounded hover:bg-amber-100"
            onClick={resetPositions}
          >
            初期配置に戻す
          </button>
        )}
      </div>

      {/* 移動モードの操作説明 */}
      {isMoveMode ? (
        <p className="text-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 mx-auto max-w-sm">
          穴をタップして選択（黄色の枠） → ハンドルでドラッグ・リサイズ。<br />
          設定は自動で保存されます。
        </p>
      ) : (
        <p className="text-center text-xs text-gray-400 mb-4">
          穴をタッチ（またはクリック）しながら押さえてください。複数同時に押さえられます。
        </p>
      )}

      {/* 運指操作エリア */}
      <div className="overflow-x-auto pb-4">
        {/*
          コンテナは旧版の data_top/data_left の最大値に合わせたサイズ。
          穴を absolute で配置する。
        */}
        <div
          className="relative mx-auto"
          style={{ width: "840px", height: "620px" }}
          // コンテナ背景クリックで選択解除
          onClick={e => {
            if (e.target === e.currentTarget && isMoveMode) { setSelectedId(null); setMoveTarget(null) }
          }}
        >
          {DEFAULT_HOLES.map(hole => {
            const pos = positions[hole.id]
            const isSelected = isMoveMode && selectedId === hole.id
            return (
              <div
                key={hole.id}
                ref={el => { holeRefs.current[hole.id] = el }}
                className="absolute select-none touch-none"
                style={{
                  top:          pos.top,
                  left:         pos.left,
                  width:        pos.width,
                  height:       pos.height,
                  borderRadius: hole.borderRadius,
                  backgroundColor: holesDisplay[hole.id] === 1 ? "#1a1a1a" : "lightgray",
                  // 選択中は黄色のハイライト枠
                  border:  isSelected ? "3px solid #f59e0b" : "3px solid #555",
                  cursor:  isMoveMode ? "move" : "pointer",
                  // 移動モードでは押下時の色変化トランジションを無効に
                  transition: isMoveMode ? "" : "background-color 0.05s",
                }}
                title={hole.label}
                onPointerDown={e => {
                  if (isMoveMode) {
                    // 移動モード: タップで選択するだけ（音を鳴らさない）
                    setSelectedId(hole.id)
                    setMoveTarget(holeRefs.current[hole.id])
                    return
                  }
                  // 演奏モード: pointer capture で指が穴外に出ても pointerup を受け取る
                  e.currentTarget.setPointerCapture(e.pointerId)
                  pressHole(hole.id)
                }}
                onPointerUp={() => { if (!isMoveMode) releaseHole(hole.id) }}
                onPointerCancel={() => { if (!isMoveMode) releaseHole(hole.id) }}
              />
            )
          })}

          {/* Moveable: 選択中の穴にのみアタッチ（key でホール切り替え時に再マウント） */}
          {isMoveMode && selectedId !== null && moveTarget && (
            <Moveable
              key={selectedId}
              target={moveTarget}
              draggable={true}
              resizable={true}
              keepRatio={false}
              origin={false}
              throttleDrag={0}
              throttleResize={0}
              renderDirections={["n", "nw", "ne", "s", "se", "sw", "e", "w"]}
              // ── ドラッグ中: DOM を直接更新（React state は動かさない） ──
              onDrag={({ target, left, top }) => {
                target.style.left = `${left}px`
                target.style.top  = `${top}px`
              }}
              // ── ドラッグ完了: state + localStorage に保存 ──
              onDragEnd={({ lastEvent }) => {
                if (lastEvent && selectedId !== null) {
                  updatePosition(selectedId, { left: lastEvent.left, top: lastEvent.top })
                }
              }}
              // ── リサイズ中: DOM を直接更新 ──
              onResize={({ target, width, height, drag }) => {
                target.style.width  = `${width}px`
                target.style.height = `${height}px`
                // リサイズの基点によって left/top も変わるため drag から取得
                target.style.left   = `${drag.left}px`
                target.style.top    = `${drag.top}px`
              }}
              // ── リサイズ完了: state + localStorage に保存 ──
              onResizeEnd={({ lastEvent }) => {
                if (lastEvent && selectedId !== null) {
                  updatePosition(selectedId, {
                    width:  lastEvent.width,
                    height: lastEvent.height,
                    left:   lastEvent.drag.left,
                    top:    lastEvent.drag.top,
                  })
                }
              }}
            />
          )}
        </div>
      </div>
    </main>
  )
}
