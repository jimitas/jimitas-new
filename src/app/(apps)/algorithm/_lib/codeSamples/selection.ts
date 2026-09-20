// ======================================================
// 選択ソートのコード例（3言語）
//
// 3言語で変数名をそろえてある（data / kazu / i / j / saisho / tmp）。
// 大学入試センターの例示でも、疑似言語と Python3 の対比例は
// 同じローマ字の変数名（hidari / migi / aida など）を使っている。
//
// 疑似言語の罫線は ｜（U+FF5C 全角縦線）と ⎿（U+23BF）。
// 半角の | や └（U+2514）ではないので、書きかえるときは注意すること。
// ブロックの最後の行だけ ⎿ で、それ以外は ｜。入れ子は記号を重ねる。
// 記法の出典は docs/共通テスト用プログラム表記.md を参照。
// ======================================================

import type { CodeSample } from "./types"
import type { LangId } from "../types"

const python: CodeSample = [
  { text: "kazu = len(data)", tag: "init" },
  { text: "for i in range(0, kazu - 1):", tag: "outerLoop" },
  { text: "    saisho = i", tag: "outerLoop" },
  { text: "    for j in range(i + 1, kazu):", tag: "innerLoop" },
  { text: "        if data[j] < data[saisho]:", tag: "compare" },
  { text: "            saisho = j", tag: "updateMin" },
  { text: "    data[i], data[saisho] = data[saisho], data[i]", tag: "swap" },
  { text: "print(data)", tag: "finish" },
]

const javascript: CodeSample = [
  { text: "const kazu = data.length", tag: "init" },
  { text: "for (let i = 0; i < kazu - 1; i++) {", tag: "outerLoop" },
  { text: "  let saisho = i", tag: "outerLoop" },
  { text: "  for (let j = i + 1; j < kazu; j++) {", tag: "innerLoop" },
  { text: "    if (data[j] < data[saisho]) {", tag: "compare" },
  { text: "      saisho = j", tag: "updateMin" },
  { text: "    }" },
  { text: "  }" },
  { text: "  const tmp = data[i]", tag: "swap" },
  { text: "  data[i] = data[saisho]", tag: "swap" },
  { text: "  data[saisho] = tmp", tag: "swap" },
  { text: "}" },
  { text: "console.log(data)", tag: "finish" },
]

const kyotsu: CodeSample = [
  { text: "kazu = 要素数(Data)", tag: "init" },
  { text: "i を 0 から kazu-2 まで 1 ずつ増やしながら繰り返す:", tag: "outerLoop" },
  { text: "｜ saisho = i", tag: "outerLoop" },
  { text: "｜ j を i+1 から kazu-1 まで 1 ずつ増やしながら繰り返す:", tag: "innerLoop" },
  { text: "｜ ｜ もし Data[j] < Data[saisho] ならば:", tag: "compare" },
  { text: "｜ ⎿ ⎿ saisho = j", tag: "updateMin" },
  { text: "｜ tmp = Data[i]", tag: "swap" },
  { text: "｜ Data[i] = Data[saisho]", tag: "swap" },
  { text: "⎿ Data[saisho] = tmp", tag: "swap" },
  { text: "表示する(Data)", tag: "finish" },
]

export const selectionCode: Record<LangId, CodeSample> = {
  python,
  javascript,
  kyotsu,
}
