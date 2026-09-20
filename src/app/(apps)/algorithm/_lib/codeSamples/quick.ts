// ======================================================
// クイックソートのコード例（3言語）
//
// ⚠ 共通テスト用プログラム表記の例示には「関数の定義のしかた」が
//    出ていない。クイックソートは自分自身を呼ぶ形が本質なので、
//    ここでは Python の書き方に合わせて「関数 名前(引数):」と補っている。
//    画面にもその旨を出している。
//
// 仕分けは Lomuto 方式。範囲の右はしを基準にする。
// ======================================================

import type { CodeSample } from "./types"
import type { LangId } from "../types"

const python: CodeSample = [
  { text: "def shiwake(hidari, migi):", tag: "pivotSelect" },
  { text: "    kijun = data[migi]", tag: "pivotSelect" },
  { text: "    i = hidari - 1", tag: "pivotSelect" },
  { text: "    for j in range(hidari, migi):", tag: "partition" },
  { text: "        if data[j] < kijun:", tag: "compare" },
  { text: "            i = i + 1", tag: "swap" },
  { text: "            data[i], data[j] = data[j], data[i]", tag: "swap" },
  { text: "    data[i+1], data[migi] = data[migi], data[i+1]", tag: "swap" },
  { text: "    return i + 1", tag: "partition" },
  { text: "" },
  { text: "def quicksort(hidari, migi):", tag: "init" },
  { text: "    if hidari < migi:", tag: "init" },
  { text: "        p = shiwake(hidari, migi)", tag: "pivotSelect" },
  { text: "        quicksort(hidari, p - 1)", tag: "recurseLeft" },
  { text: "        quicksort(p + 1, migi)", tag: "recurseRight" },
  { text: "" },
  { text: "quicksort(0, len(data) - 1)", tag: "init" },
  { text: "print(data)", tag: "finish" },
]

const javascript: CodeSample = [
  { text: "function shiwake(hidari, migi) {", tag: "pivotSelect" },
  { text: "  const kijun = data[migi]", tag: "pivotSelect" },
  { text: "  let i = hidari - 1", tag: "pivotSelect" },
  { text: "  for (let j = hidari; j < migi; j++) {", tag: "partition" },
  { text: "    if (data[j] < kijun) {", tag: "compare" },
  { text: "      i = i + 1", tag: "swap" },
  { text: "      const t = data[i]; data[i] = data[j]; data[j] = t", tag: "swap" },
  { text: "    }" },
  { text: "  }" },
  { text: "  const t = data[i+1]; data[i+1] = data[migi]; data[migi] = t", tag: "swap" },
  { text: "  return i + 1", tag: "partition" },
  { text: "}" },
  { text: "" },
  { text: "function quicksort(hidari, migi) {", tag: "init" },
  { text: "  if (hidari < migi) {", tag: "init" },
  { text: "    const p = shiwake(hidari, migi)", tag: "pivotSelect" },
  { text: "    quicksort(hidari, p - 1)", tag: "recurseLeft" },
  { text: "    quicksort(p + 1, migi)", tag: "recurseRight" },
  { text: "  }" },
  { text: "}" },
  { text: "" },
  { text: "quicksort(0, data.length - 1)", tag: "init" },
  { text: "console.log(data)", tag: "finish" },
]

const kyotsu: CodeSample = [
  { text: "関数 仕分け(hidari, migi):", tag: "pivotSelect" },
  { text: "｜ kijun = Data[migi]", tag: "pivotSelect" },
  { text: "｜ i = hidari - 1", tag: "pivotSelect" },
  { text: "｜ j を hidari から migi-1 まで 1 ずつ増やしながら繰り返す:", tag: "partition" },
  { text: "｜ ｜ もし Data[j] < kijun ならば:", tag: "compare" },
  { text: "｜ ｜ ｜ i = i + 1", tag: "swap" },
  { text: "｜ ｜ ｜ tmp = Data[i]", tag: "swap" },
  { text: "｜ ｜ ｜ Data[i] = Data[j]", tag: "swap" },
  { text: "｜ ⎿ ⎿ Data[j] = tmp", tag: "swap" },
  { text: "｜ tmp = Data[i+1]", tag: "swap" },
  { text: "｜ Data[i+1] = Data[migi]", tag: "swap" },
  { text: "｜ Data[migi] = tmp", tag: "swap" },
  { text: "⎿ i+1 を返す", tag: "partition" },
  { text: "" },
  { text: "関数 クイックソート(hidari, migi):", tag: "init" },
  { text: "｜ もし hidari < migi ならば:", tag: "init" },
  { text: "｜ ｜ p = 仕分け(hidari, migi)", tag: "pivotSelect" },
  { text: "｜ ｜ クイックソート(hidari, p-1)", tag: "recurseLeft" },
  { text: "⎿ ⎿ クイックソート(p+1, migi)", tag: "recurseRight" },
  { text: "" },
  { text: "クイックソート(0, 要素数(Data)-1)", tag: "init" },
  { text: "表示する(Data)", tag: "finish" },
]

export const quickCode: Record<LangId, CodeSample> = { python, javascript, kyotsu }
