// ======================================================
// 交換ソート（単純交換ソート）のコード例（3言語）
//
// バブルソートとの違いは「くらべる相手」。
//   バブル : Data[j] と Data[j+1]（となりどうし）
//   交換   : Data[j] と Data[i]（i のうしろ全部と1つずつ）
// 見くらべやすいよう、外側・内側の繰り返しは選択ソートとそろえてある。
// ======================================================

import type { CodeSample } from "./types"
import type { LangId } from "../types"

const python: CodeSample = [
  { text: "kazu = len(data)", tag: "init" },
  { text: "for i in range(0, kazu - 1):", tag: "outerLoop" },
  { text: "    for j in range(i + 1, kazu):", tag: "innerLoop" },
  { text: "        if data[j] < data[i]:", tag: "compare" },
  { text: "            data[i], data[j] = data[j], data[i]", tag: "swap" },
  { text: "print(data)", tag: "finish" },
]

const javascript: CodeSample = [
  { text: "const kazu = data.length", tag: "init" },
  { text: "for (let i = 0; i < kazu - 1; i++) {", tag: "outerLoop" },
  { text: "  for (let j = i + 1; j < kazu; j++) {", tag: "innerLoop" },
  { text: "    if (data[j] < data[i]) {", tag: "compare" },
  { text: "      const tmp = data[i]", tag: "swap" },
  { text: "      data[i] = data[j]", tag: "swap" },
  { text: "      data[j] = tmp", tag: "swap" },
  { text: "    }" },
  { text: "  }" },
  { text: "}" },
  { text: "console.log(data)", tag: "finish" },
]

const kyotsu: CodeSample = [
  { text: "kazu = 要素数(Data)", tag: "init" },
  { text: "i を 0 から kazu-2 まで 1 ずつ増やしながら繰り返す:", tag: "outerLoop" },
  { text: "｜ j を i+1 から kazu-1 まで 1 ずつ増やしながら繰り返す:", tag: "innerLoop" },
  { text: "｜ ｜ もし Data[j] < Data[i] ならば:", tag: "compare" },
  { text: "｜ ｜ ｜ tmp = Data[i]", tag: "swap" },
  { text: "｜ ｜ ｜ Data[i] = Data[j]", tag: "swap" },
  { text: "⎿ ⎿ ⎿ Data[j] = tmp", tag: "swap" },
  { text: "表示する(Data)", tag: "finish" },
]

export const exchangeCode: Record<LangId, CodeSample> = { python, javascript, kyotsu }
