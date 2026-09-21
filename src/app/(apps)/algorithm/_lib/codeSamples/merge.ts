// ======================================================
// マージソート（ボトムアップ）のコード例（3言語）
//
// 再帰を使わない書き方にしてある。
// 共通テスト用プログラム表記の例示には関数定義が出ていないので、
// 繰り返しと分岐だけで書けるボトムアップのほうが表記として素直。
//
// haba（幅）を 1 → 2 → 4 → 8 … と倍にしながら、
// となりあう2つのかたまりを合体していく。
//
// ⚠ 作業用の入れもの（sagyou）は本体と同じ大きさで持ち、
//    読み位置 p / q も**本体と同じ添字**で動かす。
//    範囲ぶんだけ写して p を 0 から始めると、コードの p と
//    画面の L 矢印（本体配列の位置を指す）が hidari ぶんずれる。
//    凡例が「L … コードの p」と言い切っている以上、そこは一致させる。
//    写すのは毎回その範囲だけなので、計算量は増えていない。
// ======================================================

import type { CodeSample } from "./types"
import type { LangId } from "../types"

const python: CodeSample = [
  { text: "kazu = len(data)", tag: "init" },
  { text: "haba = 1", tag: "init" },
  { text: "sagyou = [0] * kazu", tag: "init" },
  { text: "while haba < kazu:", tag: "split" },
  { text: "    hidari = 0", tag: "split" },
  { text: "    while hidari + haba < kazu:", tag: "split" },
  { text: "        naka = hidari + haba - 1", tag: "mergeCopy" },
  { text: "        migi = min(hidari + haba * 2 - 1, kazu - 1)", tag: "mergeCopy" },
  { text: "        sagyou[hidari : migi + 1] = data[hidari : migi + 1]", tag: "mergeCopy" },
  { text: "        p = hidari", tag: "mergeCopy" },
  { text: "        q = naka + 1", tag: "mergeCopy" },
  { text: "        for k in range(hidari, migi + 1):", tag: "mergeBack" },
  { text: "            if p > naka:", tag: "mergeRest" },
  { text: "                data[k] = sagyou[q]", tag: "mergeRest" },
  { text: "                q = q + 1", tag: "mergeRest" },
  { text: "            elif q > migi:", tag: "mergeRest" },
  { text: "                data[k] = sagyou[p]", tag: "mergeRest" },
  { text: "                p = p + 1", tag: "mergeRest" },
  { text: "            elif sagyou[p] <= sagyou[q]:", tag: "compare" },
  { text: "                data[k] = sagyou[p]", tag: "mergeBack" },
  { text: "                p = p + 1", tag: "mergeBack" },
  { text: "            else:", tag: "compare" },
  { text: "                data[k] = sagyou[q]", tag: "mergeBack" },
  { text: "                q = q + 1", tag: "mergeBack" },
  { text: "        hidari = hidari + haba * 2", tag: "split" },
  { text: "    haba = haba * 2", tag: "split" },
  { text: "print(data)", tag: "finish" },
]

const javascript: CodeSample = [
  { text: "const kazu = data.length", tag: "init" },
  { text: "let haba = 1", tag: "init" },
  { text: "const sagyou = new Array(kazu)", tag: "init" },
  { text: "while (haba < kazu) {", tag: "split" },
  { text: "  let hidari = 0", tag: "split" },
  { text: "  while (hidari + haba < kazu) {", tag: "split" },
  { text: "    const naka = hidari + haba - 1", tag: "mergeCopy" },
  { text: "    const migi = Math.min(hidari + haba * 2 - 1, kazu - 1)", tag: "mergeCopy" },
  { text: "    for (let t = hidari; t <= migi; t++) sagyou[t] = data[t]", tag: "mergeCopy" },
  { text: "    let p = hidari", tag: "mergeCopy" },
  { text: "    let q = naka + 1", tag: "mergeCopy" },
  { text: "    for (let k = hidari; k <= migi; k++) {", tag: "mergeBack" },
  { text: "      if (p > naka) {", tag: "mergeRest" },
  { text: "        data[k] = sagyou[q]; q = q + 1", tag: "mergeRest" },
  { text: "      } else if (q > migi) {", tag: "mergeRest" },
  { text: "        data[k] = sagyou[p]; p = p + 1", tag: "mergeRest" },
  { text: "      } else if (sagyou[p] <= sagyou[q]) {", tag: "compare" },
  { text: "        data[k] = sagyou[p]; p = p + 1", tag: "mergeBack" },
  { text: "      } else {", tag: "compare" },
  { text: "        data[k] = sagyou[q]; q = q + 1", tag: "mergeBack" },
  { text: "      }" },
  { text: "    }" },
  { text: "    hidari = hidari + haba * 2", tag: "split" },
  { text: "  }" },
  { text: "  haba = haba * 2", tag: "split" },
  { text: "}" },
  { text: "console.log(data)", tag: "finish" },
]

const kyotsu: CodeSample = [
  { text: "kazu = 要素数(Data)", tag: "init" },
  { text: "haba = 1", tag: "init" },
  { text: "Sagyou = Data を写したもの", tag: "init" },
  { text: "haba < kazu の間繰り返す:", tag: "split" },
  { text: "｜ hidari = 0", tag: "split" },
  { text: "｜ hidari + haba < kazu の間繰り返す:", tag: "split" },
  { text: "｜ ｜ naka = hidari + haba - 1", tag: "mergeCopy" },
  { text: "｜ ｜ migi = hidari + haba*2 - 1", tag: "mergeCopy" },
  { text: "｜ ｜ もし migi > kazu-1 ならば:", tag: "mergeCopy" },
  { text: "｜ ｜ ⎿ migi = kazu-1", tag: "mergeCopy" },
  { text: "｜ ｜ Sagyou の hidari から migi までに Data の同じところを写す", tag: "mergeCopy" },
  { text: "｜ ｜ p = hidari , q = naka + 1", tag: "mergeCopy" },
  { text: "｜ ｜ k を hidari から migi まで 1 ずつ増やしながら繰り返す:", tag: "mergeBack" },
  { text: "｜ ｜ ｜ もし p > naka ならば:", tag: "mergeRest" },
  { text: "｜ ｜ ｜ ｜ Data[k] = Sagyou[q] , q = q + 1", tag: "mergeRest" },
  { text: "｜ ｜ ｜ そうでなくもし q > migi ならば:", tag: "mergeRest" },
  { text: "｜ ｜ ｜ ｜ Data[k] = Sagyou[p] , p = p + 1", tag: "mergeRest" },
  { text: "｜ ｜ ｜ そうでなくもし Sagyou[p] <= Sagyou[q] ならば:", tag: "compare" },
  { text: "｜ ｜ ｜ ｜ Data[k] = Sagyou[p] , p = p + 1", tag: "mergeBack" },
  { text: "｜ ｜ ｜ そうでなければ:", tag: "compare" },
  { text: "｜ ｜ ⎿ ⎿ Data[k] = Sagyou[q] , q = q + 1", tag: "mergeBack" },
  { text: "｜ ⎿ hidari = hidari + haba*2", tag: "split" },
  { text: "⎿ haba = haba * 2", tag: "split" },
  { text: "表示する(Data)", tag: "finish" },
]

export const mergeCode: Record<LangId, CodeSample> = { python, javascript, kyotsu }
