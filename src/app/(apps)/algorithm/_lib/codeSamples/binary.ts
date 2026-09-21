// ======================================================
// 二分探索のコード例（3言語）
//
// 大学入試センターの「共通テスト用プログラム表記の例示」に
// 載っているプログラム例が、ちょうどこの二分探索。
// 変数名（hidari / migi / aida / atai / owari）もそれにならっている。
//
// ÷ は商の整数値を返す演算子。Python の // 、
// JavaScript の Math.floor(... / 2) にあたる。
// ======================================================

import type { CodeSample } from "./types"
import type { LangId } from "../types"

const python: CodeSample = [
  { text: "kazu = len(data)", tag: "init" },
  { text: "atai = int(input())", tag: "init" },
  { text: "hidari = 0", tag: "init" },
  { text: "migi = kazu - 1", tag: "init" },
  { text: "owari = 0", tag: "init" },
  { text: "while hidari <= migi and owari == 0:", tag: "searchLoop" },
  { text: "    aida = (hidari + migi) // 2", tag: "midCalc" },
  { text: "    if data[aida] == atai:", tag: "compare" },
  { text: "        print(atai, 'は', aida, '番目にありました')", tag: "found" },
  { text: "        owari = 1", tag: "found" },
  { text: "    elif data[aida] < atai:", tag: "narrowRight" },
  { text: "        hidari = aida + 1", tag: "narrowRight" },
  { text: "    else:", tag: "narrowLeft" },
  { text: "        migi = aida - 1", tag: "narrowLeft" },
  { text: "if owari == 0:", tag: "notfound" },
  { text: "    print(atai, 'は見つかりませんでした')", tag: "notfound" },
]

const javascript: CodeSample = [
  { text: "const kazu = data.length", tag: "init" },
  { text: "const atai = Number(prompt())", tag: "init" },
  { text: "let hidari = 0", tag: "init" },
  { text: "let migi = kazu - 1", tag: "init" },
  { text: "let owari = 0", tag: "init" },
  { text: "while (hidari <= migi && owari === 0) {", tag: "searchLoop" },
  { text: "  const aida = Math.floor((hidari + migi) / 2)", tag: "midCalc" },
  { text: "  if (data[aida] === atai) {", tag: "compare" },
  { text: "    console.log(atai, 'は', aida, '番目にありました')", tag: "found" },
  { text: "    owari = 1", tag: "found" },
  { text: "  } else if (data[aida] < atai) {", tag: "narrowRight" },
  { text: "    hidari = aida + 1", tag: "narrowRight" },
  { text: "  } else {", tag: "narrowLeft" },
  { text: "    migi = aida - 1", tag: "narrowLeft" },
  { text: "  }" },
  { text: "}" },
  { text: "if (owari === 0) {", tag: "notfound" },
  { text: "  console.log(atai, 'は見つかりませんでした')", tag: "notfound" },
  { text: "}" },
]

const kyotsu: CodeSample = [
  { text: "kazu = 要素数(Data)", tag: "init" },
  { text: "atai = 【外部からの入力】", tag: "init" },
  { text: "hidari = 0 , migi = kazu - 1 , owari = 0", tag: "init" },
  { text: "hidari <= migi and owari == 0 の間繰り返す:", tag: "searchLoop" },
  { text: "｜ aida = (hidari + migi) ÷ 2 #÷は商の整数値", tag: "midCalc" },
  { text: "｜ もし Data[aida] == atai ならば:", tag: "compare" },
  { text: "｜ ｜ 表示する(atai,\"は\",aida,\"番目にありました\")", tag: "found" },
  { text: "｜ ｜ owari = 1", tag: "found" },
  { text: "｜ そうでなくもし Data[aida] < atai ならば:", tag: "narrowRight" },
  { text: "｜ ｜ hidari = aida + 1", tag: "narrowRight" },
  { text: "｜ そうでなければ:", tag: "narrowLeft" },
  { text: "⎿ ⎿ migi = aida - 1", tag: "narrowLeft" },
  { text: "もし owari == 0 ならば:", tag: "notfound" },
  { text: "⎿ 表示する(atai,\"は見つかりませんでした\")", tag: "notfound" },
]

export const binaryCode: Record<LangId, CodeSample> = { python, javascript, kyotsu }
