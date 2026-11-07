// ======================================================
// 3つの区切りのバー（要件 F2-5・F2-6。このアプリの核）
//
// 手順全体を横長のバーで表し、「上の n−1 枚」「いちばん下の1枚」「上の n−1 枚」の3つに分ける。
// 色の意味は「円盤の色＝その円盤が動く」だけなので：
//   前半＝濃いグレーの斜線　後半＝薄いグレー　中央の1手＝そのとき動く円盤の色
// 前半・後半をクリックすると、その中がさらに3つに分かれる（入れ子。何段でも）。
// ======================================================

"use client"

import { useState } from "react"
import { useText } from "@/components/parts/graph/Display"
import { ZONE_FIRST, ZONE_LAST, diskColor, labelColor } from "../_lib/colors"
import { diskMark } from "../_lib/play"
import { splitSegments } from "../_lib/solve"
import type { Peg, Zone } from "../_lib/solve"
import { SEG_HINT, segmentSum } from "../_lib/text"
import type { Level } from "../_lib/text"

const FIRST_BG = `repeating-linear-gradient(45deg, ${ZONE_FIRST} 0 4px, #374151 4px 8px)`

interface RowProps {
  n: number
  offset: number
  from: Peg
  to: Peg
  via: Peg
  k: number
  path: string
  open: Set<string>
  onToggle: (path: string) => void
}

/** 3つの区切りの1段（前半・後半は、開いていればその下にもう1段） */
function SegRow({ n, offset, from, to, via, k, path, open, onToggle }: RowProps) {
  const segs = splitSegments(n, offset)
  const cells: { zone: Zone; nn: number; f: Peg; t: Peg; start: number; end: number; disk?: number }[] = [
    { zone: "first", nn: n - 1, f: from, t: via, start: segs[0].start, end: segs[0].end },
    { zone: "middle", nn: 1, f: from, t: to, start: segs[1].start, end: segs[1].end, disk: n },
    { zone: "last", nn: n - 1, f: via, t: to, start: segs[2].start, end: segs[2].end },
  ]
  return (
    <div className="flex w-full gap-0.5">
      {cells.map((c) => {
        const count = c.end - c.start + 1
        const key = `${path}${c.zone}`
        const expandable = c.zone !== "middle" && c.nn >= 2
        const isOpen = expandable && open.has(key)
        const active = k >= c.start && k <= c.end
        const fill = c.zone === "middle" ? diskColor(c.disk ?? 1) : c.zone === "first" ? FIRST_BG : ZONE_LAST
        const textColor = c.zone === "middle" ? labelColor(diskColor(c.disk ?? 1)) : c.zone === "first" ? "#FFFFFF" : "#111111"
        const label =
          c.zone === "middle"
            ? `${diskMark(c.disk ?? 1)} ${c.f}→${c.t}（1手）`
            : `上${c.nn}枚 ${c.f}→${c.t}（${count}手）`
        return (
          <div key={c.zone} style={{ flexGrow: count, flexBasis: 0, minWidth: c.zone === "middle" ? 22 : 0 }} className="min-w-0">
            <button
              type="button"
              data-seg={key}
              data-zone={c.zone}
              data-active={active ? 1 : 0}
              disabled={!expandable}
              aria-expanded={expandable ? isOpen : undefined}
              title={label + (expandable ? "（クリックで中を見る）" : "")}
              onClick={() => expandable && onToggle(key)}
              className={`block w-full h-9 rounded px-1 text-xs font-bold overflow-hidden whitespace-nowrap text-ellipsis text-center leading-9 ${
                expandable ? "cursor-pointer" : "cursor-default"
              } ${active ? "outline outline-[3px] outline-offset-1 outline-gray-900 dark:outline-white" : ""}`}
              style={{ background: fill, color: textColor }}
            >
              {label}
            </button>
            {isOpen && (
              <div className="mt-0.5">
                <SegRow n={c.nn} offset={c.start - 1} from={c.f} to={c.t} via={c.zone === "first" ? to : from} k={k} path={`${key}.`} open={open} onToggle={onToggle} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface Props {
  n: number
  k: number
  to: Peg
  level: Level
}

export function SegmentBar({ n, k, to, level }: Props) {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const readout = useText("readout")
  const via: Peg = to === "C" ? "B" : "C"
  const total = 2 ** n - 1
  const toggle = (p: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(p)) {
        // 閉じるときは、その中も閉じる
        for (const q of prev) if (q === p || q.startsWith(`${p}.`)) next.delete(q)
      } else next.add(p)
      return next
    })

  if (n < 2) {
    return <p className="text-center text-gray-700 dark:text-gray-200">1枚のときは 1手だけ。2枚から、3つに分かれるよ。</p>
  }
  return (
    <section aria-label="3つの区切り" className="space-y-2">
      <div className="relative pt-4">
        {/* いまの位置のマーカー */}
        <div
          data-marker
          aria-hidden
          className="absolute top-0 text-gray-900 dark:text-white text-sm leading-none -translate-x-1/2 pointer-events-none"
          style={{ left: `${(k / total) * 100}%` }}
        >
          ▼
        </div>
        <SegRow n={n} offset={0} from="A" to={to} via={via} k={k} path="" open={open} onToggle={toggle} />
      </div>
      <p className={`text-center font-bold tabular-nums text-gray-800 dark:text-gray-100 ${readout}`} data-segment-sum>
        {segmentSum(n, level)}
      </p>
      <p className="text-center text-xs text-gray-600 dark:text-gray-300">{SEG_HINT}</p>
    </section>
  )
}
