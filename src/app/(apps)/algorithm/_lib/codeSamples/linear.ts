// ======================================================
// 線形探索のコード例（3言語）
//
// 見つかったら止めたいが、共通テスト用プログラム表記には break にあたる
// 書き方が示されていない。公式の二分探索の例と同じく、owari というフラグを
// 繰り返しの条件に入れる形にそろえている。
// 3言語ともその形に合わせて、見くらべられるようにした。
// ======================================================

import type { CodeSample } from "./types"
import type { LangId } from "../types"

const python: CodeSample = [
  { text: "kazu = len(data)", tag: "init" },
  { text: "atai = int(input())", tag: "init" },
  { text: "i = 0", tag: "init" },
  { text: "owari = 0", tag: "init" },
  { text: "while i < kazu and owari == 0:", tag: "searchLoop" },
  { text: "    if data[i] == atai:", tag: "compare" },
  { text: "        print(atai, 'は', i, '番目にありました')", tag: "found" },
  { text: "        owari = 1", tag: "found" },
  { text: "    else:", tag: "searchLoop" },
  { text: "        i = i + 1", tag: "searchLoop" },
  { text: "if owari == 0:", tag: "notfound" },
  { text: "    print(atai, 'は見つかりませんでした')", tag: "notfound" },
]

const javascript: CodeSample = [
  { text: "const kazu = data.length", tag: "init" },
  { text: "const atai = Number(prompt())", tag: "init" },
  { text: "let i = 0", tag: "init" },
  { text: "let owari = 0", tag: "init" },
  { text: "while (i < kazu && owari === 0) {", tag: "searchLoop" },
  { text: "  if (data[i] === atai) {", tag: "compare" },
  { text: "    console.log(atai, 'は', i, '番目にありました')", tag: "found" },
  { text: "    owari = 1", tag: "found" },
  { text: "  } else {", tag: "searchLoop" },
  { text: "    i = i + 1", tag: "searchLoop" },
  { text: "  }" },
  { text: "}" },
  { text: "if (owari === 0) {", tag: "notfound" },
  { text: "  console.log(atai, 'は見つかりませんでした')", tag: "notfound" },
  { text: "}" },
]

const kyotsu: CodeSample = [
  { text: "kazu = 要素数(Data)", tag: "init" },
  { text: "atai = 【外部からの入力】", tag: "init" },
  { text: "i = 0 , owari = 0", tag: "init" },
  { text: "i < kazu and owari == 0 の間繰り返す:", tag: "searchLoop" },
  { text: "｜ もし Data[i] == atai ならば:", tag: "compare" },
  { text: "｜ ｜ 表示する(atai,\"は\",i,\"番目にありました\")", tag: "found" },
  { text: "｜ ｜ owari = 1", tag: "found" },
  { text: "｜ そうでなければ:", tag: "searchLoop" },
  { text: "⎿ ⎿ i = i + 1", tag: "searchLoop" },
  { text: "もし owari == 0 ならば:", tag: "notfound" },
  { text: "⎿ 表示する(atai,\"は見つかりませんでした\")", tag: "notfound" },
]

export const linearCode: Record<LangId, CodeSample> = { python, javascript, kyotsu }
