// ======================================================
// 花吹雪（ステップ① クリアのお祝い）
//
// 親が ref の fire() を呼ぶたびに、画面の上から紙片が舞い落ちる（約3.5秒で消える）。
// 画面の下にあるクリア表示が見えなくても、クリアしたことがひと目でわかるようにするため。
// 乱数は fire()（クリックなどのイベント）の中だけで使う（描画中・effect 中に乱数や setState を書かない）。
// 「動きを減らす」設定のときは出さない。操作の邪魔にならないよう pointer-events:none。
// 紙片の色は円盤の色とは別（お祝いの色。円盤の色の意味と混ぜない）。
// ======================================================

"use client"

import { useEffect, useImperativeHandle, useRef, useState } from "react"
import type { Ref } from "react"

const COLORS = ["#FFD166", "#F78FB3", "#7BD3EA", "#FFFFFF", "#B8E986", "#FFB26B"]
const SHOW_MS = 3600

interface Piece {
  id: number
  left: number
  size: number
  color: string
  delay: number
  dur: number
  drift: number
  spin: number
  round: boolean
}

export interface ConfettiHandle {
  fire: () => void
}

export function Confetti({ ref }: { ref: Ref<ConfettiHandle> }) {
  const [pieces, setPieces] = useState<Piece[]>([])
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  useImperativeHandle(ref, () => ({
    fire() {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      setPieces(
        Array.from({ length: 70 }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          size: 7 + Math.random() * 8,
          color: COLORS[i % COLORS.length],
          delay: Math.random() * 0.7,
          dur: 2 + Math.random() * 1.4,
          drift: (Math.random() - 0.5) * 160,
          spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
          round: Math.random() < 0.3,
        })),
      )
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setPieces([]), SHOW_MS)
    },
  }))

  if (pieces.length === 0) return null
  return (
    <div aria-hidden className="fixed inset-0 z-50 overflow-hidden pointer-events-none" data-confetti>
      <style>{`@keyframes hanoiConfetti{0%{transform:translate3d(0,-6vh,0) rotate(0);opacity:1}85%{opacity:1}100%{transform:translate3d(var(--dx),108vh,0) rotate(var(--rot));opacity:0}}`}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={
            {
              position: "absolute",
              top: 0,
              left: `${p.left}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 0.5,
              background: p.color,
              borderRadius: p.round ? "50%" : 2,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
              animation: `hanoiConfetti ${p.dur}s ${p.delay}s ease-in forwards`,
              "--dx": `${p.drift}px`,
              "--rot": `${p.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
