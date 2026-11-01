// ======================================================
// セクション4：自分の班のデータを入れてみる（F-7）
//
// 授業で記録した10個の得点を入れると、ドットプロット・平均・偏差・分散・標準偏差を出す。
// 偏差の一覧と「偏差の合計（必ず 0）」を出して、手計算の検算に使えるようにする。
// 標準偏差はセクション3のヒストグラムに ▼ で立つ（状態は page が持つ）。
//
// 1つめの欄に「7,5,9,…」のように区切って貼り付けると、10個の欄に配る。
// ======================================================

"use client"

import { useState } from "react"
import * as se from "@/lib/se"
import { Btn } from "@/components/parts/buttons/Btn"
import type { Method } from "../_lib/dice"
import { GROUP_SIZE, distribute, readGroup, splitPasted } from "../_lib/input"
import { countScores, deviations, mean, sd, variance } from "../_lib/stats"
import { fmt2, fmtDev } from "../_lib/format"
import { DotPlot } from "./DotPlot"
import { MethodTabs } from "./MethodTabs"
import { Section } from "./Section"
import { METHOD_LABEL, METHOD_TEXT } from "./methodStyle"

const METHODS = ["A", "B"] as const

/** 「例を入れる」で入る得点 */
const EXAMPLE: Record<Method, string[]> = {
  A: ["7", "5", "9", "6", "8", "7", "4", "10", "7", "6"],
  B: ["8", "2", "12", "6", "10", "4", "8", "12", "2", "6"],
}

export const EMPTY_CELLS: string[] = Array(GROUP_SIZE).fill("")

interface Props {
  method: Method
  onMethod: (m: Method) => void
  cells: string[]
  onCells: (c: string[]) => void
  /** セクション3へ飛んで、この方式のヒストグラムを出す */
  onShowInSets: () => void
}

export function GroupSection({ method, onMethod, cells, onCells, onShowInSets }: Props) {
  const { values, errors, filled } = readGroup(cells, method)
  // 貼り付けで入りきらなかった値の知らせ。次に何か入力したら消す
  const [notice, setNotice] = useState("")

  const change = (i: number, v: string) => {
    const parts = splitPasted(v)
    if (!parts) {
      const next = cells.slice()
      next[i] = v
      onCells(next)
      setNotice("")
      return
    }
    // 貼り付け：この欄から順に配る。入りきらなかった分は捨てるが、黙っては捨てない
    const r = distribute(cells, i, parts)
    onCells(r.cells)
    setNotice(
      r.dropped.length > 0
        ? `${parts.length}個ありましたが、${i + 1}回目から入るのは${parts.length - r.dropped.length}個なので、最後の「${r.dropped.join(", ")}」は入れていません。`
        : "",
    )
  }
  const replaceAll = (next: string[]) => {
    onCells(next)
    setNotice("")
  }

  return (
    <Section
      id="han"
      num={4}
      title="自分の班のデータを入れてみる"
      lead="授業で記録した10回ぶんの得点を入れよう。偏差・分散・標準偏差を計算して、手計算の答え合わせができる。"
    >
      <MethodTabs options={METHODS} current={method} onChange={onMethod} />

      <div>
        <div className="grid grid-cols-5 gap-2 max-w-xl">
          {cells.map((c, i) => (
            // エラー文は label の外に置く（中にあると欄の名前にも入り、読み上げで2回読まれるため）
            <div key={i} className="flex flex-col">
              <label className="flex flex-col text-xs text-gray-600 dark:text-gray-300">
                {i + 1}回目
                <input
                  type="text"
                  inputMode="numeric"
                  value={c}
                  onChange={(e) => change(i, e.target.value)}
                  aria-invalid={errors[i] !== ""}
                  aria-describedby={errors[i] ? `han-err-${i}` : undefined}
                  className={`mt-0.5 w-full min-w-0 rounded-lg border-2 px-1 py-1.5 text-center text-xl font-bold tabular-nums
                    bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-50
                    ${errors[i] ? "border-warm-500" : "border-gray-300 dark:border-gray-600 focus:border-accent-500"}`}
                />
              </label>
              {errors[i] && (
                <span id={`han-err-${i}`} className="mt-0.5 text-[0.7rem] leading-tight text-warm-700 dark:text-warm-300">{errors[i]}</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-1 text-sm text-warm-700 dark:text-warm-300" aria-live="polite">{notice}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {METHOD_LABEL[method]}は {method === "A" ? "2〜12 の整数" : "2〜12 の偶数"}。1つめの欄に「7,5,9,…」と区切って貼り付けてもよい。
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Btn color="accent" onClick={() => replaceAll(EXAMPLE[method].slice())} className="px-3 py-2">
            例を入れる
          </Btn>
          <Btn
            color="neutral"
            sound="none"
            onClick={() => {
              se.playSe(se.reset)
              replaceAll(EMPTY_CELLS.slice())
            }}
            disabled={filled === 0}
            className="px-3 py-2"
          >
            消す
          </Btn>
        </div>
      </div>

      {values ? (
        <GroupResult method={method} values={values} onShowInSets={onShowInSets} />
      ) : (
        <p className="text-base text-gray-600 dark:text-gray-300">
          {filled < GROUP_SIZE ? `あと ${GROUP_SIZE - filled} 個入れると計算します。` : "まちがっている欄を直すと計算します。"}
        </p>
      )}
    </Section>
  )
}

function GroupResult({ method, values, onShowInSets }: { method: Method; values: number[]; onShowInSets: () => void }) {
  const m = mean(values)
  const devs = deviations(values)
  const v = variance(values)
  const s = sd(values)
  const sumX = values.reduce((a, b) => a + b, 0)
  const sumDev = devs.reduce((a, b) => a + b, 0)
  const sumSq = devs.reduce((a, d) => a + d * d, 0)

  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      <div className="flex flex-col gap-3">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-2 shadow-sm">
          <DotPlot method={method} counts={countScores(values)} n={values.length} mean={m} label="班のデータのドットプロット" />
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            { k: "平均", v: fmt2(m), f: `${sumX} ÷ ${values.length}` },
            { k: "分散", v: fmt2(v), f: `${fmt2(sumSq)} ÷ ${values.length}` },
            { k: "標準偏差", v: fmt2(s), f: `√${fmt2(v)}` },
          ].map((x) => (
            <div key={x.k} className="rounded-xl bg-white dark:bg-gray-800 p-2 shadow-sm">
              <dt className="text-sm font-bold text-gray-600 dark:text-gray-300">{x.k}</dt>
              <dd className={`text-3xl lg:text-4xl font-bold tabular-nums ${METHOD_TEXT[method]}`}>{x.v}</dd>
              <dd className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{x.f}</dd>
            </div>
          ))}
        </dl>
        <Btn color="brand" onClick={onShowInSets} className="self-start px-4 py-2 md:text-base">
          ③ のヒストグラムで位置を見る
        </Btn>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white dark:bg-gray-800 p-2 shadow-sm">
        <table className="w-full text-center tabular-nums text-base">
          <caption className="text-sm text-left text-gray-600 dark:text-gray-300 pb-1">偏差の一覧（偏差 ＝ 得点 − 平均 {fmt2(m)}）</caption>
          <thead>
            <tr className="border-b-2 border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300">
              <th scope="col" className="py-1">回</th>
              <th scope="col">得点</th>
              <th scope="col">偏差</th>
              <th scope="col">偏差の2乗</th>
            </tr>
          </thead>
          <tbody className="text-gray-900 dark:text-gray-50">
            {values.map((x, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                <th scope="row" className="py-0.5 font-normal text-sm text-gray-500 dark:text-gray-400">{i + 1}</th>
                <td>{x}</td>
                <td>{fmtDev(devs[i])}</td>
                <td>{fmt2(devs[i] * devs[i])}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-400 dark:border-gray-500 font-bold">
              <th scope="row" className="py-1 text-sm">合計</th>
              <td>{sumX}</td>
              <td className="text-lg" data-testid="dev-sum">{fmtDev(sumDev)}</td>
              <td>{fmt2(sumSq)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          偏差の合計は、どんなデータでも必ず 0 になる（平均より大きい分と小さい分が打ち消しあう）。
        </p>
      </div>
    </div>
  )
}
