// ======================================================
// スライダー＋数字＋（−／＋）＋ワンタップボタン
//
// タブレットでキーボードを出さずに値を決められるようにする。
// スライダーだけだと 0.1 刻みの微調整がむずかしいので、−／＋ で1刻みずつ動かせる。
// 利率（0〜15%・0.1刻み）と年数（1〜50年・1刻み）で使う。
//
// ⚠ input[type=range] に appearance-none は付けない（トラックが消える）。色は accent-* だけで指定。
// ======================================================

import { Btn } from "@/components/parts/buttons/Btn"
import { BtnMode } from "@/components/parts/buttons/BtnMode"

interface Props {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  /** 値の後ろにつける単位（"%" / "年"） */
  unit: string
  /** ワンタップで選べる値 */
  presets: number[]
  onChange: (v: number) => void
  /** 数字の色（グラフの線の色とそろえる） */
  valueClass: string
}

/** step 刻みにそろえる（0.1 + 0.2 のような小数のずれを残さない） */
function snap(v: number, step: number, min: number, max: number): number {
  const s = Math.round(v / step) * step
  return Math.min(max, Math.max(min, Number(s.toFixed(4))))
}

export function SliderField({ id, label, value, min, max, step, unit, presets, onChange, valueClass }: Props) {
  const set = (v: number) => onChange(snap(v, step, min, max))
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Btn
          color="neutral" onClick={() => set(value - step)} disabled={value <= min}
          className="w-9 h-9 text-lg" ariaLabel={`${label}を${step}${unit}へらす`}
        >
          −
        </Btn>
        <input
          id={id} type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => set(Number(e.target.value))}
          className="flex-1 min-w-0 accent-brand-500"
        />
        <Btn
          color="neutral" onClick={() => set(value + step)} disabled={value >= max}
          className="w-9 h-9 text-lg" ariaLabel={`${label}を${step}${unit}ふやす`}
        >
          ＋
        </Btn>
        <span className={`shrink-0 w-20 text-right text-2xl font-bold tabular-nums ${valueClass}`}>
          {value}
          <span className="text-base ml-0.5">{unit}</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label={`${label}をえらぶ`}>
        {presets.map((v) => (
          <BtnMode key={v} value={v} current={value} onChange={set} className="py-1 shrink-0">
            {v}{unit}
          </BtnMode>
        ))}
      </div>
    </div>
  )
}
