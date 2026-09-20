// ======================================================
// 挿入ソートのコード例（3言語）
//
// となりと入れかえながら左へ歩かせる書き方。
// 教科書でよく見る「作業用の変数に取り出して1つずつずらす」書き方とは
// 見た目がちがうが、くらべる回数は同じ。
// 画面で値が2つに見える状態を作らないために、こちらを採っている。
// （理由は _lib/sorts.ts の insertionSort のコメントに書いてある）
//
// 論理演算子は and。公式の例示（二分探索）でも
// 「hidari <= migi and owari==0 の間繰り返す:」と書かれている。
// ======================================================

import type { CodeSample } from "./types"
import type { LangId } from "../types"

const python: CodeSample = [
  { text: "kazu = len(data)", tag: "init" },
  { text: "for i in range(1, kazu):", tag: "outerLoop" },
  { text: "    j = i", tag: "outerLoop" },
  { text: "    while j > 0 and data[j] < data[j - 1]:", tag: "compare" },
  { text: "        data[j-1], data[j] = data[j], data[j-1]", tag: "swap" },
  { text: "        j = j - 1", tag: "swap" },
  { text: "print(data)", tag: "finish" },
]

const javascript: CodeSample = [
  { text: "const kazu = data.length", tag: "init" },
  { text: "for (let i = 1; i < kazu; i++) {", tag: "outerLoop" },
  { text: "  let j = i", tag: "outerLoop" },
  { text: "  while (j > 0 && data[j] < data[j - 1]) {", tag: "compare" },
  { text: "    const tmp = data[j - 1]", tag: "swap" },
  { text: "    data[j - 1] = data[j]", tag: "swap" },
  { text: "    data[j] = tmp", tag: "swap" },
  { text: "    j = j - 1", tag: "swap" },
  { text: "  }" },
  { text: "}" },
  { text: "console.log(data)", tag: "finish" },
]

const kyotsu: CodeSample = [
  { text: "kazu = 要素数(Data)", tag: "init" },
  { text: "i を 1 から kazu-1 まで 1 ずつ増やしながら繰り返す:", tag: "outerLoop" },
  { text: "｜ j = i", tag: "outerLoop" },
  { text: "｜ j > 0 and Data[j] < Data[j-1] の間繰り返す:", tag: "compare" },
  { text: "｜ ｜ tmp = Data[j-1]", tag: "swap" },
  { text: "｜ ｜ Data[j-1] = Data[j]", tag: "swap" },
  { text: "｜ ｜ Data[j] = tmp", tag: "swap" },
  { text: "⎿ ⎿ j = j - 1", tag: "swap" },
  { text: "表示する(Data)", tag: "finish" },
]

export const insertionCode: Record<LangId, CodeSample> = { python, javascript, kyotsu }
