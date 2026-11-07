// ======================================================
// ステップ②の操作パネル（/algorithm の PlayerControls をコピーして改変。2026-11-08 オーナー決定）
//
// 状態は持たない。すべて props で受けて親に返す。
// 再生・1手すすむ／もどる・最初へ／最後へ・速さ（段階）・進み具合スライダー。
// ======================================================

"use client"

import { Btn } from "@/components/parts/buttons/Btn"
import { SPEEDS } from "./useMovePlayer"

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="mx-1 px-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200">{children}</kbd>
}

interface Props {
  playing: boolean
  onTogglePlay: () => void
  onBack: () => void
  onForward: () => void
  onStart: () => void
  onEnd: () => void
  k: number
  total: number
  onSeek: (k: number) => void
  speedIndex: number
  onSpeedIndex: (i: number) => void
}

export function AutoControls({ playing, onTogglePlay, onBack, onForward, onStart, onEnd, k, total, onSeek, speedIndex, onSpeedIndex }: Props) {
  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Btn color={playing ? "danger" : "brand"} onClick={onTogglePlay} className="px-4 py-2 w-36 shrink-0">
          {playing ? "⏸ 一時停止" : "▶ 再生"}
        </Btn>
        <Btn color="neutral" onClick={onStart} disabled={k <= 0} className="px-4 py-2 shrink-0" ariaLabel="最初へ">
          ⏮ 最初へ
        </Btn>
        <Btn color="neutral" onClick={onBack} disabled={k <= 0} className="px-4 py-2 shrink-0" ariaLabel="1手もどる">
          ◀ 1手もどる
        </Btn>
        <Btn color="neutral" onClick={onForward} disabled={k >= total} className="px-4 py-2 shrink-0" ariaLabel="1手すすむ">
          1手すすむ ▶
        </Btn>
        <Btn color="neutral" onClick={onEnd} disabled={k >= total} className="px-4 py-2 shrink-0" ariaLabel="最後へ">
          最後へ ⏭
        </Btn>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <span className="shrink-0">進み具合</span>
          <input
            id="hanoi-progress"
            type="range"
            min={0}
            max={total}
            step={1}
            value={k}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-48 sm:w-72 accent-gray-600"
            aria-label="進み具合（何手目か）"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <span className="shrink-0">はやさ</span>
          {/* 左がおそく、右が速い。段の並びは SPEEDS（秒/手）の順 */}
          <input
            id="hanoi-speed"
            type="range"
            min={0}
            max={SPEEDS.length - 1}
            step={1}
            value={speedIndex}
            onChange={(e) => onSpeedIndex(Number(e.target.value))}
            className="w-32 accent-gray-600"
            aria-label="再生のはやさ"
          />
          <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400 tabular-nums w-20">1手 {SPEEDS[speedIndex]}秒</span>
        </label>
      </div>

      <p className="hidden sm:block text-center text-[11px] text-gray-500 dark:text-gray-400">
        キーボード：<Kbd>Space</Kbd> 再生／一時停止　<Kbd>←</Kbd> <Kbd>→</Kbd> 1手もどる／すすむ
      </p>
    </div>
  )
}
