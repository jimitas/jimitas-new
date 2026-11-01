// ======================================================
// さいころをふって集計をためていくフック（セクション1・2で共用）
//
// methods に ["A"] を渡せば1方式、["A", "B"] なら2方式を同じ回数ずつ同時にふる。
//
// 少ない回数（100回まで）は1回ずつ積み上がるアニメ、それより多いと一度に計算する。
// 得点は先にまとめて作っておき、タイマーでは「次の1個を足す」だけにする。
// （state の更新関数の中で乱数を引くと、開発時の StrictMode で2回呼ばれて結果が変わるため）
//
// gen は世代番号。「はじめから」や別の回数を押したら古いタイマーの続きを無視する。
// ======================================================

"use client"

import { useEffect, useRef, useState } from "react"
import { rollMany } from "../_lib/dice"
import type { Method } from "../_lib/dice"
import { addScores, emptyTally } from "../_lib/stats"
import type { Tally } from "../_lib/stats"

/** これ以下の回数は1回ずつアニメで積む */
const ANIMATE_MAX = 100
/** 1回あたりの間隔（ms）。回数が多いときは全体が約2.5秒に収まるよう短くする */
const STEP_MS = 80
const TOTAL_MS = 2500

export function useRoller(methods: readonly Method[]) {
  const [tallies, setTallies] = useState<Tally[]>(() => methods.map(() => emptyTally()))
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gen = useRef(0)

  const stopTimer = () => {
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => stopTimer, [])

  /** k 回ふる。fresh なら今までの結果を捨ててから */
  const roll = (k: number, fresh: boolean) => {
    stopTimer()
    const g = ++gen.current
    const scores = methods.map((m) => rollMany(m, k, Math.random))
    if (fresh) setTallies(methods.map(() => emptyTally()))

    if (k > ANIMATE_MAX) {
      setTallies((ts) => ts.map((t, i) => addScores(fresh ? emptyTally() : t, scores[i])))
      setBusy(false)
      return
    }
    const step = Math.min(STEP_MS, TOTAL_MS / k)
    let i = 0
    setBusy(true)
    const tick = () => {
      if (g !== gen.current) return
      const j = i
      setTallies((ts) => ts.map((t, m) => addScores(t, [scores[m][j]])))
      i++
      if (i < k) timer.current = setTimeout(tick, step)
      else {
        timer.current = null
        setBusy(false)
      }
    }
    tick()
  }

  const reset = () => {
    stopTimer()
    gen.current++
    setTallies(methods.map(() => emptyTally()))
    setBusy(false)
  }

  return { tallies, busy, roll, reset }
}
