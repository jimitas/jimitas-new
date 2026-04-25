// 2けたをかけるかけ算の筆算
// 元: 24_kake_hissan2.js
// Mode 0: 2けた×2けた（9問 = 3行×3列）
// Mode 1: 3けた×2けた（9問 = 3行×3列）

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateKakeHissan2(modeIndex: number): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: number[] = []
  const checkArray: number[] = []

  while (checkArray.length < 9) {
    let a: number, b: number

    switch (modeIndex) {
      case 0: // 2けた×2けた
        a = Math.floor(Math.random() * 90 + 10)
        b = Math.floor(Math.random() * 90 + 10)
        break
      case 1: // 3けた×2けた
        a = Math.floor(Math.random() * 889 + 100)
        b = Math.floor(Math.random() * 90 + 10)
        break
      default:
        a = 10; b = 10
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
