// ======================================================
// バブルソートのコード例（3言語）
//
// 早期終了つき。1巡のあいだ1回も入れかえが起きなければ止める。
// 共通テスト用プログラム表記には break にあたる書き方が示されていないため、
// 公式の二分探索の例（owari というフラグを while の条件に入れる）と
// 同じやり方でそろえている。
//
// 罫線は ｜(U+FF5C) と ⎿(U+23BF)。ブロックの最後の行だけ ⎿。
// 記法の出典は docs/共通テスト用プログラム表記.md を参照。
// ======================================================

import type { CodeSample } from "./types"
import type { LangId } from "../types"

const python: CodeSample = [
  { text: "kazu = len(data)", tag: "init" },
  { text: "koukan = 1", tag: "init" },
  { text: "i = 0", tag: "init" },
  { text: "while koukan == 1:", tag: "outerLoop" },
  { text: "    koukan = 0", tag: "outerLoop" },
  { text: "    for j in range(0, kazu - 1 - i):", tag: "innerLoop" },
  { text: "        if data[j + 1] < data[j]:", tag: "compare" },
  { text: "            data[j], data[j+1] = data[j+1], data[j]", tag: "swap" },
  { text: "            koukan = 1", tag: "swap" },
  { text: "    i = i + 1", tag: "markSorted" },
  { text: "print(data)", tag: "finish" },
]

const javascript: CodeSample = [
  { text: "const kazu = data.length", tag: "init" },
  { text: "let koukan = 1", tag: "init" },
  { text: "let i = 0", tag: "init" },
  { text: "while (koukan === 1) {", tag: "outerLoop" },
  { text: "  koukan = 0", tag: "outerLoop" },
  { text: "  for (let j = 0; j < kazu - 1 - i; j++) {", tag: "innerLoop" },
  { text: "    if (data[j + 1] < data[j]) {", tag: "compare" },
  { text: "      const tmp = data[j]", tag: "swap" },
  { text: "      data[j] = data[j + 1]", tag: "swap" },
  { text: "      data[j + 1] = tmp", tag: "swap" },
  { text: "      koukan = 1", tag: "swap" },
  { text: "    }" },
  { text: "  }" },
  { text: "  i = i + 1", tag: "markSorted" },
  { text: "}" },
  { text: "console.log(data)", tag: "finish" },
]

const kyotsu: CodeSample = [
  { text: "kazu = 要素数(Data)", tag: "init" },
  { text: "koukan = 1 , i = 0", tag: "init" },
  { text: "koukan == 1 の間繰り返す:", tag: "outerLoop" },
  { text: "｜ koukan = 0", tag: "outerLoop" },
  { text: "｜ j を 0 から kazu-2-i まで 1 ずつ増やしながら繰り返す:", tag: "innerLoop" },
  { text: "｜ ｜ もし Data[j+1] < Data[j] ならば:", tag: "compare" },
  { text: "｜ ｜ ｜ tmp = Data[j]", tag: "swap" },
  { text: "｜ ｜ ｜ Data[j] = Data[j+1]", tag: "swap" },
  { text: "｜ ｜ ｜ Data[j+1] = tmp", tag: "swap" },
  { text: "｜ ⎿ ⎿ koukan = 1", tag: "swap" },
  { text: "⎿ i = i + 1", tag: "markSorted" },
  { text: "表示する(Data)", tag: "finish" },
]

export const bubbleCode: Record<LangId, CodeSample> = { python, javascript, kyotsu }
