// ======================================================
// 挿入ソートのコード例（3言語）
//
// 共通テスト方式。作業用の変数 tmp に取り出して、うしろへ1つずつ
// ずらし、あいた場所にさしこむ書き方。
//
//   tmp = Data[i]        … 取り出して手に持つ
//   Data[j+1] = Data[j]  … 1つ右へずらす（穴が左へ動く）
//   Data[j+1] = tmp      … 穴にさしこむ
//
// 論理演算子は and。公式の例示（二分探索）でも
// 「hidari <= migi and owari==0 の間繰り返す:」と書かれている。
//
// 罫線は ｜(U+FF5C) と ⎿(U+23BF)。ブロックの最後の行だけ ⎿。
// ======================================================

import type { CodeSample } from "./types"
import type { LangId } from "../types"

const python: CodeSample = [
  { text: "kazu = len(data)", tag: "init" },
  { text: "for i in range(1, kazu):", tag: "outerLoop" },
  { text: "    tmp = data[i]", tag: "takeOut" },
  { text: "    j = i - 1", tag: "takeOut" },
  { text: "    while j >= 0 and data[j] > tmp:", tag: "compare" },
  { text: "        data[j + 1] = data[j]", tag: "shift" },
  { text: "        j = j - 1", tag: "shift" },
  { text: "    data[j + 1] = tmp", tag: "insert" },
  { text: "print(data)", tag: "finish" },
]

const javascript: CodeSample = [
  { text: "const kazu = data.length", tag: "init" },
  { text: "for (let i = 1; i < kazu; i++) {", tag: "outerLoop" },
  { text: "  const tmp = data[i]", tag: "takeOut" },
  { text: "  let j = i - 1", tag: "takeOut" },
  { text: "  while (j >= 0 && data[j] > tmp) {", tag: "compare" },
  { text: "    data[j + 1] = data[j]", tag: "shift" },
  { text: "    j = j - 1", tag: "shift" },
  { text: "  }" },
  { text: "  data[j + 1] = tmp", tag: "insert" },
  { text: "}" },
  { text: "console.log(data)", tag: "finish" },
]

const kyotsu: CodeSample = [
  { text: "kazu = 要素数(Data)", tag: "init" },
  { text: "i を 1 から kazu-1 まで 1 ずつ増やしながら繰り返す:", tag: "outerLoop" },
  { text: "｜ tmp = Data[i]", tag: "takeOut" },
  { text: "｜ j = i-1", tag: "takeOut" },
  { text: "｜ j >= 0 and Data[j] > tmp の間繰り返す:", tag: "compare" },
  { text: "｜ ｜ Data[j+1] = Data[j]", tag: "shift" },
  { text: "｜ ⎿ j = j - 1", tag: "shift" },
  { text: "⎿ Data[j+1] = tmp", tag: "insert" },
  { text: "表示する(Data)", tag: "finish" },
]

export const insertionCode: Record<LangId, CodeSample> = { python, javascript, kyotsu }
