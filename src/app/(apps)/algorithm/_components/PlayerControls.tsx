// ======================================================
// 再生・コマ送り・速度・要素数の操作パネル
//
// 状態は持たない。すべて props で受けて親に返す。
// ======================================================

"use client"

import { Btn } from "@/components/parts/buttons/Btn"
import { BtnMode } from "@/components/parts/buttons/BtnMode"
import type { DataKind } from "../_lib/types"

/** 1ステップあたりの時間（ms）。小さいほど速い */
export const SPEED_MIN = 20
export const SPEED_MAX = 1000

export const N_MIN = 5
export const N_MAX = 50

const DATA_LABEL: Record<DataKind, string> = {
  random: "ばらばら",
  nearly: "ほぼ順番",
  reverse: "逆順",
  same: "全部同じ",
}

type Props = {
  isPlaying: boolean
  onTogglePlay: () => void
  onStepBack: () => void
  onStepForward: () => void
  onRestart: () => void
  stepIndex: number
  stepCount: number

  speedMs: number
  onSpeedChange: (ms: number) => void

  n: number
  onNChange: (n: number) => void

  dataKind: DataKind
  onDataKindChange: (kind: DataKind) => void
  onShuffle: () => void
}

export function PlayerControls({
  isPlaying,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onRestart,
  stepIndex,
  stepCount,
  speedMs,
  onSpeedChange,
  n,
  onNChange,
  dataKind,
  onDataKindChange,
  onShuffle,
}: Props) {
  const atStart = stepIndex <= 0
  const atEnd = stepIndex >= stepCount - 1

  return (
    <div className="mt-3 space-y-2">
      {/* 再生とコマ送り。進み具合も同じ行に入れて、縦を1行ぶん節約する */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Btn
          color={isPlaying ? "danger" : "brand"}
          onClick={onTogglePlay}
          className="px-4 py-2 w-32"
        >
          {isPlaying ? "⏸ 一時停止" : "▶ 再生"}
        </Btn>
        <Btn
          color="neutral"
          onClick={onStepBack}
          disabled={atStart}
          className="px-4 py-2"
          ariaLabel="1つ もどる"
        >
          ⏮ もどる
        </Btn>
        <Btn
          color="neutral"
          onClick={onStepForward}
          disabled={atEnd}
          className="px-4 py-2"
          ariaLabel="1つ すすむ"
        >
          ⏭ すすむ
        </Btn>
        <Btn color="danger" onClick={onRestart} className="px-4 py-2" ariaLabel="さいしょに もどす">
          ↺ さいしょへ
        </Btn>
        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
          {stepCount === 0 ? 0 : stepIndex + 1} / {stepCount} ステップ
        </span>
      </div>

      {/* スライダー類 */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <span className="shrink-0">はやさ</span>
          {/*
            値が大きいほど「1ステップに時間がかかる＝おそい」。
            つまみを右に動かすほど速くなってほしいので、表示と値を反転させる。
          */}
          <input
            type="range"
            min={SPEED_MIN}
            max={SPEED_MAX}
            step={10}
            value={SPEED_MIN + SPEED_MAX - speedMs}
            onChange={(e) => onSpeedChange(SPEED_MIN + SPEED_MAX - Number(e.target.value))}
            className="w-32 accent-brand-500"
            aria-label="再生のはやさ"
          />
          <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400 tabular-nums w-14">
            {speedMs}ms
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <span className="shrink-0">こすう n</span>
          <input
            type="range"
            min={N_MIN}
            max={N_MAX}
            step={1}
            value={n}
            onChange={(e) => onNChange(Number(e.target.value))}
            className="w-32 accent-brand-500"
            aria-label="配列の要素数"
          />
          <span className="shrink-0 font-bold text-brand-600 dark:text-brand-300 tabular-nums w-8">
            {n}
          </span>
        </label>
      </div>

      {/* データの並び方 */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-200 shrink-0">ならび</span>
        {(Object.keys(DATA_LABEL) as DataKind[]).map((kind) => (
          <BtnMode key={kind} value={kind} current={dataKind} onChange={onDataKindChange}>
            {DATA_LABEL[kind]}
          </BtnMode>
        ))}
        <Btn color="accent" onClick={onShuffle} className="px-4 py-2">
          🔀 シャッフル
        </Btn>
      </div>
    </div>
  )
}
