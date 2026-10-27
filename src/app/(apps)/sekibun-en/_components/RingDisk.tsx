// ======================================================
// 輪の束（SVG）— ステップ③の本体。ステップ②では1本だけをほどく（focus）
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
//
// ■ ステップ②（focus を渡したとき）
//   選んだ輪だけが t でほどけ、ほかの輪は円のまま薄く描く。選んだ輪はいつも濃い青で、いちばん上に重ねる。
//   onPickRing を渡すと、タップ（クリック）した位置の輪の番号を返す（_lib/unroll.ts の ringAtPoint）。
//   指を置いた瞬間（pointerdown）ではなく click で決める。図の上からスクロールしようと指を置いただけで
//   輪が選び直され、切り開いた帯が消えるのを防ぐ（click はスクロールや右クリックでは起きない。2026-10-26 レビュー指摘）。
// ======================================================

"use client"

import { useMemo } from "react"
import type { MouseEvent, ReactNode } from "react"
import { useScale } from "@/components/parts/graph/Display"
import {
  BASE_Y, CUT_FADE_END, R_PX, SCENE, VIEW_H, VIEW_W,
  cutOpacity, guideOpacity, isDone, labelLayout, ropeOffset, ropeTwist, triangleGuide,
} from "../_lib/scene"
import { BASE_LABEL, HEIGHT_LABEL } from "../_lib/text"
import {
  lastRingProgress, ringAtPoint, ringMidRadius, ringPoints, ringShapeProgress, ringWidth,
} from "../_lib/unroll"
import type { UnrollMode } from "../_lib/unroll"

/** 交互に塗る2色（濃い青・明るい青） */
const RING_CLASS = ["stroke-accent-600 dark:stroke-accent-500", "stroke-accent-300 dark:stroke-accent-200"]

/** ロープ表示（F3-10）の縄の色（2色を交互に）と、ねじれの縞の色 */
// 隣りあう輪の区切りが見えるよう、2色の明るさの差を広げた（warm-200 は白地で淡すぎた。2026-10-27 レビュー指摘）
const ROPE_CLASS = ["stroke-warm-500 dark:stroke-warm-500", "stroke-warm-300 dark:stroke-warm-200"]
const ROPE_TWIST_CLASS = "stroke-warm-700 dark:stroke-warm-800"

interface Props {
  /** 輪の数 */
  n: number
  /** 進み具合（0：円 〜 1：三角形） */
  t: number
  /** ほどき方（全部いっしょ／1本ずつ） */
  mode?: UnrollMode
  /** 読み上げ用の説明 */
  ariaLabel: string
  /** この輪（1..n）だけをほどき、ほかは円のまま薄く描く（ステップ②） */
  focus?: number
  /** 完成形の三角形のガイドと、完成時のラベルを出すか（③ は出す、② は出さない） */
  guide?: boolean
  /** タップ（クリック）した輪の番号を受け取る。円の外なら呼ばない */
  onPickRing?: (i: number) => void
  /** 図の上に重ねるもの（viewBox の座標で描く） */
  children?: ReactNode
  /** ロープの質感で描く（F3-10） */
  rope?: boolean
}

/** ほかの輪を薄くするときの濃さ（② で選んだ輪を目立たせる） */
const DIM = 0.25

export function RingDisk({ n, t, mode = "all", ariaLabel, focus, guide: showGuide = true, onPickRing, children, rope = false }: Props) {
  const { line, font } = useScale()
  const w = ringWidth(n, R_PX)
  const twist = ropeTwist(w)

  // 輪の折れ線（外側から）。t・n・mode・focus が変わったときだけ作り直す
  // focus があれば、その輪だけ t でほどき、いちばん最後（上）に描く
  const rings = useMemo(() => {
    const out: { i: number; points: string }[] = []
    const order = [...Array(n)].map((_, k) => n - k).filter((i) => i !== focus)
    if (focus !== undefined) order.push(focus)
    for (const i of order) {
      // 1本ずつほどくときは、輪ごとにもなめらかに動き出して止まる（F3-8。はみ出し検査と同じ ringShapeProgress）
      const p = focus === undefined ? ringShapeProgress(i, n, t, mode) : i === focus ? t : 0
      const pts = ringPoints(ringMidRadius(i, n, R_PX), p, SCENE)
      out.push({ i, points: pts.map((q) => `${q.x.toFixed(2)},${q.y.toFixed(2)}`).join(" ") })
    }
    return out
  }, [n, t, mode, focus])

  /** タップした位置（画面の座標 → viewBox の座標）の輪 */
  const onClick = (e: MouseEvent<SVGSVGElement>) => {
    if (!onPickRing) return
    const svg = e.currentTarget
    const m = svg.getScreenCTM()
    if (!m) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    const i = ringAtPoint(p.x, p.y, n, SCENE)
    if (i !== null) onPickRing(i)
  }

  const guide = triangleGuide(SCENE)
  const guideAlpha = guideOpacity(t)
  // 切れ目も完成のラベルも、最後にほどける輪で決める（1本ずつのとき、まだ切れ目の入っていない輪が
  // 残っているうちに切れ目を消さない・最後の輪がまだ円なのに完成のラベルを出さない）
  const lastT = focus === undefined ? lastRingProgress(n, t, mode) : t
  const cutAlpha = cutOpacity(lastT)
  const done = isDone(lastT)
  // ラベルの位置は scene.ts の labelLayout（「viewBox に収まる」テストと同じ式を使う）
  const label = labelLayout(font)

  return (
    <div className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={ariaLabel}
        className={`block w-full h-auto select-none ${onPickRing ? "cursor-pointer" : ""}`}
        onClick={onClick}
      >
        {/* 完成形の三角形（ガイド）。ほどき始めてからフェードイン（F3-5） */}
        {showGuide && guideAlpha > 0 && (
          <polygon
            points={guide.map(([x, y]) => `${x},${y}`).join(" ")}
            fill="none" className="stroke-brand-600 dark:stroke-brand-400"
            strokeWidth={1.5 * line} strokeDasharray={`${6 * line} ${5 * line}`} opacity={guideAlpha}
          />
        )}

        {/* 輪（外側から描くと内側が上に見える） */}
        {/* ロープ表示（F3-10）では、縄の色の線の上に濃い縞を破線で重ねて「ねじれ」に見せる */}
        {rings.map(({ i, points }) => (
          <g key={i} opacity={focus === undefined || i === focus ? 1 : DIM}>
            <polyline
              points={points} fill="none"
              className={rope ? ROPE_CLASS[i % 2] : i === focus ? RING_CLASS[0] : RING_CLASS[i % 2]}
              strokeWidth={w} strokeLinecap="butt" strokeLinejoin="round"
            />
            {rope && (
              <polyline
                points={points} fill="none" className={`rope-twist ${ROPE_TWIST_CLASS}`}
                strokeWidth={w} strokeLinecap="butt" strokeLinejoin="round"
                strokeDasharray={`${twist.dash} ${twist.gap}`} strokeDashoffset={ropeOffset(i, w)} opacity={0.55}
              />
            )}
          </g>
        ))}

        {/* 切れ目（真下の半径）。ほどき始めると消える */}
        {lastT < CUT_FADE_END && (
          <g opacity={cutAlpha}>
            <line
              x1={SCENE.x0} y1={SCENE.cy} x2={SCENE.x0} y2={BASE_Y}
              className="stroke-warm-600 dark:stroke-warm-400" strokeWidth={3 * line} strokeDasharray={`${5 * line} ${4 * line}`}
            />
            <circle cx={SCENE.x0} cy={SCENE.cy} r={3 * font} className="fill-gray-800 dark:fill-gray-100" />
          </g>
        )}

        {/* 完成時のラベル（F3-6）。線の上でも読めるよう、背景色のふちどりを付ける */}
        {showGuide && done && (
          <g
            fontSize={label.font} fontWeight="bold" paintOrder="stroke" strokeWidth={4} strokeLinejoin="round"
            className="fill-gray-800 stroke-white dark:fill-gray-100 dark:stroke-gray-900"
          >
            <text x={label.base.x} y={label.base.y} textAnchor="middle">{BASE_LABEL}</text>
            <text x={label.height.x} y={label.height.y} textAnchor="end">{HEIGHT_LABEL}</text>
          </g>
        )}
        {children}
      </svg>
    </div>
  )
}
