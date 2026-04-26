"use client"

// ======================================================
// メトロノーム
//
// BPM スライダー＋数値入力＋プリセットボタン、拍子（1〜7）選択。
// アクセント（拍頭）は高音、それ以外は低音。
// 旧 jimitas.com「もっと学習コンテンツ」内の metr 機能を移植。
//
// クリック音は Web Audio API の square 波で生成（ふしづくりの
// バックグラウンド・メトロノームと同じ仕様）。MP3 より歯切れがよく、
// AudioContext 時刻ベースで再生されるため遅延・タイミング精度も安定。
// ======================================================

import { useState, useEffect, useRef, useCallback } from "react"

const BEAT_OPTIONS = [1, 2, 3, 4, 5, 6, 7]
const BPM_MIN = 10
const BPM_MAX = 300

// よく使われるテンポのプリセット（音楽用語と数値）
const TEMPO_PRESETS: { bpm: number; label: string; sub: string }[] = [
  { bpm: 60,  label: "Largo",     sub: "ゆっくり" },
  { bpm: 76,  label: "Adagio",    sub: "ゆったり" },
  { bpm: 90,  label: "Andante",   sub: "歩く速さ" },
  { bpm: 108, label: "Moderato",  sub: "ふつう" },
  { bpm: 120, label: "Allegro",   sub: "速く" },
  { bpm: 144, label: "Vivace",    sub: "活発に" },
  { bpm: 168, label: "Presto",    sub: "とても速く" },
]

export default function MetronomePage() {
  const [bpm, setBpm] = useState(84)
  const [beat, setBeat] = useState(4)
  const [isPlaying, setIsPlaying] = useState(false)
  // 数値入力用：入力中の文字列を別管理（バックスペースで一旦空欄にしても異常値にしないため）
  const [bpmInputText, setBpmInputText] = useState("84")
  const intervalRef = useRef<number | null>(null)
  const counterRef = useRef(0)

  // Web Audio コンテキスト（クリック音の生成用）
  const audioCtxRef = useRef<AudioContext | null>(null)

  // ────────────────────────────────────────────────
  // AudioContext を必要なときに用意（初回操作時に解放）
  // ────────────────────────────────────────────────
  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  // ────────────────────────────────────────────────
  // クリック音をスケジュール（ふしづくりと同じ仕様）
  //   isAccent=true  → 1500Hz・peak 0.18（拍頭の高音）
  //   isAccent=false → 1000Hz・peak 0.12（通常の低音）
  //   約 40ms で指数減衰してすっきりした「ピッ」音に
  // ────────────────────────────────────────────────
  const scheduleClick = (ctx: AudioContext, t: number, isAccent: boolean) => {
    const osc = ctx.createOscillator()
    osc.type = "square"
    osc.frequency.setValueAtTime(isAccent ? 1500 : 1000, t)

    const gain = ctx.createGain()
    const peak = isAccent ? 0.18 : 0.12
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(peak, t + 0.001)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.05)
  }

  // ────────────────────────────────────────────────
  // bpm が外部から変わったとき、入力欄も同期
  // ────────────────────────────────────────────────
  useEffect(() => {
    setBpmInputText(String(bpm))
  }, [bpm])

  // ────────────────────────────────────────────────
  // 再生制御
  //   1拍ごとにクリック音をスケジュール。拍頭（counter===0）はアクセント。
  //   ミュート設定は localStorage の jimitas_mute を参照
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return

    const ctx = ensureAudioContext()
    const tickMs = (60 / bpm) * 1000
    counterRef.current = 0

    const fire = () => {
      // ミュート中はスキップ（ヘッダーのミュートボタンに連動）
      if (localStorage.getItem("jimitas_mute") === "true") return
      const t = ctx.currentTime + 0.005
      const isAccent = counterRef.current === 0
      scheduleClick(ctx, t, isAccent)
    }

    // 開始直後に1拍目（アクセント）を鳴らす
    fire()

    intervalRef.current = window.setInterval(() => {
      counterRef.current = (counterRef.current + 1) % beat
      fire()
    }, tickMs)

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPlaying, bpm, beat, ensureAudioContext])

  // ────────────────────────────────────────────────
  // アンマウント時に AudioContext を閉じる
  // ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close()
    }
  }, [])

  // ────────────────────────────────────────────────
  // 数値入力のコミット（フォーカス外し or Enter）
  // ────────────────────────────────────────────────
  const commitBpmInput = () => {
    const parsed = parseInt(bpmInputText, 10)
    if (isNaN(parsed)) {
      setBpmInputText(String(bpm))
      return
    }
    const clamped = Math.max(BPM_MIN, Math.min(BPM_MAX, parsed))
    setBpm(clamped)
    setBpmInputText(String(clamped))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        メトロノーム
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        BPM はスライダー・数値入力・プリセットの3通りで設定できるよ。合奏や個人練習に。
      </p>

      {/* ===== 拍子選択 ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
          拍子（1拍ごとに低音「ピッ」、拍頭で高音「ピッ」）
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

      {/* ===== BPM スライダー＋数値入力 ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-200">
            テンポ（BPM）
          </label>
          <div className="flex items-baseline gap-2">
            <input
              type="number"
              min={BPM_MIN}
              max={BPM_MAX}
              step={1}
              value={bpmInputText}
              onChange={(e) => setBpmInputText(e.target.value)}
              onBlur={commitBpmInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitBpmInput()
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
              className="w-24 px-2 py-1 text-3xl font-bold text-right text-warm-600 dark:text-warm-400 tabular-nums bg-transparent border-b-2 border-warm-300 dark:border-warm-700 focus:outline-none focus:border-warm-500"
              aria-label="BPM 数値入力"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">BPM</span>
          </div>
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

      {/* ===== プリセットボタン（よく使うテンポ） ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
          よく使うテンポ
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {TEMPO_PRESETS.map(p => (
            <button
              key={p.bpm}
              onClick={() => setBpm(p.bpm)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                bpm === p.bpm
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900"
              }`}
            >
              <div className="font-bold tabular-nums">♩= {p.bpm}</div>
              <div className="text-xs opacity-75">{p.label}</div>
              <div className="text-xs opacity-60">{p.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ===== スタート/ストップ ===== */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-12 py-4 rounded-full font-bold text-xl shadow-md transition-all ${
            isPlaying
              ? "bg-danger-400 hover:bg-danger-500 active:bg-danger-600 text-white"
              : "bg-brand-400 hover:bg-brand-500 active:bg-brand-600 text-white"
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
