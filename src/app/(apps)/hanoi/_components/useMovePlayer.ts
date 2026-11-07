// ======================================================
// ステップ②：k 手目までの再生（▶／⏸／1手／最初へ／最後へ／スライダー）
//
// k は「終わった手数」（0〜total）。再生中は 1手ぶんの弧の進み具合 u も持つ。
// 1手が 80ms 未満のとき、または「動きを減らす」設定のときは弧を描かず、瞬間移動で進める。
// 最後の手が終わった瞬間だけ piron を1回鳴らす。ページを離れたら止める。
// アニメの時間は毎フレーム変わるので ref で持ち、state には k と u だけ置く。
// ======================================================

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import * as se from "@/lib/se"

export const INSTANT_MS = 80
/** 速さの段（1手あたりの秒数）。要件 F2-2：2秒〜0.02秒、初期1秒 */
export const SPEEDS = [2, 1, 0.5, 0.2, 0.1, 0.05, 0.02] as const
export const DEFAULT_SPEED_INDEX = 1

/** 「動きを減らす」設定か（毎フレーム読む。SSR では読まない） */
const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function useMovePlayer(total: number, speedSec: number) {
  const [k, setKState] = useState(0)
  const [u, setU] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const r = useRef({ raf: 0, last: 0, acc: 0, k: 0, playing: false, speed: speedSec })
  const loop = useRef<(now: number) => void>(() => {})

  useEffect(() => {
    r.current.speed = speedSec
  }, [speedSec])

  const setK = useCallback((v: number) => {
    r.current.k = v
    setKState(v)
  }, [])

  const stop = useCallback(() => {
    cancelAnimationFrame(r.current.raf)
    r.current.playing = false
    r.current.acc = 0
    setPlaying(false)
    setU(null)
  }, [])

  useEffect(() => () => cancelAnimationFrame(r.current.raf), [])

  useEffect(() => {
    loop.current = (now: number) => {
      const s = r.current
      if (!s.playing) return
      const dt = s.last ? Math.min(now - s.last, 250) : 0
      s.last = now
      s.acc += dt
      const rm = prefersReduced()
      const interval = rm ? Math.min(s.speed * 1000, 400) : s.speed * 1000
      if (rm || interval < INSTANT_MS) {
        const steps = Math.floor(s.acc / interval)
        s.acc -= steps * interval
        if (steps > 0) {
          const nk = Math.min(total, s.k + steps)
          setK(nk)
          if (nk >= total) {
            stop()
            se.playSe(se.piron)
            return
          }
        }
        setU(null)
      } else {
        if (s.acc >= interval) {
          s.acc -= interval
          const nk = s.k + 1
          setK(nk)
          if (interval >= 300) se.playSe(se.move1)
          if (nk >= total) {
            stop()
            se.playSe(se.piron)
            return
          }
        }
        setU(Math.min(1, s.acc / interval))
      }
      s.raf = requestAnimationFrame((t) => loop.current(t))
    }
  }, [total, setK, stop])

  const play = useCallback(() => {
    const s = r.current
    if (s.playing) {
      stop()
      return
    }
    if (s.k >= total) setK(0)
    s.playing = true
    s.last = 0
    s.acc = 0
    setPlaying(true)
    s.raf = requestAnimationFrame((t) => loop.current(t))
  }, [stop, setK, total])

  const seek = useCallback(
    (v: number) => {
      stop()
      setK(Math.max(0, Math.min(total, v)))
    },
    [stop, setK, total],
  )

  return {
    k,
    /** 動いている手の進み具合（止まっている・瞬間移動のときは null） */
    u: playing ? u : null,
    playing,
    play,
    seek,
    forward: () => seek(r.current.k + 1),
    back: () => seek(r.current.k - 1),
    toStart: () => seek(0),
    toEnd: () => seek(total),
  }
}
