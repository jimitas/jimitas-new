// かけ算（6〜9の段 / 2〜9の段）
// 元: 17_kake2.js
// Mode 0: a（6〜9）× b（1〜9）
// Mode 1: a（2〜9）× b（1〜9）

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateKake2(modeIndex: number): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: number[] = []
  const checkArray: number[] = []

  while (checkArray.length < 20) {
    let a: number
    const b = Math.floor(Math.random() * 9 + 1) // 1〜9

    switch (modeIndex) {
      case 0:
        a = Math.floor(Math.random() * 4 + 6) // 6〜9
        break
      case 1:
        a = Math.floor(Math.random() * 8 + 2) // 2〜9
        break
      default:
        a = Math.floor(Math.random() * 4 + 6)
    }
    const ans = a * b

    const check = a * 100 + b
    if (duplicationCheck(check, checkArray)) {
      checkArray.push(check)
      left.push(a)
      right.push(b)
      answers.push(ans)
    }
  }
  return { left, right, answers }
}
