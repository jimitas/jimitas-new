// ======================================================
// useGameTimer フック
//
// 60秒タイムアタック形式のゲームで共通して使うタイマー管理フック。
// tasu-renshu・hiku-renshu など複数のアプリで利用。
//
// 機能:
//   - 残り時間のカウントダウン（setInterval）
//   - 「よーい」1秒待機（setTimeout）
//   - 正解数の管理（scoreRef で即時・setScore で表示）
//   - ゲーム終了時のコイン付与（N問ごとに1枚）
//
// 使い方:
//   const { time, score, isRunning, isRunningRef, start, stop, addScore, reset }
//     = useGameTimer({ initialSeconds: 60, coinsPerN: 5, addCoins, onReady, onEnd })
// ======================================================

"use client"

import { useState, useRef, useCallback, useEffect } from "react"

// ── 型定義 ────────────────────────────────────────────

type UseGameTimerOptions = {
  /** 初期秒数（60など） */
  initialSeconds: number
  /** N問正解で1コイン */
  coinsPerN: number
  /** コイン付与関数（useCoins() から渡す） */
  addCoins: (n: number) => void
  /** よーい後・ゲーム開始時のコールバック（問題生成など） */
  onReady?: () => void
  /** タイマー終了時のコールバック（獲得コイン数を引数で受け取る） */
  onEnd?: (earnedCoins: number) => void
}

type UseGameTimerReturn = {
  /** 残り秒数 */
  time: number
  /** 正解数 */
  score: number
  /** ゲーム中フラグ（state・再レンダー用） */
  isRunning: boolean
  /** ゲーム中フラグ（ref・setTimeout 内など即時性が必要な場面で使う） */
  isRunningRef: React.MutableRefObject<boolean>
  /** スタート（1秒よーい待機あり） */
  start: () => void
  /** ストップ（コイン付与・onEnd 呼び出し） */
  stop: () => void
  /** 正解時に呼ぶ（score を1増やす） */
  addScore: () => void
  /** 難易度変更時などに time/score 表示を初期値に戻す（非ゲーム中のみ） */
  reset: () => void
}

// ── フック本体 ────────────────────────────────────────

export function useGameTimer({
  initialSeconds,
  coinsPerN,
  addCoins,
  onReady,
  onEnd,
}: UseGameTimerOptions): UseGameTimerReturn {

  const [time,      setTime]      = useState(initialSeconds)
  const [score,     setScore]     = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  // タイマーID・ゲーム中フラグ・スコアを ref で管理
  // （useCallback のクロージャで古い値を参照しないようにするため）
  const inGameRef    = useRef(false)
  const timerRef     = useRef<ReturnType<typeof setInterval>  | null>(null)
  const startWaitRef = useRef<ReturnType<typeof setTimeout>   | null>(null)
  const scoreRef     = useRef(0)

  // コールバックを ref で保持（毎レンダーで最新版に更新）
  // → start() 内の setTimeout から最新の giveQuestion を呼べるようにする
  const onReadyRef = useRef(onReady)
  const onEndRef   = useRef(onEnd)
  onReadyRef.current = onReady
  onEndRef.current   = onEnd

  // ── タイマー停止ヘルパー ──────────────────────────────
  const clearTimers = useCallback(() => {
    if (startWaitRef.current) {
      clearTimeout(startWaitRef.current)   // 「よーい」1秒待機をキャンセル
      startWaitRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // ── 終了処理 ─────────────────────────────────────────
  const stop = useCallback(() => {
    if (!inGameRef.current) return
    inGameRef.current = false
    setIsRunning(false)
    clearTimers()

    // N問ごとに1コイン付与
    const earnedCoins = Math.floor(scoreRef.current / coinsPerN)
    if (earnedCoins > 0) addCoins(earnedCoins)

    // 終了コールバック（獲得コイン数を渡す）
    onEndRef.current?.(earnedCoins)
  // addCoins は安定しているが lint のため記載
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimers, coinsPerN])

  // ── スタート処理（1秒よーい待機あり） ─────────────────
  const start = useCallback(() => {
    if (inGameRef.current) return   // 二重起動防止
    inGameRef.current = true
    scoreRef.current  = 0
    setScore(0)
    setTime(initialSeconds)
    setIsRunning(true)

    // 1秒待機後にゲーム開始
    startWaitRef.current = setTimeout(() => {
      if (!inGameRef.current) return  // 待機中にストップされた場合
      onReadyRef.current?.()
      timerRef.current = setInterval(() => {
        setTime(t => (t > 0 ? t - 1 : 0))
      }, 1000)
    }, 1000)
  }, [initialSeconds])

  // ── 正解処理 ─────────────────────────────────────────
  const addScore = useCallback(() => {
    scoreRef.current += 1
    setScore(s => s + 1)
  }, [])

  // ── リセット（難易度変更時などに time/score 表示を戻す） ─
  const reset = useCallback(() => {
    if (inGameRef.current) return   // ゲーム中は何もしない
    setTime(initialSeconds)
    setScore(0)
  }, [initialSeconds])

  // ── 残り時間が 0 になったら終了 ──────────────────────
  useEffect(() => {
    if (time <= 0 && inGameRef.current) {
      stop()
    }
  }, [time, stop])

  return { time, score, isRunning, isRunningRef: inGameRef, start, stop, addScore, reset }
}
