// ======================================================
// 手順の帯（要件 F2-11）
//
// 2ⁿ−1 手を細いマスで1列に並べ、各マスを「動いた円盤の色」で塗る（①②①③①②①④…の模様）。
// 今の手のマスは枠（中立色）で強調する。マスをクリックすると、その手へ移れる。
// 1023 マスでも、viewBox を手数に合わせて横いっぱいに引きのばすだけなので、はみ出さない。
// ======================================================

"use client"

import { DISK_STROKE, diskColor } from "../_lib/colors"
import { STRIP_TITLE } from "../_lib/text"
import type { Move } from "../_lib/solve"

interface Props {
  moves: Move[]
  /** 終わった手数。k 手目のマス（添字 k−1）が「今の手」 */
  k: number
  onSeek: (k: number) => void
}

export function MoveStrip({ moves, k, onSeek }: Props) {
  const total = moves.length
  // マスの間の白い区切りは、マスが少ないときだけ（多いと帯が白くなる）
  const gap = total <= 127
  return (
    <section aria-label={STRIP_TITLE} className="space-y-1">
      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{STRIP_TITLE}</p>
      <svg
        viewBox={`0 0 ${total} 1`}
        preserveAspectRatio="none"
        className="w-full h-8 cursor-pointer rounded"
        data-strip
        data-cells={total}
        data-disks={moves.map((m) => m.disk).join(",")}
        onClick={(e) => {
          const box = e.currentTarget.getBoundingClientRect()
          const idx = Math.floor(((e.clientX - box.left) / box.width) * total)
          onSeek(Math.max(0, Math.min(total - 1, idx)) + 1)
        }}
      >
        {moves.map((m, i) => (
          <rect key={i} x={i} y={0} width={1} height={1} fill={diskColor(m.disk)} stroke={gap ? "#FFFFFF" : "none"} strokeWidth={gap ? 0.08 : 0} />
        ))}
        {k >= 1 && k <= total && (
          <rect
            data-current
            x={k - 1}
            y={0}
            width={1}
            height={1}
            fill="none"
            stroke={DISK_STROKE}
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </section>
  )
}
