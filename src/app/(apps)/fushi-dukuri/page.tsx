"use client"

// ======================================================
// ふしづくり（DnD版）
//
// 上のパレットから音符をドラッグして、ピアノロール風のグリッドに
// 配置するシーケンサー風UI。学習要素として実物の音符・休符の絵を
// 使い、楽譜の感覚を体験できる。
//
// グリッド構造：
//   - 横方向: スロット（時間）= noteCount 個
//   - 縦方向: 11音 (ド..ミ↑) ＋ 休符行 ＝ 12行
//   - 各スロットに置けるのは1つ（音符 or 休符のいずれか）
//
// 操作：
//   - パレットの音符をドラッグ → グリッドのセルにドロップで配置
//   - 配置済みの音符をタップで削除
//   - 「再生」で旋律を Web Audio API で順番に発音
// ======================================================

import { useState, useRef, useCallback, useEffect } from "react"

// ── 音符・休符パレット定義 ─────────────────────────────
// factor: 4分音符を1とした相対長さ
// isRest: 休符フラグ
type DurationDef = {
  idx: number
  label: string
  image: string
  factor: number
  isRest: boolean
}

const DURATIONS: DurationDef[] = [
  { idx: 1, label: "2分音ぷ",     image: "2buo", factor: 2,    isRest: false },
  { idx: 2, label: "4分音ぷ",     image: "4buo", factor: 1,    isRest: false },
  { idx: 3, label: "付点4分音ぷ", image: "f4bo", factor: 1.5,  isRest: false },
  { idx: 4, label: "8分音ぷ",     image: "8buo", factor: 0.5,  isRest: false },
  { idx: 5, label: "4分休ふ",     image: "4kyu", factor: 1,    isRest: true },
  { idx: 6, label: "8分休ふ",     image: "8kyu", factor: 0.5,  isRest: true },
]

// ── 音高（高い順に並べる：上が高音、下が低音）──────────
const PITCHES = [
  { label: "ミ↑", value: "E5", freq: 659.25 },
  { label: "レ↑", value: "D5", freq: 587.33 },
  { label: "ド↑", value: "C5", freq: 523.25 },
  { label: "シ",  value: "B4", freq: 493.88 },
  { label: "ラ",  value: "A4", freq: 440.00 },
  { label: "ソ",  value: "G4", freq: 392.00 },
  { label: "ファ", value: "F4", freq: 349.23 },
  { label: "ミ",  value: "E4", freq: 329.63 },
  { label: "レ",  value: "D4", freq: 293.66 },
  { label: "ド",  value: "C4", freq: 261.63 },
]

// ── スロットの状態 ──────────────────────────────────
//   empty: 空 / note: 音符（ピッチあり）/ rest: 休符
type Slot =
  | { type: "empty" }
  | { type: "note"; durationIdx: number; pitchIdx: number }
  | { type: "rest"; durationIdx: number }

const DEFAULT_NOTE_COUNT = 8
const MIN_NOTE_COUNT = 4
const MAX_NOTE_COUNT = 16
const MIN_TEMPO = 30
const MAX_TEMPO = 250

function makeEmptySlots(n: number): Slot[] {
  return Array.from({ length: n }, () => ({ type: "empty" }))
}

export default function FushiDukuriPage() {
  const [tempo, setTempo] = useState(120)
  const [noteCount, setNoteCount] = useState(DEFAULT_NOTE_COUNT)
  const [pendingNoteCount, setPendingNoteCount] = useState(DEFAULT_NOTE_COUNT)
  const [slots, setSlots] = useState<Slot[]>(makeEmptySlots(DEFAULT_NOTE_COUNT))
  const [confirmingReset, setConfirmingReset] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const scheduledRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([])

  // ── ドラッグ管理（ゴースト要素を fixed で動かす）─────────
  const dragGhostRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{
    durationIdx: number
    pointerId: number
    offsetX: number
    offsetY: number
  } | null>(null)

  // ────────────────────────────────────────────────
  // クリーンアップ
  // ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAll()
      audioCtxRef.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  const stopAll = () => {
    const now = audioCtxRef.current?.currentTime ?? 0
    scheduledRef.current.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now)
        gain.gain.setValueAtTime(gain.gain.value, now)
        gain.gain.linearRampToValueAtTime(0, now + 0.05)
        osc.stop(now + 0.06)
      } catch {
        // 既に停止済み
      }
    })
    scheduledRef.current = []
  }

  // ────────────────────────────────────────────────
  // 再生：各スロットを順次スケジュール
  // ────────────────────────────────────────────────
  const handlePlay = () => {
    stopAll()
    const ctx = ensureAudioContext()
    const beatSec = 60 / tempo
    const startTime = ctx.currentTime + 0.05

    let cursor = 0
    for (const slot of slots) {
      if (slot.type === "empty") continue
      const dur = DURATIONS[slot.durationIdx]
      const noteSec = beatSec * dur.factor

      if (slot.type === "note" && !dur.isRest) {
        const t0 = startTime + cursor
        const pitch = PITCHES[slot.pitchIdx]
        const osc = ctx.createOscillator()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(pitch.freq, t0)

        const gain = ctx.createGain()
        const peak = 0.18
        const release = Math.min(0.15, noteSec * 0.3)
        gain.gain.setValueAtTime(0, t0)
        gain.gain.linearRampToValueAtTime(peak, t0 + 0.01)
        gain.gain.setValueAtTime(peak, t0 + Math.max(0.05, noteSec - release))
        gain.gain.linearRampToValueAtTime(0, t0 + noteSec)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t0)
        osc.stop(t0 + noteSec + 0.05)
        scheduledRef.current.push({ osc, gain })
      }

      cursor += noteSec
    }
  }

  const handleStop = () => stopAll()

  // ────────────────────────────────────────────────
  // 音の数変更
  // ────────────────────────────────────────────────
  const applyNoteCount = () => {
    const n = Math.max(MIN_NOTE_COUNT, Math.min(MAX_NOTE_COUNT, pendingNoteCount))
    setNoteCount(n)
    setSlots(makeEmptySlots(n))
    setConfirmingReset(false)
  }

  // ────────────────────────────────────────────────
  // ドラッグ開始（パレット）：ゴースト要素を作って fixed 配置
  // ────────────────────────────────────────────────
  const onPalettePointerDown = (e: React.PointerEvent<HTMLDivElement>, durationIdx: number) => {
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)

    const dur = DURATIONS.find(d => d.idx === durationIdx)
    if (!dur) return

    // ゴースト DOM を作って body に追加
    const ghost = document.createElement("div")
    ghost.style.position = "fixed"
    ghost.style.zIndex = "10000"
    ghost.style.pointerEvents = "none"
    ghost.style.transition = "none"
    ghost.style.opacity = "0.85"
    ghost.style.width = "48px"
    ghost.style.height = "48px"
    ghost.innerHTML = `<img src="/images/fushi-dukuri/${dur.image}.png" alt="" style="width:100%;height:100%;object-fit:contain;" draggable="false" />`
    document.body.appendChild(ghost)
    dragGhostRef.current = ghost

    const offsetX = 24
    const offsetY = 24
    ghost.style.left = `${e.clientX - offsetX}px`
    ghost.style.top = `${e.clientY - offsetY}px`

    dragRef.current = {
      durationIdx,
      pointerId: e.pointerId,
      offsetX,
      offsetY,
    }
  }

  const onPalettePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const ghost = dragGhostRef.current
    if (!drag || !ghost || drag.pointerId !== e.pointerId) return
    ghost.style.left = `${e.clientX - drag.offsetX}px`
    ghost.style.top = `${e.clientY - drag.offsetY}px`
  }

  const onPalettePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const ghost = dragGhostRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    // 一時的に ghost を非表示にしてドロップ先を判定
    if (ghost) ghost.style.display = "none"
    const below = document.elementFromPoint(e.clientX, e.clientY)
    if (ghost) ghost.style.display = ""

    let placed = false
    if (below) {
      const cell = (below as HTMLElement).closest('[data-cell]') as HTMLElement | null
      if (cell) {
        const slotIdx = parseInt(cell.dataset.slot || "", 10)
        const isRestRow = cell.dataset.rest === "true"
        const pitchIdx = parseInt(cell.dataset.pitch || "-1", 10)

        const dur = DURATIONS.find(d => d.idx === drag.durationIdx)
        if (Number.isFinite(slotIdx) && dur) {
          if (dur.isRest) {
            // 休符はどこにドロップしても、休符行の動作になる
            setSlots(prev => prev.map((s, i) =>
              i === slotIdx ? { type: "rest", durationIdx: drag.durationIdx } : s
            ))
            placed = true
          } else if (!isRestRow && Number.isFinite(pitchIdx) && pitchIdx >= 0) {
            // 音符はピッチ行にのみ配置
            setSlots(prev => prev.map((s, i) =>
              i === slotIdx ? { type: "note", durationIdx: drag.durationIdx, pitchIdx } : s
            ))
            placed = true
          }
        }
      }
    }

    // ゴースト削除
    if (ghost && ghost.parentNode) {
      ghost.parentNode.removeChild(ghost)
    }
    dragGhostRef.current = null
    dragRef.current = null

    // pointer capture 解放（要素が DOM 上に残っていれば）
    const captureTarget = e.currentTarget
    if (captureTarget.hasPointerCapture(e.pointerId)) {
      captureTarget.releasePointerCapture(e.pointerId)
    }

    // 配置できなかったときの軽いフィードバック（特になし）
    void placed
  }

  // ────────────────────────────────────────────────
  // 配置済みノートをクリックで削除
  // ────────────────────────────────────────────────
  const removeSlot = (slotIdx: number) => {
    setSlots(prev => prev.map((s, i) => (i === slotIdx ? { type: "empty" } : s)))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1 text-center">
        ふしづくり
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
        上の音ぷ・休ふをドラッグして、下のグリッドに置こう。たて方向は音の高さ、よこ方向は時間の流れ。
      </p>

      {/* テンポコントロール */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-3">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">テンポ</span>
          <button
            onClick={() => setTempo(t => Math.max(MIN_TEMPO, t - 1))}
            className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 font-bold"
          >
            −
          </button>
          <input
            type="range"
            min={MIN_TEMPO}
            max={MAX_TEMPO}
            value={tempo}
            onChange={e => setTempo(Number(e.target.value))}
            className="w-48"
            style={{ accentColor: "var(--color-brand-500, #3b82f6)" }}
          />
          <button
            onClick={() => setTempo(t => Math.min(MAX_TEMPO, t + 1))}
            className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 font-bold"
          >
            ＋
          </button>
          <span className="ml-2 text-2xl font-bold text-warm-600 dark:text-warm-400 tabular-nums w-16 text-center">
            {tempo}
          </span>
        </div>
      </section>

      {/* 再生・停止・音の数 */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={handlePlay}
            className="px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold"
          >
            ▶ 再生
          </button>
          <button
            onClick={handleStop}
            className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold"
          >
            ■ 停止
          </button>
          <div className="ml-4 flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-200">音の数</span>
            <input
              type="number"
              min={MIN_NOTE_COUNT}
              max={MAX_NOTE_COUNT}
              value={pendingNoteCount}
              onChange={e => setPendingNoteCount(Number(e.target.value))}
              className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-center"
            />
            {!confirmingReset ? (
              <button
                onClick={() => {
                  if (pendingNoteCount === noteCount) return
                  setConfirmingReset(true)
                }}
                className="px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-sm"
              >
                セット
              </button>
            ) : (
              <div className="flex gap-1 items-center bg-yellow-50 dark:bg-yellow-950 rounded p-1">
                <span className="text-xs text-yellow-800 dark:text-yellow-200 px-1">作り直す？</span>
                <button onClick={applyNoteCount} className="px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold">はい</button>
                <button onClick={() => setConfirmingReset(false)} className="px-2 py-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 text-xs">いいえ</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 音符パレット（ドラッグ元） */}
      <section className="bg-purple-50 dark:bg-purple-950 rounded-xl border-2 border-purple-300 dark:border-purple-700 p-3 mb-3">
        <div className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-2">
          🎵 音符・休符パレット（ドラッグして下のグリッドに置こう）
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {DURATIONS.map(dur => (
            <div
              key={dur.idx}
              onPointerDown={(e) => onPalettePointerDown(e, dur.idx)}
              onPointerMove={onPalettePointerMove}
              onPointerUp={onPalettePointerUp}
              onPointerCancel={onPalettePointerUp}
              className="touch-none cursor-grab active:cursor-grabbing select-none flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-800 p-2 hover:border-purple-400"
              style={{ touchAction: "none" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/fushi-dukuri/${dur.image}.png`}
                alt={dur.label}
                className="h-12 w-12 object-contain pointer-events-none"
                draggable={false}
              />
              <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">{dur.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* シーケンサー・グリッド */}
      <section className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="border-collapse mx-auto">
            <tbody>
              {/* 音高行（高音から低音へ） */}
              {PITCHES.map((pitch, pIdx) => (
                <tr key={`p-${pIdx}`}>
                  <th className="border border-gray-300 dark:border-gray-600 bg-blue-50 dark:bg-blue-950 px-2 py-1 text-xs font-bold text-blue-800 dark:text-blue-200 sticky left-0">
                    {pitch.label}
                  </th>
                  {slots.map((slot, sIdx) => (
                    <td
                      key={`p-${pIdx}-s-${sIdx}`}
                      data-cell="true"
                      data-pitch={pIdx}
                      data-slot={sIdx}
                      className="border border-gray-300 dark:border-gray-600 w-12 h-10 text-center align-middle bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer"
                      onClick={() => {
                        if (slot.type === "note" && slot.pitchIdx === pIdx) {
                          removeSlot(sIdx)
                        }
                      }}
                    >
                      {slot.type === "note" && slot.pitchIdx === pIdx ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/images/fushi-dukuri/${DURATIONS[slot.durationIdx - 1].image}.png`}
                          alt=""
                          className="h-8 mx-auto pointer-events-none"
                          draggable={false}
                        />
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
              {/* 休符行 */}
              <tr>
                <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-bold text-gray-700 dark:text-gray-300 sticky left-0">
                  休符
                </th>
                {slots.map((slot, sIdx) => (
                  <td
                    key={`r-s-${sIdx}`}
                    data-cell="true"
                    data-rest="true"
                    data-slot={sIdx}
                    className="border border-gray-300 dark:border-gray-600 w-12 h-10 text-center align-middle bg-gray-50 dark:bg-gray-900 hover:bg-yellow-50 dark:hover:bg-yellow-950 cursor-pointer"
                    onClick={() => {
                      if (slot.type === "rest") removeSlot(sIdx)
                    }}
                  >
                    {slot.type === "rest" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/images/fushi-dukuri/${DURATIONS[slot.durationIdx - 1].image}.png`}
                        alt=""
                        className="h-8 mx-auto pointer-events-none"
                        draggable={false}
                      />
                    ) : null}
                  </td>
                ))}
              </tr>
              {/* スロット番号 */}
              <tr>
                <th className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 sticky left-0">
                  #
                </th>
                {slots.map((_, sIdx) => (
                  <td key={`n-${sIdx}`} className="border border-gray-300 dark:border-gray-600 px-1 py-0.5 text-xs text-gray-400 dark:text-gray-500 text-center">
                    {sIdx + 1}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        💡 配置済みの音符・休符をタップすると消せるよ。
      </p>
    </div>
  )
}
