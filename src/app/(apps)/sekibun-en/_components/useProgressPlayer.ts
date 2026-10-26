// ======================================================
// 進み具合 t（0〜1）を ▶／⏸／◀ で動かすフック（ステップ② ③ で共有）
//
//   play()      動いていれば止める（一時停止）。1 まで行っていれば 0 からやり直す。それ以外は 1 へ
//   rewind()    0 へもどす（三角形・帯から円へ）
//   setTo(v)    止めて t を v にする（スライダー・輪を選び直したとき）
//   t・moving   いまの進み具合と、動いている向き（1：進む、−1：もどる、null：止まっている）
//
// 長さは full（0 → 1 全部にかける時間）。途中からなら残りの割合だけ。動きは playback.ts の tweenT（linear なら一定の速さ）。
// 「動きを減らす」設定（prefers-reduced-motion）では短くする（押したときに読む）。
// 1 まで行き終わった瞬間だけ piron を1回鳴らす（もどるときは鳴らさない）。
// アニメの状態は毎フレーム書きかえるので state にせず ref に持つ。ページを離れたら止める。
// ======================================================

"use client"

import { useEffect, useRef, useState } from "react"
import * as se from "@/lib/se"
import { durationFor, tweenT } from "../_lib/playback"
import type { Direction } from "../_lib/playback"

/** 「動きを減らす」設定か（押したときに読む。SSR では読まない） */
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function useProgressPlayer(full: number, linear = false) {
  const [t, setT] = useState(0)
  const [moving, setMoving] = useState<Direction>(null)

  // アニメの状態（毎フレーム書きかえるので state にしない）
  const anim = useRef({ raf: 0, t: 0 })
  useEffect(() => () => cancelAnimationFrame(anim.current.raf), [])

  /** t を target へ動かす。いまの t から、残りの割合に応じた時間で */
  const animateTo = (target: 0 | 1, from = anim.current.t) => {
    cancelAnimationFrame(anim.current.raf)
    const dur = durationFor(from, target, prefersReducedMotion(), full)
    if (dur <= 0) return
    setMoving(target === 1 ? 1 : -1)
    let start = 0
    const frame = (now: number) => {
      if (!start) start = now
      const u = Math.min(1, (now - start) / dur)
      const tt = tweenT(from, target, u, linear)
      anim.current.t = tt
      setT(tt)
      if (u < 1) {
        anim.current.raf = requestAnimationFrame(frame)
        return
      }
      setMoving(null)
      // 行き終わった瞬間だけ1回鳴らす（もどるときは鳴らさない）
      if (target === 1) se.playSe(se.piron)
    }
    anim.current.raf = requestAnimationFrame(frame)
  }

  const stop = () => {
    cancelAnimationFrame(anim.current.raf)
    setMoving(null)
  }

  const play = () => {
    if (moving !== null) {
      stop()
      return
    }
    if (anim.current.t >= 1) {
      anim.current.t = 0
      setT(0)
      animateTo(1, 0)
      return
    }
    animateTo(1)
  }

  const rewind = () => {
    if (anim.current.t <= 0) return
    animateTo(0)
  }

  const setTo = (v: number) => {
    stop()
    anim.current.t = v
    setT(v)
  }

  return { t, moving, play, rewind, setTo }
}
