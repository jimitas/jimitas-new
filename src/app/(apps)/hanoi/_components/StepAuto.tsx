// ======================================================
// ステップ② 自動で解く（ビデオで最も使う画面）
//
// 盤＋操作パネル＋進み具合スライダー、「いま k 手目／ぜんぶで 2ⁿ−1 手」、
// 3つの区切りのバー（F2-5・F2-6）、手順の帯（F2-11）、円盤ごとの回数表（F2-7）、
// 2進法カウンター（F2-8）、手で解くコツ（F2-9）。
// 手順は先に全部つくり、k 手目の状態は _lib/solve.ts の stateAt（スナップショット経由）で求める。
// ======================================================

"use client"

import { useMemo, useState } from "react"
import { useText } from "@/components/parts/graph/Display"
import { diskMark, moveLabel } from "../_lib/play"
import { buildSnapshots, diskCounts, smallestDirection, solveTo, stateAt } from "../_lib/solve"
import type { Peg } from "../_lib/solve"
import { AUTO_INTRO, TIP_LINES, TIP_TITLE, cycleText } from "../_lib/text"
import type { Level } from "../_lib/text"
import { AutoControls } from "./AutoControls"
import { BinaryCounter } from "./BinaryCounter"
import { DiskCountTable } from "./DiskCountTable"
import { HanoiBoard } from "./HanoiBoard"
import type { Flying } from "./HanoiBoard"
import { MoveStrip } from "./MoveStrip"
import { SegmentBar } from "./SegmentBar"
import { useHanoiKeys } from "./useHanoiKeys"
import { DEFAULT_SPEED_INDEX, SPEEDS, useMovePlayer } from "./useMovePlayer"

interface Props {
  n: number
  to: Peg
  level: Level
}

export function StepAuto({ n, to, level }: Props) {
  const moves = useMemo(() => solveTo(n, to), [n, to])
  const snaps = useMemo(() => buildSnapshots(moves, n), [moves, n])
  const total = moves.length
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED_INDEX)
  const p = useMovePlayer(total, SPEEDS[speedIndex])
  const readout = useText("readout")

  useHanoiKeys({ " ": p.play, ArrowLeft: p.back, ArrowRight: p.forward })

  const pegs = stateAt(moves, n, p.k, snaps)
  const counts = diskCounts(moves, n, p.k)

  // 動いている手（k+1 手目）の弧。動く円盤は出発の棒の一番上なので、描くときは棒から外す
  let flying: Flying | null = null
  let shown = pegs
  if (p.u !== null && p.k < total) {
    const m = moves[p.k]
    flying = { move: m, u: p.u, destHeight: pegs[m.to].length, fromHeight: pegs[m.from].length - 1 }
    shown = { ...pegs, [m.from]: pegs[m.from].slice(0, -1) }
  }

  const dir = smallestDirection(moves)
  const lastMove = p.k >= 1 ? moves[p.k - 1] : null

  return (
    <div className="space-y-5">
      <p className="text-gray-700 dark:text-gray-200">{AUTO_INTRO}</p>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2">
        <HanoiBoard pegs={shown} n={n} flying={flying} />
      </div>

      <div className="text-center space-y-1">
        <p className={`font-bold tabular-nums text-gray-900 dark:text-gray-50 ${readout}`} data-progress>
          いま {p.k} 手目　／　ぜんぶで {total} 手
        </p>
        <p className={`text-gray-700 dark:text-gray-200 min-h-[1.75em] ${readout}`} data-move-label>
          {lastMove ? moveLabel(p.k, lastMove) : "まだ動いていないよ"}
        </p>
        {p.k >= total && <p className="font-bold text-gray-900 dark:text-gray-50 text-xl">完成！</p>}
      </div>

      <AutoControls
        playing={p.playing}
        onTogglePlay={p.play}
        onBack={p.back}
        onForward={p.forward}
        onStart={p.toStart}
        onEnd={p.toEnd}
        k={p.k}
        total={total}
        onSeek={p.seek}
        speedIndex={speedIndex}
        onSpeedIndex={setSpeedIndex}
      />

      <SegmentBar n={n} k={p.k} to={to} level={level} />
      <MoveStrip moves={moves} k={p.k} onSeek={p.seek} />
      <DiskCountTable n={n} counts={counts} k={p.k} total={total} />
      <BinaryCounter n={n} k={p.k} />

      <section className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 space-y-1" aria-label={TIP_TITLE}>
        <p className="font-bold text-gray-800 dark:text-gray-100">{TIP_TITLE}</p>
        <ul className="list-disc pl-5 text-gray-700 dark:text-gray-200">
          {TIP_LINES.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {dir && n >= 2 && (
          <p className="text-gray-800 dark:text-gray-100" data-tip-direction>
            {diskMark(1)}は いつも <strong className="tabular-nums">{cycleText(dir.from, dir.to)}</strong> の向きに動くよ。
          </p>
        )}
      </section>
    </div>
  )
}
