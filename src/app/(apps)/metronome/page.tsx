"use client"

// ======================================================
// メトロノーム
//
// BPM スライダーで速さ調整、拍子（1〜7）選択。
// アクセント（拍頭）は高音、それ以外は低音。
// 旧 jimitas.com「もっと学習コンテンツ」内の metr 機能を移植。
// ======================================================

import { useState, useEffect, useRef } from "react"
import { useSound } from "@/hooks/useSound"

const BEAT_OPTIONS = [1, 2, 3, 4, 5, 6, 7]
const BPM_MIN = 10
const BPM_MAX = 300

export default function MetronomePage() {
  const [bpm, setBpm] = useState(84)
  const [beat, setBeat] = useState(4)
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const counterRef = useRef(0)
  const { play } = useSound()

  // -------------------------------------------------------
  // 再生制御
  //   1拍ごとに lo（pi.mp3）、拍頭（counter===0）で hi（set.mp3）も鳴らす
  //   単一 setInterval で hi/lo を統合し、original のドリフト問題を回避
  // -------------------------------------------------------
  useEffect(() => {
    if (!isPlaying) return

    const tickMs = (60 / bpm) * 1000
    counterRef.current = 0

    // 開始直後に拍頭を鳴らす
    play("/sounds/set.mp3", 0.5)
    play("/sounds/pi.mp3", 0.4)

    intervalRef.current = window.setInterval(() => {
      counterRef.current = (counterRef.current + 1) % beat
      if (counterRef.current === 0) {
        play("/sounds/set.mp3", 0.5)
      }
      play("/sounds/pi.mp3", 0.4)
    }, tickMs)

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPlaying, bpm, beat, play])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        メトロノーム
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        BPM をスライダーで調整して、合奏や個人練習に使えるよ。
      </p>

      {/* ===== 拍子選択 ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
          拍子（1拍ごとに「ピ」、拍頭で「セット」）
        </label>
        <div className="flex flex-wrap gap-2">
          {BEAT_OPTIONS.map(b => (
            <button
              key={b}
              onClick={() => setBeat(b)}
              className={`w-12 h-12 rounded-lg font-bold text-lg transition-all ${
                beat === b
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* ===== BPM スライダー ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-200">
            テンポ（BPM）
          </label>
          <span className="text-3xl font-bold text-warm-600 dark:text-warm-400 tabular-nums">
            {bpm}
          </span>
        </div>
        <input
          type="range"
          min={BPM_MIN}
          max={BPM_MAX}
          step={1}
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value, 10))}
          className="w-full"
          style={{ accentColor: "var(--color-brand-500, #3b82f6)" }}
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span>{BPM_MIN}</span>
          <span>遅い ← → 速い</span>
          <span>{BPM_MAX}</span>
        </div>
      </div>

      {/* ===== スタート/ストップ ===== */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-12 py-4 rounded-full font-bold text-xl shadow-md transition-all ${
            isPlaying
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-brand-500 hover:bg-brand-600 text-white"
          }`}
        >
          {isPlaying ? "■ ストップ" : "▶ スタート"}
        </button>
      </div>

      {/* ===== 状態表示 ===== */}
      {isPlaying && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          演奏中: {beat}/4 拍子・{bpm} BPM
        </p>
      )}
    </div>
  )
}
