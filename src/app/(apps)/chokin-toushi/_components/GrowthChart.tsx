// ======================================================
// 資産の推移グラフ（SVG）
//
// 投資＝オレンジの実線、貯蓄＝青の破線、元本＝灰色の点線。
// 色だけでなく線の種類でも区別できるようにしている（色覚の多様性への配慮）。
// 投資と貯蓄のあいだは薄く塗り、差が広がっていく様子を面積で見せる。
//
// 移植元は Chart.js だったが、依存を増やさないため SVG で描く
// （gacha-kakuritu の CumulativeCurve と同じ作法：viewBox 0 0 100 H ＋ preserveAspectRatio="none"）。
// 線の太さは vectorEffect="non-scaling-stroke" で、引きのばしても変わらない。
//
// 表示アニメ（drawMonth まで描く）:
//   縦軸は最後の金額に合わせて最初から固定する。前半は線が地面すれすれを進み、
//   後半で一気に上がるので、指数関数のカーブ（途中からぐっと上がる）が目で分かる。
//   縦軸を線にあわせて広げる方式だと、いつも画面いっぱいに描かれてこの驚きが消える。
//
// 縦横比は 3:2。横長（約 2.75:1）だとカーブがなだらかに見えたため（2026-10-10 オーナー要望）。
// タブレット以上では右側に「○年後の金額」を置く。
// ======================================================

"use client"

import type { KeyboardEvent, PointerEvent, ReactNode } from "react"
import { DISCLAIMER, TAX_NOTE, bandPoints, fmtElapsed, fmtManOku, fmtPct, fmtYen, toPoints, xTicks, yTicks } from "../_lib/compound"

/** viewBox の高さ（幅は 100）。縦横比 3:2 にあわせる */
const H = 66.667

interface Props {
  years: number
  /** 月ごとの残高（長さ 月数+1） */
  saving: number[]
  invest: number[]
  principal: number[]
  savingPct: number
  investPct: number
  /** 何か月目まで描くか（アニメ中は少しずつふえる。描き終えたら 月数） */
  drawMonth: number
  /** アニメ中は年を選べない（線の先頭の金額を出す） */
  playing: boolean
  /** 金額を表示している年（描き終えたあと） */
  selectedYear: number
  onSelectYear: (y: number) => void
  /** 右の欄の下に置くもの（「もう一度再生」ボタン） */
  actions?: ReactNode
}

export function GrowthChart(props: Props) {
  const { years, saving, invest, principal, savingPct, investPct, drawMonth, playing, selectedYear, onSelectYear } = props
  const months = years * 12
  const max = Math.max(saving[months], invest[months], principal[months])
  const yt = yTicks(max)
  const top = yt[yt.length - 1]
  // 金額を出す月：アニメ中は線の先頭、描き終えたら選んだ年
  const m = playing ? drawMonth : selectedYear * 12
  const upto = (a: number[]) => a.slice(0, drawMonth + 1)

  /** 指の位置 → いちばん近い年 */
  const pick = (e: PointerEvent<SVGSVGElement>) => {
    if (playing) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    onSelectYear(Math.round(ratio * years))
  }

  /** キーボードでも年を選べるように（← → で1年、Home / End で最初と最後） */
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (playing) return
    const next =
      e.key === "ArrowLeft" ? selectedYear - 1 :
      e.key === "ArrowRight" ? selectedYear + 1 :
      e.key === "Home" ? 0 :
      e.key === "End" ? years : null
    if (next === null) return
    e.preventDefault()
    onSelectYear(Math.min(years, Math.max(0, next)))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-x-5 gap-y-3">
      <div>
        {/* 凡例 */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 mb-2 text-sm text-gray-700 dark:text-gray-200">
          <span className="flex items-center gap-1.5">
            <svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" className="stroke-warm-500" strokeWidth={3} /></svg>
            投資（年{fmtPct(investPct)}%）
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" className="stroke-accent-500" strokeWidth={3} strokeDasharray="7 4" /></svg>
            貯蓄（年{fmtPct(savingPct)}%）
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" className="stroke-gray-500 dark:stroke-gray-400" strokeWidth={2} strokeDasharray="2 3" /></svg>
            元本
          </span>
        </div>

        <div className="grid grid-cols-[4.2em_1fr] gap-x-1.5">
          {/* 縦軸の目盛り（HTML で置くので、引きのばしても文字がつぶれない） */}
          <div className="relative col-start-1 row-start-1 text-right text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {yt.map((v) => (
              <span key={v} className="absolute right-0 translate-y-1/2 whitespace-nowrap" style={{ bottom: `${(v / top) * 100}%` }}>
                {fmtManOku(v)}
              </span>
            ))}
          </div>

          <svg
            className="col-start-2 row-start-1 w-full aspect-[3/2] rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 touch-pan-y cursor-crosshair focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            viewBox={`0 0 100 ${H}`}
            preserveAspectRatio="none"
            role="img"
            tabIndex={0}
            onKeyDown={onKey}
            aria-label={`資産の推移。左右の矢印キーで年を選べます。${years}年後に投資は${fmtYen(invest[months])}、貯蓄は${fmtYen(saving[months])}`}
            onPointerDown={pick}
            onPointerMove={(e) => {
              // マウスは押さなくても追従、指・ペンは押しているあいだだけ
              if (e.pointerType === "mouse" || e.buttons > 0) pick(e)
            }}
          >
            {yt.slice(1).map((v) => (
              <line
                key={v} x1="0" x2="100" y1={H - (v / top) * H} y2={H - (v / top) * H}
                className="stroke-gray-300 dark:stroke-gray-600" strokeWidth={1} vectorEffect="non-scaling-stroke"
              />
            ))}
            {/* 投資と貯蓄のあいだ（差）を薄く塗る */}
            <polygon
              points={bandPoints(upto(invest), upto(saving), top, H, months)}
              className="fill-warm-200 dark:fill-warm-900" fillOpacity={0.6}
            />
            <polyline
              points={toPoints(upto(principal), top, H, months)} fill="none" className="stroke-gray-500 dark:stroke-gray-400"
              strokeWidth={2} strokeDasharray="2 4" vectorEffect="non-scaling-stroke"
            />
            <polyline
              points={toPoints(upto(saving), top, H, months)} fill="none" className="stroke-accent-500"
              strokeWidth={3} strokeDasharray="8 5" vectorEffect="non-scaling-stroke"
            />
            <polyline
              points={toPoints(upto(invest), top, H, months)} fill="none" className="stroke-warm-500"
              strokeWidth={3} vectorEffect="non-scaling-stroke"
            />
            {/* 金額を表示している月（アニメ中は線の先頭） */}
            <line
              x1={(m / months) * 100} x2={(m / months) * 100} y1="0" y2={H}
              className="stroke-gray-700 dark:stroke-gray-200" strokeWidth={1.5} vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* 横軸の目盛り */}
          <div className="relative col-start-2 row-start-2 h-5 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {xTicks(years).map((y) => (
              <span
                key={y}
                className={`absolute top-0.5 whitespace-nowrap ${y === 0 ? "" : y === years ? "-translate-x-full" : "-translate-x-1/2"}`}
                style={{ left: `${(y / years) * 100}%` }}
              >
                {y}年
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 右の欄：○年後の金額・注意書き */}
      <div className="flex flex-col gap-3">
        <div className="rounded-lg bg-gray-100 dark:bg-gray-900 px-4 py-3 tabular-nums">
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{fmtElapsed(m)}</p>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 items-baseline">
            <dt className="text-sm text-warm-700 dark:text-warm-300">投資</dt>
            <dd className="text-right text-xl font-bold text-warm-700 dark:text-warm-300">{fmtYen(invest[m])}</dd>
            <dt className="text-sm text-accent-700 dark:text-accent-300">貯蓄</dt>
            <dd className="text-right text-xl font-bold text-accent-700 dark:text-accent-300">{fmtYen(saving[m])}</dd>
            <dt className="text-sm text-gray-600 dark:text-gray-300">元本</dt>
            <dd className="text-right text-base text-gray-700 dark:text-gray-200">{fmtYen(principal[m])}</dd>
          </dl>
          {!playing && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">グラフをタップすると、その年の金額が見られます。</p>
          )}
        </div>
        {props.actions}
        {/* 注意書き（グラフのすぐそばに1つだけ。文言は _lib で固定） */}
        <div className="rounded-lg border border-warm-300 dark:border-warm-700 bg-warm-50 dark:bg-warm-950 px-3 py-2 text-sm text-gray-800 dark:text-gray-100">
          <p>{DISCLAIMER}</p>
          <p className="mt-1">{TAX_NOTE}</p>
        </div>
      </div>
    </div>
  )
}
