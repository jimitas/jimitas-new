"use client"

// ======================================================
// 音を出そう
//
// 3年理科「音のふしぎ」で使える周波数・波形の音発生器。
// Web Audio API の OscillatorNode で sine/square/sawtooth/triangle を
// 切り替えられ、10〜2000Hz の範囲でリアルタイム変更可能。
// ドレミの早押しボタンも 2オクターブ分用意。
// 旧 jimitas.com「もっと学習コンテンツ」内の otoo 機能を移植。
// ======================================================

import { useState, useEffect, useRef, useCallback } from "react"

type WaveType = "sine" | "square" | "sawtooth" | "triangle"

const WAVE_TYPES: { id: WaveType; label: string }[] = [
  { id: "sine",     label: "サイン波 (sine)" },
  { id: "square",   label: "矩形波 (square)" },
  { id: "sawtooth", label: "ノコギリ波 (sawtooth)" },
  { id: "triangle", label: "三角波 (triangle)" },
]

// ドレミ早押しボタン（低音域 = C4〜C5、高音域 = C5〜C6）
const NOTE_NAMES = ["ド", "レ", "ミ", "ファ", "ソ", "ラ", "シ", "ド"]
const LO_HZ = [261, 294, 330, 349, 392, 440, 494, 522] // C4 〜 C5
const HI_HZ = [522, 588, 660, 698, 784, 880, 988, 1044] // C5 〜 C6

export default function OtoDashiyoPage() {
  const [waveType, setWaveType] = useState<WaveType>("sine")
  const [hz, setHz] = useState(440)
  const [isPlaying, setIsPlaying] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  // -------------------------------------------------------
  // 再生開始
  // -------------------------------------------------------
  const startSound = useCallback(() => {
    if (oscRef.current) return

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    const ctx = audioCtxRef.current
    if (ctx.state === "suspended") ctx.resume()

    const osc = ctx.createOscillator()
    osc.type = waveType
    osc.frequency.setValueAtTime(hz, ctx.currentTime)

    // 大きな音にならないようゲインで抑える（耳障り防止）
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()

    oscRef.current = osc
    gainRef.current = gain
    setIsPlaying(true)
  }, [waveType, hz])

  // -------------------------------------------------------
  // 再生停止（フェードアウトしてからストップ）
  // -------------------------------------------------------
  const stopSound = useCallback(() => {
    const ctx = audioCtxRef.current
    const osc = oscRef.current
    const gain = gainRef.current
    if (!ctx || !osc || !gain) {
      setIsPlaying(false)
      return
    }
    const now = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(0, now + 0.05)
    osc.stop(now + 0.06)
    oscRef.current = null
    gainRef.current = null
    setIsPlaying(false)
  }, [])

  // -------------------------------------------------------
  // 周波数変更：再生中なら即時反映
  // -------------------------------------------------------
  useEffect(() => {
    const osc = oscRef.current
    const ctx = audioCtxRef.current
    if (osc && ctx) {
      osc.frequency.setValueAtTime(hz, ctx.currentTime)
    }
  }, [hz])

  // -------------------------------------------------------
  // 波形変更：再生中なら一度止めてから再生し直す
  // -------------------------------------------------------
  useEffect(() => {
    if (isPlaying) {
      stopSound()
      // 短いディレイを挟んで即再開
      const timer = setTimeout(() => startSound(), 50)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveType])

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopSound()
      audioCtxRef.current?.close()
    }
  }, [stopSound])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        音を出そう
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        3年理科「音のふしぎ」で使えるよ。波形と周波数を変えて、音のちがいをくらべよう。
      </p>
      <p className="text-xs text-warm-700 dark:text-warm-300 mb-6">
        ⚠ 大きな音が出ないように、ボリュームに注意してください。
      </p>

      {/* ===== 波形選択 ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
          波形（音色）
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {WAVE_TYPES.map(w => (
            <button
              key={w.id}
              onClick={() => setWaveType(w.id)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                waveType === w.id
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 周波数スライダー ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-200">
            周波数（Hz）
          </label>
          <span className="text-2xl font-bold text-warm-600 dark:text-warm-400 tabular-nums">
            {hz} Hz
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={2000}
          step={1}
          value={hz}
          onChange={(e) => setHz(parseInt(e.target.value, 10))}
          className="w-full"
          style={{ accentColor: "var(--color-brand-500, #3b82f6)" }}
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span>10Hz</span>
          <span>低い ← → 高い</span>
          <span>2000Hz</span>
        </div>
      </div>

      {/* ===== ドレミ早押しボタン（高音域・低音域） ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
          ドレミ早押し（押すと周波数がセットされます）
        </h2>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">高い音（C5〜C6）</div>
        <div className="grid grid-cols-8 gap-1 mb-3">
          {HI_HZ.map((freq, i) => (
            <button
              key={`hi-${i}`}
              onClick={() => setHz(freq)}
              className="py-2 px-1 rounded-lg bg-warm-100 dark:bg-warm-900 hover:bg-warm-200 dark:hover:bg-warm-800 text-warm-800 dark:text-warm-200 text-sm font-bold"
            >
              {NOTE_NAMES[i]}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">低い音（C4〜C5）</div>
        <div className="grid grid-cols-8 gap-1">
          {LO_HZ.map((freq, i) => (
            <button
              key={`lo-${i}`}
              onClick={() => setHz(freq)}
              className="py-2 px-1 rounded-lg bg-brand-100 dark:bg-brand-900 hover:bg-brand-200 dark:hover:bg-brand-800 text-brand-800 dark:text-brand-200 text-sm font-bold"
            >
              {NOTE_NAMES[i]}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 再生/停止 ===== */}
      <div className="flex justify-center gap-3">
        <button
          onClick={startSound}
          disabled={isPlaying}
          className={`px-8 py-3 rounded-full font-bold text-lg shadow-md transition-all ${
            isPlaying
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-brand-500 hover:bg-brand-600 text-white"
          }`}
        >
          ▶ 音を鳴らす
        </button>
        <button
          onClick={stopSound}
          disabled={!isPlaying}
          className={`px-8 py-3 rounded-full font-bold text-lg shadow-md transition-all ${
            !isPlaying
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          ■ 音を止める
        </button>
      </div>
    </div>
  )
}
