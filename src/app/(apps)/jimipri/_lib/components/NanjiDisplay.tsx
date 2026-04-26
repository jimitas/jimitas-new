// なんじ系専用表示（Canvas時計）
// 共通の drawClock ユーティリティを使用
// 6問の時計を 3列×2行 で表示

"use client"

import { useEffect, useRef } from "react"
import { drawClock } from "@/lib/clockDrawing"
import type { NanjiResult } from "../types"
import { BANGOU } from "../constants"

export function NanjiDisplay({ data }: { data: NanjiResult }) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])

  // data.clocks が変わるたびに全時計を再描画
  useEffect(() => {
    data.clocks.forEach((clock, i) => {
      const canvas = canvasRefs.current[i]
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (ctx) drawClock(ctx, clock.hour, clock.minute)
    })
  }, [data.clocks])

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        {data.clocks.map((_, i) => (
          <div key={i} style={{ display: "flex", fontSize: "20px" }}>
            <div>{BANGOU[i]}</div>
            <div>
              <canvas
                ref={(el) => { canvasRefs.current[i] = el }}
                width={400}
                height={400}
                style={{ zoom: 0.65, marginTop: "-25px" }}
              />
              <div className="clock_answer_text">
                {data.problems[i]?.replace(/^[①②③④⑤⑥]\s*/, "")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
