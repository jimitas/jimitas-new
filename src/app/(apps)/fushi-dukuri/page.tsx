"use client"

// ======================================================
// ふしづくり
//
// 階名（ドレミ）と音の長さを選んで簡単な旋律を作って再生できる。
// 5〜20音の長さで、テンポ 30〜250 BPM、各音は8種類の長さから選択。
// 旧 jimitas.com/fushidukuri/ から移植（Tone.js → Web Audio API に置換）。
// ======================================================

import { useState, useRef, useCallback, useEffect } from "react"

// 階名（ドレミ表記）と音名（C4〜E5）のペア
const SOLFA = [
  { label: "—",   value: "" },
  { label: "ド",  value: "C4" },
  { label: "レ",  value: "D4" },
  { label: "ミ",  value: "E4" },
  { label: "ファ", value: "F4" },
  { label: "ソ",  value: "G4" },
  { label: "ラ",  value: "A4" },
  { label: "シ",  value: "B4" },
  { label: "ド↑", value: "C5" },
  { label: "レ↑", value: "D5" },
  { label: "ミ↑", value: "E5" },
]

// 音の長さ：1拍を 4n とした相対係数で記述
//  isRest=true は休符（音は鳴らさず時間だけ進める）
const DURATIONS = [
  { label: "—",          factor: 0,    image: null,     isRest: false },
  { label: "2分音ぷ",     factor: 2,    image: "2buo",   isRest: false },
  { label: "4分音ぷ",     factor: 1,    image: "4buo",   isRest: false },
  { label: "付点4分音ぷ", factor: 1.5,  image: "f4bo",   isRest: false },
  { label: "8分音ぷ",     factor: 0.5,  image: "8buo",   isRest: false },
  { label: "4分休ふ",     factor: 1,    image: "4kyu",   isRest: true },
  { label: "8分休ふ",     factor: 0.5,  image: "8kyu",   isRest: true },
]

// 音名 → 周波数（Hz、平均律）
const NOTE_FREQ: Record<string, number> = {
  "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00,
  "A4": 440.00, "B4": 493.88, "C5": 523.25, "D5": 587.33, "E5": 659.25,
}

type Note = {
  solfaIdx: number     // SOLFA[index]
  durationIdx: number  // DURATIONS[index]
}

const DEFAULT_NOTE_COUNT = 10
const MIN_NOTE_COUNT = 5
const MAX_NOTE_COUNT = 20
const MIN_TEMPO = 30
const MAX_TEMPO = 250

export default function FushiDukuriPage() {
  const [tempo, setTempo] = useState(120)
  const [noteCount, setNoteCount] = useState(DEFAULT_NOTE_COUNT)
  // 入力中の note count（適用前）
  const [pendingNoteCount, setPendingNoteCount] = useState(DEFAULT_NOTE_COUNT)
  const [notes, setNotes] = useState<Note[]>(
    Array.from({ length: DEFAULT_NOTE_COUNT }, () => ({ solfaIdx: 0, durationIdx: 0 }))
  )
  const [confirmingReset, setConfirmingReset] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const scheduledRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([])

  // -------------------------------------------------------
  // クリーンアップ
  // -------------------------------------------------------
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

  // -------------------------------------------------------
  // 全音停止
  // -------------------------------------------------------
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

  // -------------------------------------------------------
  // 再生：各音をスケジュールして triangle 波で鳴らす
  // -------------------------------------------------------
  const handlePlay = () => {
    stopAll()
    const ctx = ensureAudioContext()
    const beatSec = 60 / tempo  // 4分音符1個分の秒数
    const startTime = ctx.currentTime + 0.05

    let cursor = 0  // 経過時間（秒）
    for (const note of notes) {
      const dur = DURATIONS[note.durationIdx]
      if (dur.factor === 0) continue  // 未選択はスキップ
      const noteSec = beatSec * dur.factor

      const solfa = SOLFA[note.solfaIdx]
      if (!dur.isRest && solfa.value && NOTE_FREQ[solfa.value]) {
        const t0 = startTime + cursor
        const osc = ctx.createOscillator()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(NOTE_FREQ[solfa.value], t0)

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

  // -------------------------------------------------------
  // 音の数を変更（インライン確認）
  // -------------------------------------------------------
  const applyNoteCount = () => {
    const next = Math.max(MIN_NOTE_COUNT, Math.min(MAX_NOTE_COUNT, pendingNoteCount))
    setNoteCount(next)
    setNotes(Array.from({ length: next }, () => ({ solfaIdx: 0, durationIdx: 0 })))
    setConfirmingReset(false)
  }

  // -------------------------------------------------------
  // 各音の更新
  // -------------------------------------------------------
  const updateNote = (i: number, field: "solfaIdx" | "durationIdx", value: number) => {
    setNotes(prev => prev.map((n, idx) => idx === i ? { ...n, [field]: value } : n))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1 text-center">
        ふしづくり
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
        階名（ドレミ）と音の長さを選んで、自分のメロディーを作って再生してみよう。
      </p>

      {/* ===== テンポ ===== */}
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

      {/* ===== 再生・停止・音の数 ===== */}
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

      {/* ===== ふしづくりテーブル ===== */}
      <section className="overflow-x-auto">
        <table className="mx-auto border-collapse">
          <tbody>
            {/* 1段目: 階名 */}
            <tr>
              {notes.map((note, i) => (
                <td key={`solfa-${i}`} className="border border-gray-300 dark:border-gray-600 p-1 bg-blue-50 dark:bg-blue-950">
                  <select
                    value={note.solfaIdx}
                    onChange={e => updateNote(i, "solfaIdx", Number(e.target.value))}
                    className="w-16 sm:w-20 px-1 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-center"
                  >
                    {SOLFA.map((s, idx) => (
                      <option key={idx} value={idx}>{s.label}</option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
            {/* 2段目: 音の長さ */}
            <tr>
              {notes.map((note, i) => (
                <td key={`dur-${i}`} className="border border-gray-300 dark:border-gray-600 p-1 bg-yellow-50 dark:bg-yellow-950">
                  <select
                    value={note.durationIdx}
                    onChange={e => updateNote(i, "durationIdx", Number(e.target.value))}
                    className="w-16 sm:w-20 px-1 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs"
                  >
                    {DURATIONS.map((d, idx) => (
                      <option key={idx} value={idx}>{d.label}</option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
            {/* 3段目: 音符画像 */}
            <tr>
              {notes.map((note, i) => {
                const dur = DURATIONS[note.durationIdx]
                return (
                  <td key={`img-${i}`} className="border border-gray-300 dark:border-gray-600 p-1 bg-white dark:bg-gray-800 h-16 sm:h-20 text-center align-middle">
                    {dur.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/images/fushi-dukuri/${dur.image}.png`}
                        alt={dur.label}
                        className="h-12 sm:h-14 mx-auto"
                        draggable={false}
                      />
                    ) : null}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </section>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
        💡 上から順に「ドレミ」「音の長さ」を選び、再生ボタンで音を鳴らせるよ。休符を入れると無音時間になる。
      </p>
    </div>
  )
}
