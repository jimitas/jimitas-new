"use client"

// ======================================================
// サイン波シミュレーター
//
// GitHub: https://github.com/jimitas/sign-wave（バニラHTML/JS版）を移植。
// Web Audio API の OscillatorNode でサイン波を鳴らし、周波数（100〜2000Hz）と
// 音量をスライダーで調整できる。AnalyserNode + Canvas で振幅の時間変化を
// リアルタイムに描画し、「音は波」であることを視覚的に確かめられる。
// 対象: 中学・高校（情報・数学）。
//
// 実装:
//   グラフ接続 = oscillator → gain → analyser → destination
//   再生/停止・クリーンアップの土台は oto-dashiyo（音を出そう）を流用。
// ======================================================

import { useState, useEffect, useRef, useCallback } from "react"

// サイン波の描画色（波形の折れ線）
const WAVE_COLOR = "#3b82f6" // brand-500 相当

export default function SignWavePage() {
  const [hz, setHz] = useState(440)
  const [vol, setVol] = useState(0.2)
  const [isPlaying, setIsPlaying] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const rafRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // -------------------------------------------------------
  // キャンバスに1フレーム分の波形を描く
  // stopped 状態では中心線（点線）だけを描く
  // -------------------------------------------------------
  const drawFrame = useCallback((animate: boolean) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext("2d")
    if (!ctx2d) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.width / dpr
    const h = canvas.height / dpr
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)

    // 背景
    ctx2d.fillStyle = "#0f172a" // slate-900
    ctx2d.fillRect(0, 0, w, h)

    // 中心線
    ctx2d.strokeStyle = "rgba(148,163,184,0.5)" // slate-400
    ctx2d.lineWidth = 1
    ctx2d.setLineDash(animate ? [] : [6, 6])
    ctx2d.beginPath()
    ctx2d.moveTo(0, h / 2)
    ctx2d.lineTo(w, h / 2)
    ctx2d.stroke()
    ctx2d.setLineDash([])

    const analyser = analyserRef.current
    const dataArray = dataArrayRef.current
    if (animate && analyser && dataArray) {
      analyser.getByteTimeDomainData(dataArray)

      // 0〜255（128=無音）を正規化してキャンバス縦幅にマッピング
      ctx2d.strokeStyle = WAVE_COLOR
      ctx2d.lineWidth = 2
      ctx2d.beginPath()
      const slice = w / dataArray.length
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128 // 0〜2（1=中心）
        const y = (v * h) / 2
        const x = i * slice
        if (i === 0) ctx2d.moveTo(x, y)
        else ctx2d.lineTo(x, y)
      }
      ctx2d.stroke()
    }
  }, [])

  // -------------------------------------------------------
  // 描画ループ（再生中のみ requestAnimationFrame で回す）
  // -------------------------------------------------------
  const startDrawLoop = useCallback(() => {
    const loop = () => {
      drawFrame(true)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [drawFrame])

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
    osc.type = "sine"
    osc.frequency.setValueAtTime(hz, ctx.currentTime)

    // 音量はゲインで制御（急変によるクリックノイズ防止のため 0 から立ち上げる）
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.05)

    // 波形表示用アナライザー（表示時間窓 約46ms）
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    const dataArray = new Uint8Array(new ArrayBuffer(analyser.fftSize))

    // oscillator → gain → analyser → destination
    osc.connect(gain)
    gain.connect(analyser)
    analyser.connect(ctx.destination)
    osc.start()

    oscRef.current = osc
    gainRef.current = gain
    analyserRef.current = analyser
    dataArrayRef.current = dataArray
    setIsPlaying(true)
    startDrawLoop()
  }, [hz, vol, startDrawLoop])

  // -------------------------------------------------------
  // 再生停止（フェードアウトしてからストップ・最後の波形は残す）
  // -------------------------------------------------------
  const stopSound = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const ctx = audioCtxRef.current
    const osc = oscRef.current
    const gain = gainRef.current
    if (ctx && osc && gain) {
      const now = ctx.currentTime
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(gain.gain.value, now)
      gain.gain.linearRampToValueAtTime(0, now + 0.05)
      osc.stop(now + 0.06)
    }
    oscRef.current = null
    gainRef.current = null
    setIsPlaying(false)
  }, [])

  // -------------------------------------------------------
  // 周波数変更：再生中ならなめらかに即時反映
  // -------------------------------------------------------
  useEffect(() => {
    const osc = oscRef.current
    const ctx = audioCtxRef.current
    if (osc && ctx) {
      osc.frequency.setTargetAtTime(hz, ctx.currentTime, 0.01)
    }
  }, [hz])

  // -------------------------------------------------------
  // 音量変更：再生中ならなめらかに即時反映
  // -------------------------------------------------------
  useEffect(() => {
    const gain = gainRef.current
    const ctx = audioCtxRef.current
    if (gain && ctx) {
      gain.gain.setTargetAtTime(vol, ctx.currentTime, 0.01)
    }
  }, [vol])

  // -------------------------------------------------------
  // キャンバスのサイズを表示サイズ×dprに同期（HiDPI対応）
  // 初回と画面リサイズ時に実行。停止中は中心線だけ描く。
  // -------------------------------------------------------
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      // 再生中は次フレームで描き直されるので、停止中のみ即描画
      if (!oscRef.current) drawFrame(false)
    }
    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [drawFrame])

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopSound()
      audioCtxRef.current?.close()
    }
  }, [stopSound])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        サイン波シミュレーター
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        周波数を変えて、音の高さと波形の変化を確かめよう。「音は波」であることを目と耳で体感できます。
      </p>
      <p className="text-xs text-warm-700 dark:text-warm-300 mb-6">
        ⚠ 大きな音が出ないように、音量に注意してください。
      </p>

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
          min={100}
          max={2000}
          step={1}
          value={hz}
          onChange={(e) => setHz(parseInt(e.target.value, 10))}
          className="w-full"
          style={{ accentColor: "var(--color-brand-500, #3b82f6)" }}
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span>100Hz</span>
          <span>低い ← → 高い</span>
          <span>2000Hz</span>
        </div>
      </div>

      {/* ===== 音量スライダー ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-200">
            音量
          </label>
          <span className="text-2xl font-bold text-warm-600 dark:text-warm-400 tabular-nums">
            {vol.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={0.5}
          step={0.01}
          value={vol}
          onChange={(e) => setVol(parseFloat(e.target.value))}
          className="w-full"
          style={{ accentColor: "var(--color-brand-500, #3b82f6)" }}
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span>小さい</span>
          <span>大きい</span>
        </div>
      </div>

      {/* ===== 再生/停止 ===== */}
      <div className="flex justify-center gap-3 mb-4">
        <button
          onClick={startSound}
          disabled={isPlaying}
          className={`px-8 py-3 rounded-full font-bold text-lg shadow-md transition-all ${
            isPlaying
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-brand-400 hover:bg-brand-500 active:bg-brand-600 text-white"
          }`}
        >
          ▶ 再生
        </button>
        <button
          onClick={stopSound}
          disabled={!isPlaying}
          className={`px-8 py-3 rounded-full font-bold text-lg shadow-md transition-all ${
            !isPlaying
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-danger-400 hover:bg-danger-500 active:bg-danger-600 text-white"
          }`}
        >
          ■ 停止
        </button>
      </div>

      {/* ===== 波形（振幅の時間変化）===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
          波形（振幅の時間変化）
        </h2>
        <canvas
          ref={canvasRef}
          className="w-full h-48 md:h-56 rounded-lg"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          周波数が高いほど波が詰まって見えます（表示時間窓：約46ms固定）
        </p>
      </div>
    </div>
  )
}
