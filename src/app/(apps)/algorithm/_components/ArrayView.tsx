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
  k: "書きもどす場所",
  min: "いまのところ いちばん小さい場所",
  left: "範囲の左はし（合体のときは 左がわの読み位置）",
  right: "範囲の右はし（合体のときは 右がわの読み位置）",
  mid: "範囲の まん中",
  pivot: "基準にえらんだ場所",
  key: "取り出して 手に持っている値",
}

/**
 * 値を全部出せる上限。これより多いと文字がつぶれる。
 *
 * ただし n がこれを超えても「いま動いている場所」の値だけは出す。
 * 全部消してしまうと、説明文の「A[23] (=71) と A[24] (=39) をくらべています」が
 * どのバーのことなのか分からなくなる。
 */
const LABEL_LIMIT = 20

/** そのステップで動いている場所（値を出す価値がある場所） */
function activeIndices(step: Step): Set<number> {
  const set = new Set<number>()
  step.compared?.forEach((i) => set.add(i))
  step.swapped?.forEach((i) => set.add(i))
  if (step.wrote !== undefined) set.add(step.wrote)
  if (step.gap !== undefined) set.add(step.gap)
  for (const v of Object.values(step.pointers)) if (v !== undefined) set.add(v)
  step.aux?.reading?.forEach((i) => set.add(i))
  return set
}

type Props = {
  step: Step
  /** 高さの基準になる値（配列の最大値） */
  maxValue: number
  /**
   * 矢印がコード例のどの変数にあたるか。
   * 「m」が saisho のことだと気づけないと、動きとコードがつながらない。
   */
  pointerVars: Partial<Record<PointerName, string>>
  /** 値を取り出して手に持つアルゴリズムか（挿入ソート） */
  usesHand?: boolean
  /** あとで並べかえる範囲を控えるアルゴリズムか（クイックソート） */
  usesPending?: boolean
}

function barClass(step: Step, index: number): string {
  // 見つかった場所は、範囲の灰色より優先して緑で見せる
  if ((step.kind === "found" || step.kind === "done") && step.pointers.i === index) {
    return "bg-brand-400"
  }
  // 範囲が決まっているアルゴリズム（二分探索など）では、範囲外を灰色にする
  if (step.range && (index < step.range.lo || index > step.range.hi)) {
    return "bg-gray-300 dark:bg-gray-600"
  }
  if (step.swapped?.includes(index)) return "bg-danger-400"
  if (step.compared?.includes(index)) return "bg-warm-400"
  if (step.wrote === index) return "bg-danger-400"
  if (step.sorted.includes(index)) return "bg-brand-400"
  return "bg-accent-400"
}

export function ArrayView({
  step,
  maxValue,
  pointerVars,
  usesHand = false,
  usesPending = false,
}: Props) {
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

  // 探索かどうか。target はそのアルゴリズムの全ステップに入っているので、
  // ステップごとに切りかわることはない
  const isSearch = step.target !== undefined

  // いま動いている場所。n が多くて値を全部出せないときは、ここだけ出す
  const activeAt = activeIndices(step)

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4">
      {/* さがす値。探索のときだけ、配列のすぐ上に大きく出す */}
      {isSearch && (
        <p className="mb-2 text-center text-sm text-gray-600 dark:text-gray-300">
          さがす値：
          <strong className="text-xl text-accent-600 dark:text-accent-300 tabular-nums">
            {step.target}
          </strong>
        </p>
      )}
      {/*
        取り出して手に持っている値（挿入ソートの tmp）。
        穴の真上に浮かせて描くので、穴が左へ動くとカードも一緒に動く。
        行そのものは usesHand のあいだ常に確保して、レイアウトが跳ねないようにする。
      */}
      {usesHand && (
        <div className="flex gap-[2px] h-9 items-end mb-1" aria-hidden="true">
          {step.array.map((_, index) => (
            <div key={index} className="flex-1 min-w-0 flex justify-center">
              {step.gap === index && step.held !== undefined && (
                <span className="px-1 rounded bg-warm-400 text-white text-[11px] font-bold tabular-nums leading-5">
                  {step.held}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/*
        バー本体。
        高さは「棒グラフとコード例を1画面で見くらべられること」を優先して決めている。
        1024×768 のタブレットで、両方が同時に入る範囲にとどめること。
      */}
      <div className="flex items-end gap-[2px] h-40 sm:h-48" aria-hidden="true">
        {step.array.map((value, index) =>
          // あいている場所は、取り出した値の高さの点線わくで描く。
          // ここに実際に入っている値は「まだ上書きされていない古い値」なので、
          // そのまま描くと同じ値が2つあるように見えてしまう。
          step.gap === index && step.held !== undefined ? (
            <div
              key={index}
              className="flex-1 min-w-0 rounded-t-sm border-2 border-dashed border-warm-400 bg-transparent"
              style={{ height: `${Math.max(4, (step.held / maxValue) * 100)}%` }}
            />
          ) : (
            <div
              key={index}
              className={`flex-1 min-w-0 rounded-t-sm ${barClass(step, index)}`}
              style={{ height: `${Math.max(4, (value / maxValue) * 100)}%` }}
            />
          ),
        )}
      </div>

      {/*
        値。n が多いときは全部は出せないので、いま動いている場所だけ出す。
        行そのものは常に確保して、レイアウトが跳ねないようにする。
      */}
      <div className="flex gap-[2px] mt-1 min-h-[1rem]" aria-hidden="true">
        {step.array.map((value, index) => {
          // あいている場所は空欄にする。
          // ここに残っているのは まだ上書きされていない古い値なので、
          // そのまま出すと同じ数字が2つ並んで見えてしまう。
          const isGap = step.gap === index && step.held !== undefined
          const active = activeAt.has(index)
          if (isGap || (!showLabels && !active)) {
            return <div key={index} className="flex-1 min-w-0" />
          }
          return (
            <div
              key={index}
              className={`flex-1 min-w-0 text-center text-[11px] tabular-nums ${
                active
                  ? "font-bold text-gray-900 dark:text-gray-50"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {value}
            </div>
          )
        })}
      </div>

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

      {/*
        あとで並べかえる範囲（クイックソート）。
        「いま見ている範囲を片づけたら、次はここに戻ってくる」を見せる。
        行は usesPending のあいだ確保して、レイアウトが跳ねないようにする。
      */}
      {usesPending && (
        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 min-h-[1.25rem]">
          {step.pendingRanges && step.pendingRanges.length > 0
            ? `あとで並べかえる範囲：${step.pendingRanges
                .map((r) => `${r.lo}〜${r.hi}`)
                .join("、")}`
            : "あとで並べかえる範囲：なし"}
        </p>
      )}

      {/*
        作業用の入れもの（マージソート）。
        添字を元の配列とそろえて真下に並べるので、
        「どこから写して どこへ書きもどすか」が縦に見える。
      */}
      {step.aux && (
        <div className="mt-2 pt-2 border-t border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            作業用の入れもの（コードの Sagyou）
          </p>
          <div className="flex gap-[2px] h-12 items-end" aria-hidden="true">
            {step.aux.values.map((v, index) => {
              if (v === null) return <div key={index} className="flex-1 min-w-0" />
              const reading = step.aux?.reading?.includes(index)
              return (
                <div
                  key={index}
                  className={`flex-1 min-w-0 rounded-t-sm ${
                    reading ? "bg-warm-400" : "bg-accent-300 dark:bg-accent-700"
                  }`}
                  style={{ height: `${Math.max(8, (v / maxValue) * 100)}%` }}
                />
              )
            })}
          </div>
          <div className="flex gap-[2px] mt-1 min-h-[1rem]" aria-hidden="true">
            {step.aux.values.map((v, index) => {
              const active = step.aux?.reading?.includes(index) ?? false
              if (v === null || (!showLabels && !active)) {
                return <div key={index} className="flex-1 min-w-0" />
              }
              return (
                <div
                  key={index}
                  className={`flex-1 min-w-0 text-center text-[11px] tabular-nums ${
                    active
                      ? "font-bold text-gray-900 dark:text-gray-50"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {v}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 読み上げ用。バーは装飾なので、内容はここで文章にして渡す */}
      <p className="sr-only" aria-live="polite">
        {step.message}。いまの ならびは {step.array.join("、")} です。
      </p>

      {/* 凡例 */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
        {/*
          凡例の並びはアルゴリズムごとに固定（探索かソートかでしか変わらない）。
          ステップごとに増えたり減ったりすると、そちらに目が行ってしまう。

          緑は「決まった」ではなく「ならんだ」。挿入ソートの緑は“もう並んでいる
          範囲”で、あとから中身がずれることがあるため。
        */}
        <Legend className="bg-accent-400" label="まだ" />
        <Legend className="bg-warm-400" label="くらべている" />
        {isSearch ? (
          <>
            <Legend className="bg-gray-300 dark:bg-gray-600" label="しらべる範囲の外" />
            <Legend className="bg-brand-400" label="見つかった" />
          </>
        ) : (
          <>
            <Legend className="bg-danger-400" label={usesHand ? "ずらした" : "入れかえた"} />
            <Legend className="bg-brand-400" label="ならんだ" />
          </>
        )}
        {usesHand && (
          <>
            {/*
              札の見本には本物の数字を出さない。
              いま持っている値とちがう数字が並ぶと、そちらを読んでしまう。
            */}
            <span className="flex items-center gap-1">
              <span className="px-1 rounded bg-warm-400 text-white text-[10px] font-mono font-bold leading-4">
                tmp
              </span>
              取り出して 手に持っている値
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm border-2 border-dashed border-warm-400" />
              あいた場所（ここに さしこむ）
            </span>
          </>
        )}
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
