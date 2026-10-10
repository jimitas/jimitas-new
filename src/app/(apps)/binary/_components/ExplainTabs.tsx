// ======================================================
// 変換のしかた — 入力した進数から、ほかの3つの進数への変換方法をタブで切り替える
//
// どの図解を出すかは _lib/explain.ts の explainKind() が決める。
// タブは ARIA の tablist（gacha-kakuritu の ResultTabs と同じ作り）。
// 左右の矢印キー・Home/End でも切り替えられる。
// ======================================================

"use client"

import { useRef, useState } from "react"
import * as se from "@/lib/se"
import { type Base, toBase, BASE_LABELS, BASES } from "../_lib/converter"
import { explainKind, bitsPerDigit, canExplain, EXPLAIN_MAX } from "../_lib/explain"
import { DivisionLadder } from "./DivisionLadder"
import { PlaceValue } from "./PlaceValue"
import { GroupFromBinary, ExpandToBinary } from "./BitGrouping"

interface Props {
  decimal: number
  inputBase: Base
}

export function ExplainTabs({ decimal, inputBase }: Props) {
  const targets = BASES.filter(b => b !== inputBase)
  const [picked, setPicked] = useState<Base>(targets[0])
  // 入力進数を切り替えて、選んでいたタブが入力進数と同じになったら先頭タブを出す
  const active = picked === inputBase ? targets[0] : picked
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const select = (i: number, focus = false) => {
    if (targets[i] !== active) se.playSe(se.set)
    setPicked(targets[i])
    if (focus) tabRefs.current[i]?.focus()
  }

  return (
    <section className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4">
      <h2 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
        変換のしかた（{BASE_LABELS[inputBase]}から）
      </h2>

      {!canExplain(decimal) ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          変換のしかたは、{EXPLAIN_MAX}（2進数で8けた）までの数で表示します。
        </p>
      ) : (
        <>
          <div role="tablist" aria-label="変換先の進数" className="flex gap-1 border-b-2 border-gray-200 dark:border-gray-700 mb-3">
            {targets.map((b, i) => {
              const on = b === active
              return (
                <button
                  key={b}
                  ref={(el) => { tabRefs.current[i] = el }}
                  id={`bn-tab-${b}`}
                  role="tab"
                  aria-selected={on}
                  aria-controls={`bn-panel-${b}`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => select(i)}
                  onKeyDown={(e) => {
                    const last = targets.length - 1
                    const next =
                      e.key === "ArrowRight" ? (i + 1) % targets.length
                      : e.key === "ArrowLeft" ? (i + last) % targets.length
                      : e.key === "Home" ? 0
                      : e.key === "End" ? last
                      : null
                    if (next === null) return
                    e.preventDefault()
                    select(next, true)
                  }}
                  className={`shrink-0 -mb-0.5 px-3 sm:px-4 py-2 font-bold border-b-[3px] ${
                    on
                      ? "border-accent-500 text-accent-700 dark:text-accent-300"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {/* 「→」は読み上げで「右矢印」と読まれないように隠す */}
                  <span aria-hidden>→ </span>{BASE_LABELS[b]}
                </button>
              )
            })}
          </div>

          {/* 見えていないパネルも DOM に残す（aria-controls の参照先が消えないように） */}
          {targets.map(b => (
            <div
              key={b}
              id={`bn-panel-${b}`}
              role="tabpanel"
              aria-labelledby={`bn-tab-${b}`}
              hidden={b !== active}
              // パネル内にフォーカスできる要素がないので、パネル自体に Tab で入れるようにする
              tabIndex={0}
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              <Explain decimal={decimal} from={inputBase} to={b} />
            </div>
          ))}
        </>
      )}
    </section>
  )
}

/** 変換元・変換先に応じた図解を1つ出す */
function Explain({ decimal, from, to }: { decimal: number; from: Base; to: Base }) {
  const str = toBase(decimal, from)
  switch (explainKind(from, to)) {
    case "division":
      return <DivisionLadder decimal={decimal} to={to} />
    case "placeValue":
      return <PlaceValue str={str} from={from} />
    case "group":
      return <GroupFromBinary binary={str} to={to as 8 | 16} />
    case "expand":
      return <ExpandToBinary str={str} from={from as 8 | 16} />
    case "via2": {
      const binary = toBase(decimal, 2)
      return (
        <div className="space-y-4">
          <p>
            {from}進数と{to}進数は、<b>2進数を通ると</b>かんたんに変換できる
            （{from}進数の1けた＝{bitsPerDigit(from as 8 | 16)}ビット、{to}進数の1けた＝{bitsPerDigit(to as 8 | 16)}ビット）。
          </p>
          <div>
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-1">① {from}進数 → 2進数</h3>
            <ExpandToBinary str={str} from={from as 8 | 16} />
          </div>
          <div>
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-1">
              ② 2進数 <span className="font-mono">{binary}</span> → {to}進数
            </h3>
            <GroupFromBinary binary={binary} to={to as 8 | 16} />
          </div>
        </div>
      )
    }
  }
}
