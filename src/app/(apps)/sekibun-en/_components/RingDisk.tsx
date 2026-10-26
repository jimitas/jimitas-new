// ======================================================
// 輪の束（SVG）— ステップ③の本体（ステップ②でも使う予定）
//
// 円を n 本の輪に分けて描き、進み具合 t に合わせて輪をほどく（計算は _lib/unroll.ts）。
// viewBox を固定して、画面の幅に合わせて全体を縮小する（参考実装と同じ。座標は _lib/scene.ts）。
//
// ■ 描き方（参考実装と同じ）
//   輪は中心線の折れ線を太さ Δr で描く。端は butt（帯の端がまっすぐ切れて見える）、
//   角は round（はみ出しの見積もり unrollBounds が Δr/2 で足りる前提。miter だとわずかに超える）。
//   外側の輪から描き、内側の輪が上に重なるようにする。
//   色は濃い青・明るい青を交互に（要件 §3。jimitas の accent トークンに当てはめた）。
//   切れ目はオレンジの破線（warm）、完成形の三角形のガイドは緑の破線（brand）。
//
// ■ 大きく表示
//   ガイド・切れ目の線と文字だけ太く・大きくする。輪の太さは Δr そのもの（変えると面積の意味がくずれる）。
// ======================================================

"use client"

import { useMemo } from "react"
import { useScale } from "@/components/parts/graph/Display"
import {
  BASE_Y, CUT_FADE_END, R_PX, SCENE, VIEW_H, VIEW_W,
  cutOpacity, guideOpacity, isDone, labelLayout, triangleGuide,
} from "../_lib/scene"
import { BASE_LABEL, HEIGHT_LABEL } from "../_lib/text"
import { ringMidRadius, ringPoints, ringProgress, ringWidth } from "../_lib/unroll"
import type { UnrollMode } from "../_lib/unroll"

/** 交互に塗る2色（濃い青・明るい青） */
const RING_CLASS = ["stroke-accent-600 dark:stroke-accent-500", "stroke-accent-300 dark:stroke-accent-200"]

interface Props {
  /** 輪の数 */
  n: number
  /** 進み具合（0：円 〜 1：三角形） */
  t: number
  /** ほどき方（全部いっしょ／1本ずつ） */
  mode?: UnrollMode
  /** 読み上げ用の説明 */
  ariaLabel: string
}

export function RingDisk({ n, t, mode = "all", ariaLabel }: Props) {
  const { line, font } = useScale()
  const w = ringWidth(n, R_PX)

  // 輪の折れ線（外側から）。t・n・mode が変わったときだけ作り直す
  const rings = useMemo(() => {
    const out: { i: number; points: string }[] = []
    for (let i = n; i >= 1; i--) {
      const pts = ringPoints(ringMidRadius(i, n, R_PX), ringProgress(i, n, t, mode), SCENE)
      out.push({ i, points: pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") })
    }
    return out
  }, [n, t, mode])

  const guide = triangleGuide(SCENE)
  const guideAlpha = guideOpacity(t)
  const cutAlpha = cutOpacity(t)
  // ラベルの位置は scene.ts の labelLayout（「viewBox に収まる」テストと同じ式を使う）
  const label = labelLayout(font)

  return (
    <div className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={ariaLabel} className="block w-full h-auto select-none">
        {/* 完成形の三角形（ガイド）。ほどき始めてからフェードイン（F3-5） */}
        {guideAlpha > 0 && (
          <polygon
            points={guide.map(([x, y]) => `${x},${y}`).join(" ")}
            fill="none" className="stroke-brand-600 dark:stroke-brand-400"
            strokeWidth={1.5 * line} strokeDasharray={`${6 * line} ${5 * line}`} opacity={guideAlpha}
          />
        )}

        {/* 輪（外側から描くと内側が上に見える） */}
        {rings.map(({ i, points }) => (
          <polyline
            key={i} points={points} fill="none" className={RING_CLASS[i % 2]}
            strokeWidth={w} strokeLinecap="butt" strokeLinejoin="round"
          />
        ))}

        {/* 切れ目（真下の半径）。ほどき始めると消える */}
        {t < CUT_FADE_END && (
          <g opacity={cutAlpha}>
            <line
              x1={SCENE.x0} y1={SCENE.cy} x2={SCENE.x0} y2={BASE_Y}
              className="stroke-warm-600 dark:stroke-warm-400" strokeWidth={3 * line} strokeDasharray={`${5 * line} ${4 * line}`}
            />
            <circle cx={SCENE.x0} cy={SCENE.cy} r={3 * font} className="fill-gray-800 dark:fill-gray-100" />
          </g>
        )}

        {/* 完成時のラベル（F3-6）。線の上でも読めるよう、背景色のふちどりを付ける */}
        {isDone(t) && (
          <g
            fontSize={label.font} fontWeight="bold" paintOrder="stroke" strokeWidth={4} strokeLinejoin="round"
            className="fill-gray-800 stroke-white dark:fill-gray-100 dark:stroke-gray-900"
          >
            <text x={label.base.x} y={label.base.y} textAnchor="middle">{BASE_LABEL}</text>
            <text x={label.height.x} y={label.height.y} textAnchor="end">{HEIGHT_LABEL}</text>
          </g>
        )}
      </svg>
    </div>
  )
}
