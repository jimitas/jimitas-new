// ======================================================
// 配列の見た目（バー・値・矢印）
//
// 状態は持たない。Step を受け取って描くだけ。
//
// CSS transition はわざと付けていない。
// コマ送りや高速再生と相性が悪く、「今どうなっているか」が
// 不正確に見えるのは教材として致命的なため。
// ======================================================

"use client"

import type { PointerName, Step } from "../_lib/types"

/** 矢印の短い表示名。n=50 のとき1列は十数pxしかないので1文字にする */
const POINTER_LABEL: Record<PointerName, string> = {
  i: "i",
  j: "j",
  k: "k",
  min: "m",
  left: "L",
  right: "R",
  mid: "M",
  pivot: "P",
  key: "K",
}

/** 凡例に出す説明。使われている矢印だけ表示する */
const POINTER_HELP: Record<PointerName, string> = {
  i: "いま決める場所",
  j: "しらべている場所",
  k: "書きこむ場所",
  min: "いまのところ いちばん小さい場所",
  left: "探す範囲の左はし",
  right: "探す範囲の右はし",
  mid: "範囲の まん中",
  pivot: "基準の値",
  key: "取り出しておいた値",
}

/** 値のラベルを出す上限。これより多いと文字がつぶれる */
const LABEL_LIMIT = 20

type Props = {
  step: Step
  /** 高さの基準になる値（配列の最大値） */
  maxValue: number
  /**
   * 矢印がコード例のどの変数にあたるか。
   * 「m」が saisho のことだと気づけないと、動きとコードがつながらない。
   */
  pointerVars: Partial<Record<PointerName, string>>
}

function barClass(step: Step, index: number): string {
  // 範囲が指定されているアルゴリズム（二分探索など）では、範囲外を灰色にする
  if (step.range && (index < step.range.lo || index > step.range.hi)) {
    return "bg-gray-300 dark:bg-gray-600"
  }
  if (step.swapped?.includes(index)) return "bg-danger-400"
  if (step.compared?.includes(index)) return "bg-warm-400"
  if (step.wrote === index) return "bg-danger-400"
  if (step.sorted.includes(index)) return "bg-brand-400"
  return "bg-accent-400"
}

export function ArrayView({ step, maxValue, pointerVars }: Props) {
  const n = step.array.length
  const showLabels = n <= LABEL_LIMIT

  // どの位置にどの矢印が来ているか
  const pointersAt = new Map<number, PointerName[]>()
  for (const [name, index] of Object.entries(step.pointers) as [PointerName, number][]) {
    if (index === undefined) continue
    const list = pointersAt.get(index) ?? []
    list.push(name)
    pointersAt.set(index, list)
  }
  // 凡例に出す矢印は「そのアルゴリズムが使う矢印」で固定する。
  // いま出ている矢印だけを並べると、ステップごとに凡例が増えたり減ったりして
  // そちらに目が行ってしまい、かえって分かりにくい。
  const legendPointers = Object.keys(pointerVars) as PointerName[]

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4">
      {/*
        バー本体。
        高さは「棒グラフとコード例を1画面で見くらべられること」を優先して決めている。
        1024×768 のタブレットで、両方が同時に入る範囲にとどめること。
      */}
      <div className="flex items-end gap-[2px] h-40 sm:h-48" aria-hidden="true">
        {step.array.map((value, index) => (
          <div
            key={index}
            className={`flex-1 min-w-0 rounded-t-sm ${barClass(step, index)}`}
            style={{ height: `${Math.max(4, (value / maxValue) * 100)}%` }}
          />
        ))}
      </div>

      {/* 値 */}
      {showLabels && (
        <div className="flex gap-[2px] mt-1" aria-hidden="true">
          {step.array.map((value, index) => (
            <div
              key={index}
              className="flex-1 min-w-0 text-center text-[11px] text-gray-600 dark:text-gray-300 tabular-nums"
            >
              {value}
            </div>
          ))}
        </div>
      )}

      {/* 矢印 */}
      <div className="flex gap-[2px] mt-1 min-h-[2.25rem]" aria-hidden="true">
        {step.array.map((_, index) => {
          const names = pointersAt.get(index)
          return (
            <div key={index} className="flex-1 min-w-0 flex flex-col items-center">
              {names && (
                <>
                  <span className="text-[10px] leading-none text-gray-500 dark:text-gray-400">▲</span>
                  <span className="text-[11px] leading-tight font-bold text-gray-700 dark:text-gray-200">
                    {names.map((name) => POINTER_LABEL[name]).join("")}
                  </span>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* 読み上げ用。バーは装飾なので、内容はここで文章にして渡す */}
      <p className="sr-only" aria-live="polite">
        {step.message}。いまの ならびは {step.array.join("、")} です。
      </p>

      {/* 凡例 */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
        <Legend className="bg-accent-400" label="まだ" />
        <Legend className="bg-warm-400" label="くらべている" />
        <Legend className="bg-danger-400" label="入れかえた" />
        {/*
          「決まった」ではなく「ならんだ」。
          挿入ソートの緑は“もう並んでいる範囲”で、あとから中身がずれることがある。
          選択ソートのように確定している場合も含めて正しく言えるのはこちら。
        */}
        <Legend className="bg-brand-400" label="ならんだ" />
        {legendPointers.map((name) => (
          <span key={name}>
            <strong className="text-gray-700 dark:text-gray-200">{POINTER_LABEL[name]}</strong>
            {" … "}
            {POINTER_HELP[name]}
            {/* コード例での変数名。動きとコードを結びつけるための手がかり */}
            {pointerVars[name] && (
              <code className="ml-1 font-mono text-gray-600 dark:text-gray-300">
                （コードの {pointerVars[name]}）
              </code>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block w-3 h-3 rounded-sm ${className}`} />
      {label}
    </span>
  )
}
