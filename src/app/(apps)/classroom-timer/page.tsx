"use client"

// ======================================================
// 授業タイマー ページ
//
// URL: /classroom-timer
// 対象: 先生向け
// 内容: タイマー（カウントダウン）とストップウォッチ（カウントアップ）
//
// 機能:
//   - タイマー: 分・秒を設定してカウントダウン
//     残り30秒・10秒・5秒で効果音通知
//     終了時に効果音 + 画面メッセージ
//   - ストップウォッチ: 0.1秒単位表示の切り替え可能
//   - 共通: スタート・一時停止・ストップ・リセット
//   - タブタイトルに残り時間を表示
//   - キーボードショートカット対応
// ======================================================

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import * as se from "@/lib/se"
import { useAudioUnlock } from "@/hooks/useAudioUnlock"

// モード: タイマー or ストップウォッチ
type Mode = "timer" | "stopwatch"

// 動作状態: 待機 / 動作中 / 一時停止
type Phase = "idle" | "running" | "paused"

// 時間を「○○分○○秒」形式に変換
function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, "0")}分${String(s).padStart(2, "0")}秒`
}

// ストップウォッチの経過msを表示文字列に変換
function formatElapsed(ms: number, showTenths: boolean): string {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const t = Math.floor((ms % 1000) / 100)
  if (showTenths) {
    return `${String(m).padStart(2, "0")}分${String(s).padStart(2, "0")}.${t}秒`
  }
  return `${String(m).padStart(2, "0")}分${String(s).padStart(2, "0")}秒`
}

// ── コンポーネント ───────────────────────────────────

export default function ClassroomTimerPage() {

  // ── 状態管理 ────────────────────────────────────────
  const [mode, setMode]   = useState<Mode>("timer")
  const [phase, setPhase] = useState<Phase>("idle")

  // タイマー設定（入力値）
  const [inputMin, setInputMin] = useState(5)
  const [inputSec, setInputSec] = useState(0)

  // タイマー残り秒数（表示用）
  const [remaining, setRemaining] = useState(0)

  // ストップウォッチ経過ms（表示用）
  const [elapsed, setElapsed] = useState(0)

  // ストップウォッチ: 0.1秒表示トグル
  const [showTenths, setShowTenths] = useState(false)

  // メッセージ表示（タイマー終了・エラー通知用）
  const msgRef = useRef<HTMLParagraphElement>(null)

  // ── ref（setInterval 内から参照する値） ─────────────
  // setInterval のクロージャは古い state を参照するため、ref で最新値を保持する

  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const remainingRef   = useRef(0)      // タイマー残り秒数
  const swStartRef     = useRef(0)      // ストップウォッチ開始時刻
  const swElapsedRef   = useRef(0)      // ストップウォッチ累計ms（pause保持用）
  const phaseRef       = useRef<Phase>("idle")
  const modeRef        = useRef<Mode>("timer")

  // phase / mode の変更を ref にも反映（useLayoutEffect: レンダー直後に同期）
  useLayoutEffect(() => { phaseRef.current = phase }, [phase])
  useLayoutEffect(() => { modeRef.current = mode }, [mode])

  // ── オーディオ解除（タイマー終了時の自動再生に備える） ──
  useAudioUnlock()

  // ── タブタイトルを元に戻す（アンマウント時） ─────────
  useEffect(() => {
    const original = document.title
    return () => { document.title = original }
  }, [])

  // ── インターバルをクリアするヘルパー ─────────────────
  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // ── タイマー ────────────────────────────────────────

  const startTimer = () => {
    // 一時停止からの再開か、新規スタートかで初期秒数が異なる
    let total: number
    if (phaseRef.current === "paused") {
      total = remainingRef.current
    } else {
      total = inputMin * 60 + inputSec
      if (total <= 0) {
        se.playSe(se.alertSound)
        if (msgRef.current) {
          msgRef.current.textContent = "時間を設定してください"
          setTimeout(() => { if (msgRef.current) msgRef.current.textContent = "" }, 2000)
        }
        return
      }
      remainingRef.current = total
      setRemaining(total)
    }

    se.playSe(se.right)
    setPhase("running")
    document.title = `${formatTime(total)} ⏰タイマー`

    intervalRef.current = setInterval(() => {
      remainingRef.current -= 1
      const r = remainingRef.current
      setRemaining(r)
      document.title = `${formatTime(r)} ⏰タイマー`

      // 残り時間の通知音（30秒・10秒・5秒）
      if (r === 30 || r === 10 || r === 5) {
        se.playSe(se.set)
      }

      // タイマー終了
      if (r <= 0) {
        se.playSe(se.seikai1)
        clearTimer()
        setPhase("idle")
        setRemaining(0)
        document.title = "授業タイマー"
        if (msgRef.current) {
          msgRef.current.textContent = "⏰ 時間です！"
          setTimeout(() => { if (msgRef.current) msgRef.current.textContent = "" }, 4000)
        }
      }
    }, 1000)
  }

  const pauseTimer = () => {
    se.playSe(se.set)
    clearTimer()
    setPhase("paused")
    document.title = "⏸ タイマー（一時停止）"
  }

  const stopTimer = () => {
    se.playSe(se.set)
    clearTimer()
    setPhase("idle")
    setRemaining(0)
    remainingRef.current = 0
    document.title = "授業タイマー"
    if (msgRef.current) msgRef.current.textContent = ""
  }

  const resetTimer = () => {
    se.playSe(se.reset)
    clearTimer()
    setPhase("idle")
    setInputMin(5)
    setInputSec(0)
    setRemaining(0)
    remainingRef.current = 0
    document.title = "授業タイマー"
    if (msgRef.current) msgRef.current.textContent = ""
  }

  // ── ストップウォッチ ──────────────────────────────────

  const startStopwatch = () => {
    // 一時停止からの再開でなければ累計をリセット
    if (phaseRef.current !== "paused") {
      swElapsedRef.current = 0
      setElapsed(0)
    }

    se.playSe(se.right)
    setPhase("running")
    swStartRef.current = Date.now() - swElapsedRef.current

    // 0.1秒表示のときは100ms間隔、通常は1000ms間隔
    const interval = showTenths ? 100 : 1000
    intervalRef.current = setInterval(() => {
      const ms = Date.now() - swStartRef.current
      swElapsedRef.current = ms
      setElapsed(ms)
      document.title = `${formatElapsed(ms, showTenths)} ⏱ストップウォッチ`
    }, interval)
  }

  const pauseStopwatch = () => {
    se.playSe(se.set)
    clearTimer()
    setPhase("paused")
  }

  const stopStopwatch = () => {
    se.playSe(se.set)
    clearTimer()
    setPhase("idle")
    document.title = "授業タイマー"
  }

  const resetStopwatch = () => {
    se.playSe(se.reset)
    clearTimer()
    setPhase("idle")
    swElapsedRef.current = 0
    setElapsed(0)
    document.title = "授業タイマー"
  }

  // ── モード切り替え ────────────────────────────────────

  const switchMode = (m: Mode) => {
    if (modeRef.current === m) return
    se.playSe(se.set)
    clearTimer()
    setPhase("idle")
    setMode(m)
    setRemaining(0)
    swElapsedRef.current = 0
    setElapsed(0)
    remainingRef.current = 0
    document.title = "授業タイマー"
    if (msgRef.current) msgRef.current.textContent = ""
  }

  // ── 統合アクション（モードに応じて処理を分岐） ────────

  const handleStart  = () => modeRef.current === "timer" ? startTimer()      : startStopwatch()
  const handlePause  = () => modeRef.current === "timer" ? pauseTimer()      : pauseStopwatch()
  const handleStop   = () => modeRef.current === "timer" ? stopTimer()       : stopStopwatch()
  const handleReset  = () => modeRef.current === "timer" ? resetTimer()      : resetStopwatch()

  // ── キーボードショートカット ──────────────────────────
  // handlersRef を使って最新のハンドラを参照（依存配列なしで mount once）

  const handlersRef = useRef({ handleStart, handlePause, handleStop, handleReset, switchMode })
  useLayoutEffect(() => {
    handlersRef.current = { handleStart, handlePause, handleStop, handleReset, switchMode }
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // input フォーカス中はショートカットを無効にする
      if (e.target instanceof HTMLInputElement) return

      const h = handlersRef.current
      if (e.code === "Space") {
        e.preventDefault()
        if (phaseRef.current === "running") { h.handlePause() } else { h.handleStart() }
      }
      if (e.code === "Escape") h.handleStop()
      if (e.key === "r" || e.key === "R") h.handleReset()
      if (e.key === "t" || e.key === "T") h.switchMode("timer")
      if (e.key === "s" || e.key === "S") h.switchMode("stopwatch")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, []) // handlersRef.current 経由で常に最新のハンドラを参照するため再登録不要

  // ── 表示用の値を計算 ──────────────────────────────────

  // 残り30秒以下かつ動作中のとき、警告色（赤・点滅）を表示
  const isWarning = mode === "timer" && phase === "running" && remaining <= 30 && remaining > 0

  // idle 時はタイマー設定値を表示、running/paused 時は実際の残り時間/経過時間を表示
  const displayTime =
    mode === "timer"
      ? formatTime(phase === "idle" ? inputMin * 60 + inputSec : remaining)
      : formatElapsed(elapsed, showTenths)

  // ── レンダリング ──────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">

      {/* ===== ページタイトル ===== */}
      <header className="text-center mt-4 md:mt-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
          {mode === "timer" ? "⏰ タイマー" : "⏱️ ストップウォッチ"}
        </h1>
      </header>

      <main className="flex-grow flex flex-col items-center mt-6 px-4 gap-6">

        {/* ===== モード切り替え ===== */}
        <div className="flex gap-2">
          <button
            onClick={() => switchMode("timer")}
            className={`px-4 py-2 rounded-lg font-bold border-2 transition-colors
              ${mode === "timer"
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 hover:border-brand-400"
              }`}
          >
            ⏲️ タイマー
          </button>
          <button
            onClick={() => switchMode("stopwatch")}
            className={`px-4 py-2 rounded-lg font-bold border-2 transition-colors
              ${mode === "stopwatch"
                ? "bg-accent-500 text-white border-accent-500"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 hover:border-accent-400"
              }`}
          >
            ⏱️ ストップウォッチ
          </button>
        </div>

        {/* ===== 時間表示 ===== */}
        <div
          className={`text-5xl md:text-7xl font-mono font-bold tracking-wide transition-colors select-none
            ${isWarning
              ? "text-red-500 animate-pulse"
              : "text-gray-800 dark:text-gray-100"
            }`}
        >
          {displayTime}
        </div>

        {/* ===== タイマー: 時間入力（idle のときのみ表示） ===== */}
        {mode === "timer" && phase === "idle" && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={99}
              value={inputMin}
              onChange={e => setInputMin(Math.max(0, parseInt(e.target.value) || 0))}
              onKeyDown={e => { if (e.key === "Enter") handleStart() }}
              className="w-16 text-center border-2 border-gray-300 rounded-lg px-2 py-1
                         text-2xl font-bold focus:outline-none focus:border-brand-400
                         dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            />
            <span className="text-xl font-bold text-gray-600 dark:text-gray-300">分</span>
            <input
              type="number"
              min={0}
              max={59}
              value={inputSec}
              onChange={e => setInputSec(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              onKeyDown={e => { if (e.key === "Enter") handleStart() }}
              className="w-16 text-center border-2 border-gray-300 rounded-lg px-2 py-1
                         text-2xl font-bold focus:outline-none focus:border-brand-400
                         dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            />
            <span className="text-xl font-bold text-gray-600 dark:text-gray-300">秒</span>
          </div>
        )}

        {/* ===== ストップウォッチ: 0.1秒表示トグル（idle のときのみ表示） ===== */}
        {mode === "stopwatch" && phase === "idle" && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showTenths}
              onChange={e => setShowTenths(e.target.checked)}
              className="w-5 h-5 accent-accent-500"
            />
            <span className="text-base font-bold text-gray-700 dark:text-gray-300">
              0.1秒単位で表示
            </span>
          </label>
        )}

        {/* ===== コントロールボタン ===== */}
        <div className="flex flex-wrap justify-center gap-3">

          {/* スタート / 再開（running 中は非表示） */}
          {phase !== "running" && (
            <button
              onClick={handleStart}
              className="px-6 py-3 rounded-xl bg-brand-400 hover:bg-brand-500 active:bg-brand-600 active:translate-y-0.5
                         text-white font-bold text-lg shadow-md transition-colors"
            >
              {phase === "paused" ? "▶️ 再開" : "▶️ スタート"}
            </button>
          )}

          {/* 一時停止（running 中のみ表示） */}
          {phase === "running" && (
            <button
              onClick={handlePause}
              className="px-6 py-3 rounded-xl bg-warm-400 hover:bg-warm-500 active:bg-warm-600 active:translate-y-0.5
                         text-white font-bold text-lg shadow-md transition-colors"
            >
              ⏸️ 一時停止
            </button>
          )}

          {/* ストップ（idle 以外で表示） */}
          {phase !== "idle" && (
            <button
              onClick={handleStop}
              className="px-6 py-3 rounded-xl bg-danger-400 hover:bg-danger-500 active:bg-danger-600 active:translate-y-0.5
                         text-white font-bold text-lg shadow-md transition-colors"
            >
              ⏹️ ストップ
            </button>
          )}

          {/* リセット（常に表示） */}
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-xl bg-danger-400 hover:bg-danger-500 active:bg-danger-600 active:translate-y-0.5
                       text-white font-bold text-lg shadow-md transition-colors"
          >
            🔄 リセット
          </button>

        </div>

        {/* ===== メッセージ（エラー・終了通知） ===== */}
        <p
          ref={msgRef}
          className="text-xl font-bold text-red-500 min-h-[2rem] text-center"
        />

        {/* ===== キーボードショートカットのヒント ===== */}
        <p className="text-xs text-gray-400 text-center mt-auto pb-6">
          Space: スタート / 一時停止　　Esc: ストップ　　R: リセット　　T: タイマー　　S: ストップウォッチ
        </p>

      </main>
    </div>
  )
}
