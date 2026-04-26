"use client"

// ======================================================
// 和音を出そう
//
// ハ長調・イ短調でよく使われる和音 8つを聴き比べ。
// Web Audio API で OscillatorNode を複数鳴らして合成。
// 旧 jimitas.com「もっと学習コンテンツ」内の waon 機能を移植。
// （元実装は Tone.js だが、依存ゼロで Web Audio に置換）
// ======================================================

import { useState, useRef, useEffect, useCallback } from "react"

// 音名 → 周波数（Hz）
//   A4 = 440 Hz、半音ごとに 2^(1/12) 倍
//   ピアノ調律（平均律）
const NOTE_FREQ: Record<string, number> = {
  "D2": 73.42,  "E2": 82.41,  "F2": 87.31,  "G2": 98.00,  "A2": 110.00,
  "C3": 130.81, "D3": 146.83, "E3": 164.81,
  "B3": 246.94,
  "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00, "A4": 440.00,
  "G#4": 415.30,
}

type Chord = {
  id: string
  label: string
  yobina: string
  notes: string[]
  category: "major" | "minor"
}

// ハ長調の和音（C・F・G・G7）
// 6年生の音楽教科書（教育芸術社・教育出版など）では、和音をローマ数字
// （Ⅰ・Ⅳ・Ⅴ・Ⅴ7）で表記するのが一般的。「主和音／下属和音／属和音／
// 属七の和音」の呼び方も併記される。ここでは小学生に親しみやすい
// アラビア数字 + ローマ数字風の "I / IV / V / V7" を採用し、
// 補助としてコードネームも括弧書きで添える。
const CHORDS_MAJOR: Chord[] = [
  { id: "C",  label: "C",  yobina: "I",  notes: ["C3", "C4", "E4", "G4"],   category: "major" },
  { id: "F",  label: "F",  yobina: "IV", notes: ["F2", "C4", "F4", "A4"],   category: "major" },
  { id: "G",  label: "G",  yobina: "V",  notes: ["G2", "B3", "D4", "G4"],   category: "major" },
  { id: "G7", label: "G7", yobina: "V7", notes: ["G2", "B3", "F4", "G4"],   category: "major" },
]

// イ短調の和音（Am・Dm・E・E7）
const CHORDS_MINOR: Chord[] = [
  { id: "Am", label: "Am", yobina: "I",  notes: ["A2", "C4", "E4", "A4"],   category: "minor" },
  { id: "Dm", label: "Dm", yobina: "IV", notes: ["D2", "D3", "F4", "A4"],   category: "minor" },
  { id: "E",  label: "E",  yobina: "V",  notes: ["E3", "B3", "E4", "G#4"],  category: "minor" },
  { id: "E7", label: "E7", yobina: "V7", notes: ["E3", "D4", "E4", "G#4"],  category: "minor" },
]

export default function WaaonPage() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const activeNodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([])
  const [activeChordId, setActiveChordId] = useState<string | null>(null)

  // -------------------------------------------------------
  // AudioContext を初期化（初回操作時に解放）
  // -------------------------------------------------------
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
  // 既に鳴っている音をすべて停止
  // -------------------------------------------------------
  const stopAll = useCallback(() => {
    const now = audioCtxRef.current?.currentTime ?? 0
    activeNodesRef.current.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now)
        gain.gain.setValueAtTime(gain.gain.value, now)
        gain.gain.linearRampToValueAtTime(0, now + 0.05)
        osc.stop(now + 0.06)
      } catch {
        // 既に停止していたら無視
      }
    })
    activeNodesRef.current = []
    setActiveChordId(null)
  }, [])

  // -------------------------------------------------------
  // 和音を鳴らす（4音同時、約2秒で減衰）
  // -------------------------------------------------------
  const playChord = useCallback((chord: Chord) => {
    const ctx = ensureAudioContext()
    stopAll()

    const now = ctx.currentTime
    const sustainSec = 3.6   // 旧 1.8s から倍に拡張（小学生がじっくり聴き比べできる長さ）
    const attackSec = 0.02
    const releaseSec = 0.8
    const peakGain = 0.18 / chord.notes.length // 4音合算で過大にならない量

    chord.notes.forEach(note => {
      const freq = NOTE_FREQ[note]
      if (!freq) return

      const osc = ctx.createOscillator()
      osc.type = "triangle" // 柔らかめのサウンド
      osc.frequency.setValueAtTime(freq, now)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(peakGain, now + attackSec)
      gain.gain.setValueAtTime(peakGain, now + sustainSec - releaseSec)
      gain.gain.linearRampToValueAtTime(0, now + sustainSec)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + sustainSec + 0.05)

      activeNodesRef.current.push({ osc, gain })
    })

    setActiveChordId(chord.id)
    // 自動でクリア
    setTimeout(() => {
      setActiveChordId(prev => prev === chord.id ? null : prev)
    }, sustainSec * 1000)
  }, [ensureAudioContext, stopAll])

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopAll()
      audioCtxRef.current?.close()
    }
  }, [stopAll])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        和音を出そう
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        ボタンを押すと、4つの音が同時に鳴って和音になるよ。聴き比べてみよう。
      </p>

      {/* ===== ハ長調の和音 ===== */}
      <section className="mb-6">
        <h2 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-3 pb-2 border-b-2 border-brand-400">
          🎵 ハ長調でよく使われる和音
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CHORDS_MAJOR.map(chord => (
            <ChordButton
              key={chord.id}
              chord={chord}
              isActive={activeChordId === chord.id}
              onPlay={() => playChord(chord)}
            />
          ))}
        </div>
      </section>

      {/* ===== イ短調の和音 ===== */}
      <section className="mb-6">
        <h2 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-3 pb-2 border-b-2 border-warm-400">
          🎵 イ短調でよく使われる和音
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CHORDS_MINOR.map(chord => (
            <ChordButton
              key={chord.id}
              chord={chord}
              isActive={activeChordId === chord.id}
              onPlay={() => playChord(chord)}
            />
          ))}
        </div>
      </section>

      {/* ===== 停止ボタン ===== */}
      <div className="flex justify-center">
        <button
          onClick={stopAll}
          className="px-8 py-3 rounded-full bg-gray-500 hover:bg-gray-600 text-white font-bold shadow-md transition-all"
        >
          ■ とめる
        </button>
      </div>
    </div>
  )
}

// -----------------------------------------------------
// 和音ボタン
// -----------------------------------------------------
function ChordButton({
  chord,
  isActive,
  onPlay,
}: {
  chord: Chord
  isActive: boolean
  onPlay: () => void
}) {
  return (
    <button
      onClick={onPlay}
      className={`
        rounded-xl p-4 border-2 transition-all duration-150 shadow-sm
        ${isActive
          ? chord.category === "major"
            ? "bg-brand-500 border-brand-600 text-white scale-105 shadow-md"
            : "bg-warm-500 border-warm-600 text-white scale-105 shadow-md"
          : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:shadow-md hover:-translate-y-0.5"
        }
      `}
    >
      {/* 6年生の音楽教科書に合わせてローマ数字（I / IV / V / V7）で表記。
          コードネームは小さく補助表示。テキスト折り返しを避けるため
          text-lg + whitespace-nowrap でコンパクトに揃える */}
      <div className="text-lg font-bold mb-1 whitespace-nowrap">{chord.yobina}の和音</div>
      <div className="text-xs opacity-80 tabular-nums">（{chord.label}）</div>
    </button>
  )
}
