// 小数のかけ算
// 元: 30_shousu_kakezan.js
// Mode 0: 整数×小数（decimal column 9問）
// Mode 1: 小数×小数（decimal column 9問）
// Mode 2: 小数×小数(2)（decimal2 column 9問）

import { OneLineResult } from "../types"
import { duplicationCheck } from "../duplicationCheck"

export function generateShousuKake(modeIndex: number): OneLineResult {
  const left: number[] = []
  const right: number[] = []
  const answers: (number | string)[] = []
  const checkArray: number[] = []

  while (checkArray.length < 9) {
    let a: number, b: number

    switch (modeIndex) {
      case 0: // 整数×小数
        a = Math.floor(Math.random() * 90 + 10)
        b = Math.floor(Math.random() * 70 + 10) / 10
        if (Number.isInteger(b)) b = Math.min(b + a / 10, 9.9)
        break
      case 1: // 小数×小数
        a = Math.floor(Math.random() * 90 + 10) / 10
        if (Number.isInteger(a)) a = Math.min(a + a / 10, 9.9)
        b = Math.floor(Math.random() * 90 + 10) / 10
        if (Number.isInteger(b)) b = Math.min(b + b / 10, 9.9)
        break
      case 2: // 小数×小数(2) ○.○○×○.○
        a = Math.floor(Math.random() * 900 + 100) / 100
        if (Number.isInteger(a) || Number.isInteger(a * 10)) a = Math.min(a + 0.01, 9.99)
        b = Math.floor(Math.random() * 90 + 10) / 10
        if (Number.isInteger(b)) b = Math.min(b + b / 10, 9.9)
        break
      default:
        a = 10; b = 1.1
    }

    const ans = Math.round(a * b * 1000) / 1000

    const check = Number((a * 100 + b).toFixed(0))
    if (duplicationCheck(check, checkArray)) {
      checkArray.push(check)
      left.push(a)
      right.push(b)
      answers.push(ans)
    }
  }
  return { left, right, answers }
}
