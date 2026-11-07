// ======================================================
// 2進法カウンター（要件 F2-8）
// k を n けたの2進法で表示し、k−1→k で 0→1 に変わったけた（右から j けた目）を強調する。
// 右から j けた目が変わったとき、円盤 ⓙ が動く。最後は 111…1（1 が n 個）。
// ※ diskByBinary(0) は無限ループするので、k = 0 では呼ばない（docs/plan-hanoi.md のレビュー指摘1）
// ======================================================

"use client"

import { useText } from "@/components/parts/graph/Display"
import { BINARY_TITLE, binaryNote } from "../_lib/text"
import { binaryDigits, diskByBinary } from "../_lib/solve"

interface Props {
  n: number
  k: number
}

export function BinaryCounter({ n, k }: Props) {
  const readout = useText("readout")
  const digits = binaryDigits(k, n)
  const j = k >= 1 ? diskByBinary(k) : null
  return (
    <section aria-label={BINARY_TITLE} className="space-y-1">
      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{BINARY_TITLE}</p>
      <p className={`font-mono font-bold tracking-widest text-gray-900 dark:text-gray-50 ${readout}`} data-binary={digits} aria-label={`${k}手目の2進法 ${digits}`}>
        {digits.split("").map((ch, i) => {
          const fromRight = n - i
          const changed = j === fromRight
          return (
            <span
              key={i}
              data-changed={changed ? 1 : 0}
              className={changed ? "rounded bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-0.5" : ""}
            >
              {ch}
            </span>
          )
        })}
        <span className="ml-1 text-sm font-normal">₍₂₎</span>
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-200">{binaryNote(k, j)}</p>
    </section>
  )
}
