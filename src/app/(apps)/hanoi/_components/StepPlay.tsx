// ======================================================
// ステップ① あそぶ（手で動かす）
//
// タップ（動かしたい棒 → 置きたい棒）とドラッグ＆ドロップの両方で動かせる。
// ルール違反（小さい円盤の上に大きい円盤）は置けず、円盤はもどり、回数に数えない。
// クリアすると記録表に入る（同じ枚数はいちばん少ない回数を残す）。最少回数は初期状態でかくす。
// ドラッグは document レベルのリスナー・touch-action:none（自由配置DnD3原則）。
// 棒のタップも pointerup で判定する（click と二重に動かないように、onClick は付けない）。
// ======================================================

"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Btn } from "@/components/parts/buttons/Btn"
import { useText } from "@/components/parts/graph/Display"
import * as se from "@/lib/se"
import { DISK_STROKE, diskColor } from "../_lib/colors"
import { canMove, isSolved, moveLabel, recordRows, replay, tryMove, verdict } from "../_lib/play"
import type { Records } from "../_lib/play"
import { PEGS } from "../_lib/solve"
import type { Move, Peg } from "../_lib/solve"
import * as T from "../_lib/textPlay"
import type { Level } from "../_lib/text"
import { BOARD_W, HanoiBoard, PEG_X } from "./HanoiBoard"
import { Confetti } from "./Confetti"
import type { ConfettiHandle } from "./Confetti"
import { useHanoiKeys } from "./useHanoiKeys"

const DRAG_START_PX = 6

interface Props {
  n: number
  to: Peg
  level: Level
  records: Records
  onClear: (n: number, count: number) => void
  showMin: boolean
  onToggleMin: () => void
  /** 遊びかけ（1手以上動かして未クリア）かを親に知らせる。枚数・移動先を変える前の確認に使う */
  onDirty: (dirty: boolean) => void
}

export function StepPlay({ n, to, level, records, onClear, showMin, onToggleMin, onDirty }: Props) {
  const [history, setHistory] = useState<Move[]>([])
  const [selected, setSelected] = useState<Peg | null>(null)
  const [message, setMessage] = useState("")
  const [drag, setDrag] = useState<{ disk: number; x: number; y: number } | null>(null)
  const [stamp, setStamp] = useState("")
  const confetti = useRef<ConfettiHandle>(null)
  const clearRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const readout = useText("readout")

  const pegs = replay(n, history)
  const count = history.length
  const solved = isSolved(pegs, n, to)

  /** 1手を試す。置けなければ円盤はもどり（selected を外す）、メッセージを出して回数に数えない */
  const attempt = (from: Peg, dest: Peg) => {
    setSelected(null)
    if (from === dest) return
    const c = canMove(pegs, from, dest)
    if (!c.ok) {
      setMessage(c.reason === "bigOnSmall" ? T.MSG_BIG_ON_SMALL : T.MSG_EMPTY)
      se.playSe(se.alertSound)
      return
    }
    const r = tryMove(pegs, from, dest)
    if (!r) return
    setMessage("")
    se.playSe(se.move1)
    const next = [...history, r.move]
    setHistory(next)
    onDirty(!isSolved(r.pegs, n, to))
    if (isSolved(r.pegs, n, to)) {
      setStamp(T.clearStamp(n, next.length, new Date()))
      onClear(n, next.length)
      confetti.current?.fire()
      se.playSe(se.seikai1)
    }
  }

  /** 棒のタップ（1回目：持ち上げる、2回目：置く、同じ棒：取り消し） */
  const tap = (p: Peg) => {
    if (solved) return
    if (selected === null) {
      if (pegs[p].length === 0) {
        setMessage(T.MSG_EMPTY)
        return
      }
      setMessage("")
      setSelected(p)
      return
    }
    if (selected === p) {
      setSelected(null)
      return
    }
    attempt(selected, p)
  }

  // ---- ドラッグ（document レベルのリスナー）-------------------------------------
  const latest = useRef({ tap, attempt })
  useLayoutEffect(() => {
    latest.current = { tap, attempt }
  })
  const cleanup = useRef<(() => void) | null>(null)
  useEffect(() => () => cleanup.current?.(), [])

  /** クライアント座標 → 盤の SVG 座標 */
  const toSvg = (cx: number, cy: number) => {
    const svg = svgRef.current
    const m = svg?.getScreenCTM()
    if (!svg || !m) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = cx
    pt.y = cy
    const q = pt.matrixTransform(m.inverse())
    return { x: q.x, y: q.y }
  }
  const nearestPeg = (x: number): Peg | null => {
    if (x < 0 || x > BOARD_W) return null
    return PEGS.reduce((best, p) => (Math.abs(PEG_X[p] - x) < Math.abs(PEG_X[best] - x) ? p : best), PEGS[0])
  }

  const onPegPointerDown = (p: Peg, e: React.PointerEvent) => {
    if (solved || e.button > 0) return
    cleanup.current?.()
    const top = pegs[p][pegs[p].length - 1]
    // すでに持ち上げているとき、または空の棒は、ドラッグせずタップとして扱う
    const canDrag = selected === null && top !== undefined
    const s = { x: e.clientX, y: e.clientY, moved: false }
    const move = (ev: PointerEvent) => {
      if (!canDrag) return
      if (!s.moved && Math.hypot(ev.clientX - s.x, ev.clientY - s.y) < DRAG_START_PX) return
      s.moved = true
      const q = toSvg(ev.clientX, ev.clientY)
      setDrag({ disk: top, x: q.x, y: q.y })
    }
    const up = (ev: PointerEvent) => {
      cleanup.current?.()
      setDrag(null)
      if (!s.moved) {
        latest.current.tap(p)
        return
      }
      const dest = nearestPeg(toSvg(ev.clientX, ev.clientY).x)
      if (dest) latest.current.attempt(p, dest)
    }
    const cancel = () => {
      cleanup.current?.()
      setDrag(null)
    }
    document.addEventListener("pointermove", move)
    document.addEventListener("pointerup", up)
    document.addEventListener("pointercancel", cancel)
    cleanup.current = () => {
      document.removeEventListener("pointermove", move)
      document.removeEventListener("pointerup", up)
      document.removeEventListener("pointercancel", cancel)
      cleanup.current = null
    }
  }

  // クリアしたら、画面の下にあるクリア表示が見えるようにスクロールする
  useEffect(() => {
    if (!solved) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    clearRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" })
  }, [solved])

  useHanoiKeys({ "1": () => tap("A"), "2": () => tap("B"), "3": () => tap("C") })

  const undo = () => {
    setSelected(null)
    setMessage("")
    setStamp("")
    setHistory((h) => h.slice(0, -1))
    onDirty(history.length - 1 > 0)
  }
  const reset = () => {
    setSelected(null)
    setMessage("")
    setStamp("")
    setHistory([])
    onDirty(false)
  }

  const rows = recordRows(records)
  const v = solved ? verdict(n, count) : null
  const cell = "border border-gray-300 dark:border-gray-600 px-3 py-1"

  return (
    <div className="space-y-4">
      <Confetti ref={confetti} />
      <p className="text-gray-700 dark:text-gray-200">{T.PLAY_INTRO}</p>

      <div className="text-center">
        <span className="text-gray-700 dark:text-gray-200 font-bold">{T.COUNT_LABEL}</span>
        <span className="ml-3 text-5xl md:text-6xl font-bold tabular-nums text-gray-900 dark:text-gray-50" data-play-count>{count}</span>
        <span className="ml-1 text-xl text-gray-700 dark:text-gray-200">回</span>
        {showMin && (
          <span className={`ml-4 text-gray-600 dark:text-gray-300 ${readout}`} data-min-text>
            最少回数 {T.minText(n, level)}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2">
        <HanoiBoard
          pegs={pegs}
          n={n}
          lifted={selected}
          highlight={drag ? null : selected}
          dragging={drag}
          svgRef={svgRef}
          onPegPointerDown={onPegPointerDown}
          ariaLabel="棒をタップして円盤を動かす盤"
        />
      </div>

      <p className="min-h-[1.75em] text-center font-bold text-warm-700 dark:text-warm-300" role="status" aria-live="polite" data-play-message>
        {message}
      </p>

      {solved && v && (
        <div ref={clearRef} className="rounded-xl border-2 border-gray-700 dark:border-gray-200 p-4 text-center space-y-1" data-clear>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">{T.clearText(count)}</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100" data-verdict>
            {v === "best" ? T.VERDICT_BEST : T.VERDICT_MORE}
          </p>
          <p className="text-sm tabular-nums text-gray-600 dark:text-gray-300" data-stamp>{stamp}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Btn color="neutral" onClick={undo} disabled={count === 0} className="px-4 py-2 shrink-0">{T.BTN_UNDO}</Btn>
        <Btn color="danger" onClick={reset} disabled={count === 0} className="px-4 py-2 shrink-0">{T.BTN_RESET}</Btn>
        <Btn color="accent" onClick={onToggleMin} className="px-4 py-2 shrink-0" ariaPressed={showMin}>
          {showMin ? T.MIN_HIDE : T.MIN_SHOW}
        </Btn>
      </div>
      <p className="hidden sm:block text-center text-[11px] text-gray-500 dark:text-gray-400">{T.PLAY_KEYS}</p>

      <section aria-label={T.RECORD_TITLE} className="space-y-1">
        <p className="font-bold text-gray-800 dark:text-gray-100">{T.RECORD_TITLE}</p>
        <div className="overflow-x-auto">
          <table className="w-full max-w-md text-center border-collapse" data-records>
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                {T.RECORD_HEAD.map((h) => (
                  <th key={h} className={`${cell} font-bold`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className={`${cell} py-2 text-gray-500 dark:text-gray-400`}>{T.RECORD_EMPTY}</td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.n} data-record-row={r.n} className="text-gray-900 dark:text-gray-50 tabular-nums">
                  <td className={cell}>{r.n}</td>
                  <td className={`${cell} font-bold`}>{r.count}</td>
                  <td className={cell} data-record-min>{showMin ? 2 ** r.n - 1 : "？"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <details className="rounded-lg border border-gray-200 dark:border-gray-700 p-2">
        <summary className="cursor-pointer font-bold text-gray-800 dark:text-gray-100">{T.LOG_TITLE}（{count}手）</summary>
        <ol className="mt-2 columns-2 sm:columns-3 text-sm text-gray-700 dark:text-gray-200 tabular-nums" data-log>
          {history.map((m, i) => (
            <li key={i} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: diskColor(m.disk), border: `1px solid ${DISK_STROKE}` }} aria-hidden />
              {moveLabel(i + 1, m)}
            </li>
          ))}
        </ol>
      </details>
    </div>
  )
}
