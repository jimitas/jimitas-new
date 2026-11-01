// ======================================================
// 「10回で出した標準偏差」のヒストグラム（SVG）— セクション3の中核
//
// 横軸 = 1セット（10回）で計算した標準偏差（0〜6 で固定。A・B 共通）
// 縦軸 = その範囲に入ったセットの割合（A・B を重ねても比べられるよう、回数ではなく割合）
//
// 重ねて描くもの
//   実線   … 理論値
//   点線   … 10回で出した標準偏差の平均（÷10 のため理論値より少し左に寄る）
//   帯     … 真ん中の80%（このくらいの値が出ることは珍しくない範囲）。1方式のときだけ
//   ▼      … 班の標準偏差（セクション4で入力したとき）
// 線どうしが近いので、図の中には文字を置かず、図の下の凡例で説明する。
// ======================================================

import type { Method } from "../_lib/dice"
import { THEORY } from "../_lib/stats"
import { SD_AXIS_MAX, SD_BIN_WIDTH, average, histogram, middleBand } from "../_lib/sets"
import { METHOD_FILL, METHOD_LABEL } from "./methodStyle"

const W = 480
const H = 250
const LEFT = 12
const RIGHT = 12
const TOP = 16
const BOTTOM = 32

export interface SdSeries {
  method: Method
  sds: Float64Array
}

interface Props {
  series: SdSeries[]
  /** 班の標準偏差（なければ null） */
  marker: number | null
  /** ▼ の横に添える文字（A・B を重ねたとき、どちらの方式の値かを図の中でも示すため） */
  markerLabel?: string
}

export function SdHistogram({ series, marker, markerLabel }: Props) {
  const plotW = W - LEFT - RIGHT
  const plotH = H - TOP - BOTTOM
  const baseY = TOP + plotH
  const xOf = (v: number) => LEFT + (Math.min(v, SD_AXIS_MAX) / SD_AXIS_MAX) * plotW
  const binW = (SD_BIN_WIDTH / SD_AXIS_MAX) * plotW
  const overlay = series.length > 1

  const shares = series.map((s) => histogram(s.sds).map((c) => (s.sds.length ? c / s.sds.length : 0)))
  const maxShare = Math.max(0.01, ...shares.flat())
  const band = series.length === 1 && series[0].sds.length > 0 ? middleBand(series[0].sds) : null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="10回ごとに計算した標準偏差のヒストグラム">
      {/* 真ん中80%の帯（棒より先に描いて後ろに置く） */}
      {band && (
        <rect
          x={xOf(band.lo)} y={TOP} width={Math.max(2, xOf(band.hi) - xOf(band.lo))} height={plotH}
          className="fill-gray-200 dark:fill-gray-700"
        />
      )}

      {/* 棒 */}
      {series.map((s, si) =>
        shares[si].map((p, k) => {
          const h = (p / maxShare) * plotH * 0.95
          if (h <= 0) return null
          return (
            <rect
              key={`${s.method}-${k}`}
              x={LEFT + k * binW + 1} y={baseY - h} width={binW - 2} height={h}
              className={METHOD_FILL[s.method]}
              fillOpacity={overlay ? 0.55 : 1}
            />
          )
        }),
      )}

      {/* 横軸 */}
      <line x1={LEFT} x2={W - RIGHT} y1={baseY} y2={baseY} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth={1.5} />
      {[0, 1, 2, 3, 4, 5, 6].map((v) => (
        <g key={v}>
          <line x1={xOf(v)} x2={xOf(v)} y1={baseY} y2={baseY + 5} className="stroke-gray-400 dark:stroke-gray-500" />
          <text x={xOf(v)} y={baseY + 22} textAnchor="middle" fontSize={15} fontWeight="bold" className="fill-gray-700 dark:fill-gray-200">{v}</text>
        </g>
      ))}

      {/* 平均（点線）と理論値（実線） */}
      {series.map((s) =>
        s.sds.length === 0 ? null : (
          <g key={`ln-${s.method}`}>
            <line
              x1={xOf(average(s.sds))} x2={xOf(average(s.sds))} y1={TOP} y2={baseY}
              strokeDasharray="2 4" strokeWidth={2.5} strokeLinecap="round"
              className="stroke-gray-600 dark:stroke-gray-300"
            />
            <line
              x1={xOf(THEORY[s.method].sd)} x2={xOf(THEORY[s.method].sd)} y1={TOP} y2={baseY}
              strokeWidth={3} className="stroke-gray-900 dark:stroke-gray-50"
            />
            {overlay && (
              <text x={xOf(THEORY[s.method].sd)} y={TOP - 3} textAnchor="middle" fontSize={12} fontWeight="bold" className="fill-gray-900 dark:fill-gray-50">
                {s.method}
              </text>
            )}
          </g>
        ),
      )}

      {/* 班のマーカー */}
      {marker !== null && (
        <g>
          <line x1={xOf(marker)} x2={xOf(marker)} y1={TOP + 14} y2={baseY} strokeWidth={2} className="stroke-gray-900 dark:stroke-gray-50" />
          <path
            d={`M${xOf(marker) - 9},${TOP} L${xOf(marker) + 9},${TOP} L${xOf(marker)},${TOP + 15} Z`}
            className="fill-gray-900 dark:fill-gray-50"
          />
          {markerLabel && (
            // 左端に近いときは右側に置く（図の外にはみ出さないように）
            <text
              x={xOf(marker) < 80 ? xOf(marker) + 12 : xOf(marker) - 12} y={TOP + 12}
              textAnchor={xOf(marker) < 80 ? "start" : "end"} fontSize={13} fontWeight="bold" className="fill-gray-900 dark:fill-gray-50">
              {markerLabel}
            </text>
          )}
        </g>
      )}
      {overlay && (
        <text x={W - RIGHT} y={TOP + 12} textAnchor="end" fontSize={12} className="fill-gray-600 dark:fill-gray-300">
          {series.map((s) => METHOD_LABEL[s.method]).join(" と ")}を重ねて表示
        </text>
      )}
      {series.every((s) => s.sds.length === 0) && (
        <text x={W / 2} y={TOP + plotH / 2} textAnchor="middle" fontSize={16} className="fill-gray-400 dark:fill-gray-500">
          セット数を選んでください
        </text>
      )}
    </svg>
  )
}

/** 凡例の線の見本（SVG の線と同じ見た目） */
export function LegendLine({ kind }: { kind: "theory" | "average" | "band" | "marker" }) {
  return (
    <svg viewBox="0 0 28 14" className="inline-block w-7 h-3.5 mr-1 align-middle shrink-0" aria-hidden="true">
      {kind === "theory" && <line x1={0} x2={28} y1={7} y2={7} strokeWidth={3} className="stroke-gray-900 dark:stroke-gray-50" />}
      {kind === "average" && (
        <line x1={2} x2={28} y1={7} y2={7} strokeWidth={2.5} strokeDasharray="2 4" strokeLinecap="round" className="stroke-gray-600 dark:stroke-gray-300" />
      )}
      {kind === "band" && <rect x={0} y={0} width={28} height={14} className="fill-gray-200 dark:fill-gray-700" />}
      {kind === "marker" && <path d="M7,0 L21,0 L14,13 Z" className="fill-gray-900 dark:fill-gray-50" />}
    </svg>
  )
}

