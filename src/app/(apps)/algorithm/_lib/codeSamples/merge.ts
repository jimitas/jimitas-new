// ======================================================
// マージソート（ボトムアップ）のコード例（3言語）
//
// 再帰を使わない書き方にしてある。
// 共通テスト用プログラム表記の例示には関数定義が出ていないので、
// 繰り返しと分岐だけで書けるボトムアップのほうが表記として素直。
//
// haba（幅）を 1 → 2 → 4 → 8 … と倍にしながら、
// となりあう2つのかたまりを合体していく。
// ======================================================

import type { CodeSample } from "./types"
import type { LangId } from "../types"

const python: CodeSample = [
  { text: "kazu = len(data)", tag: "init" },
  { text: "haba = 1", tag: "init" },
  { text: "while haba < kazu:", tag: "split" },
  { text: "    hidari = 0", tag: "split" },
  { text: "    while hidari + haba < kazu:", tag: "split" },
  { text: "        naka = hidari + haba - 1", tag: "mergeCopy" },
  { text: "        migi = min(hidari + haba * 2 - 1, kazu - 1)", tag: "mergeCopy" },
  { text: "        sagyou = data[hidari : migi + 1]", tag: "mergeCopy" },
  { text: "        p = 0", tag: "mergeCopy" },
  { text: "        q = naka - hidari + 1", tag: "mergeCopy" },
  { text: "        for k in range(hidari, migi + 1):", tag: "mergeBack" },
  { text: "            if p > naka - hidari:", tag: "mergeRest" },
  { text: "                data[k] = sagyou[q]", tag: "mergeRest" },
  { text: "                q = q + 1", tag: "mergeRest" },
  { text: "            elif q > migi - hidari:", tag: "mergeRest" },
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
  { text: "while (haba < kazu) {", tag: "split" },
  { text: "  let hidari = 0", tag: "split" },
  { text: "  while (hidari + haba < kazu) {", tag: "split" },
  { text: "    const naka = hidari + haba - 1", tag: "mergeCopy" },
  { text: "    const migi = Math.min(hidari + haba * 2 - 1, kazu - 1)", tag: "mergeCopy" },
  { text: "    const sagyou = data.slice(hidari, migi + 1)", tag: "mergeCopy" },
  { text: "    let p = 0", tag: "mergeCopy" },
  { text: "    let q = naka - hidari + 1", tag: "mergeCopy" },
  { text: "    for (let k = hidari; k <= migi; k++) {", tag: "mergeBack" },
  { text: "      if (p > naka - hidari) {", tag: "mergeRest" },
  { text: "        data[k] = sagyou[q]; q = q + 1", tag: "mergeRest" },
  { text: "      } else if (q > migi - hidari) {", tag: "mergeRest" },
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
  { text: "haba < kazu の間繰り返す:", tag: "split" },
  { text: "｜ hidari = 0", tag: "split" },
  { text: "｜ hidari + haba < kazu の間繰り返す:", tag: "split" },
  { text: "｜ ｜ naka = hidari + haba - 1", tag: "mergeCopy" },
  { text: "｜ ｜ migi = hidari + haba*2 - 1", tag: "mergeCopy" },
  { text: "｜ ｜ もし migi > kazu-1 ならば:", tag: "mergeCopy" },
  { text: "｜ ｜ ⎿ migi = kazu-1", tag: "mergeCopy" },
  { text: "｜ ｜ Sagyou = Data の hidari から migi までを写したもの", tag: "mergeCopy" },
  { text: "｜ ｜ p = 0 , q = naka - hidari + 1", tag: "mergeCopy" },
  { text: "｜ ｜ k を hidari から migi まで 1 ずつ増やしながら繰り返す:", tag: "mergeBack" },
  { text: "｜ ｜ ｜ もし p > naka - hidari ならば:", tag: "mergeRest" },
  { text: "｜ ｜ ｜ ｜ Data[k] = Sagyou[q] , q = q + 1", tag: "mergeRest" },
  { text: "｜ ｜ ｜ そうでなくもし q > migi - hidari ならば:", tag: "mergeRest" },
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
